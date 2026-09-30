import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { createRng } from '../game/core/rng'
import { CRATE_PRICE, KNIVES, STARTER_KNIFE_ID, knifeById, type KnifeDef } from '../game/data/knives'
import { openCrate as rollCrate, type CrateResult } from '../game/economy/crate'
import type { CutModeId } from '../game/cutting/cutModes'
import { POTATOES, STARTER_POTATO_ID, potatoById } from '../game/data/potatoes'
import { upgradeById, upgradePrice, upgradeValueMult } from '../game/data/upgrades'
import { ensureOrders, matchOrder, orderBonus, type Order } from '../game/orders/orders'
import { applyRound, ensureQuests, isComplete, todayKey, type QuestState } from '../game/quests/quests'
import { addScore, type ScoreEntry } from '../game/scoring/leaderboard'
import type { Grade } from '../game/scoring/scoring'
import { defaultSave, type SaveV1 } from '../game/save/saveSchema'
import { clearSave, loadSave } from '../game/save/storage'

export type BuyResult = 'ok' | 'owned' | 'poor' | 'crateOnly' | 'unknown'

export const useProfileStore = defineStore('profile', () => {
  const s = loadSave()
  const money = ref(s.money)
  const totalEarned = ref(s.totalEarned)
  const ownedKnives = ref(s.ownedKnives)
  const equippedKnifeId = ref(s.equippedKnifeId)
  const stats = ref(s.stats)
  const settings = ref(s.settings)
  const unlockedPotatoes = ref(s.unlockedPotatoes)
  const selectedPotatoId = ref(s.selectedPotatoId)
  const upgrades = ref(s.upgrades)
  const orders = ref<Order[]>(s.orders)
  const quests = ref<QuestState | null>(s.quests)
  const leaderboard = ref<ScoreEntry[]>(s.leaderboard)

  const equippedKnife = computed<KnifeDef>(() => knifeById(equippedKnifeId.value) ?? KNIVES[0])
  const owns = (id: string): boolean => !!ownedKnives.value[id]
  const canAfford = (id: string): boolean => {
    const k = knifeById(id)
    return !!k && k.price !== null && money.value >= k.price
  }

  function earn(n: number): void {
    const v = Math.max(0, Math.floor(n))
    money.value += v
    totalEarned.value += v
  }

  function addOwned(id: string): void {
    const cur = ownedKnives.value[id]
    ownedKnives.value[id] = { acquiredAt: cur?.acquiredAt ?? Date.now(), count: (cur?.count ?? 0) + 1 }
  }

  function buy(id: string): BuyResult {
    const k = knifeById(id)
    if (!k) return 'unknown'
    if (owns(id)) return 'owned'
    if (k.price === null) return 'crateOnly'
    if (money.value < k.price) return 'poor'
    money.value -= k.price
    addOwned(id)
    return 'ok'
  }

  function equip(id: string): boolean {
    if (!owns(id)) return false
    equippedKnifeId.value = id
    return true
  }

  function openCrate(rng = createRng(Date.now() >>> 0)): CrateResult | null {
    if (money.value < CRATE_PRICE) return null
    money.value -= CRATE_PRICE
    const res = rollCrate(rng, new Set(Object.keys(ownedKnives.value)))
    if (res.duplicate) earn(res.refund)
    else addOwned(res.knifeId)
    return res
  }

  // ---------- patates ----------
  const selectedPotato = computed(() => potatoById(selectedPotatoId.value) ?? POTATOES[0])
  const hasPotato = (id: string): boolean => unlockedPotatoes.value.includes(id)

  function buyPotato(id: string): BuyResult {
    const p = potatoById(id)
    if (!p) return 'unknown'
    if (hasPotato(id)) return 'owned'
    if (money.value < p.price) return 'poor'
    money.value -= p.price
    unlockedPotatoes.value = [...unlockedPotatoes.value, id]
    return 'ok'
  }

  function selectPotato(id: string): boolean {
    if (!hasPotato(id)) return false
    selectedPotatoId.value = id
    return true
  }

  // ---------- améliorations ----------
  const upgradeLevel = (id: string): number => upgrades.value[id] ?? 0
  const valueMult = computed(() => selectedPotato.value.valueMult * upgradeValueMult(upgrades.value))

  function buyUpgrade(id: string): 'ok' | 'poor' | 'max' | 'unknown' {
    const def = upgradeById(id)
    if (!def) return 'unknown'
    const price = upgradePrice(def, upgradeLevel(id))
    if (price === null) return 'max'
    if (money.value < price) return 'poor'
    money.value -= price
    upgrades.value = { ...upgrades.value, [id]: upgradeLevel(id) + 1 }
    return 'ok'
  }

  // ---------- commandes & quêtes ----------
  function refreshOrders(): void {
    orders.value = ensureOrders(orders.value, createRng(Date.now() >>> 0))
  }

  function refreshQuests(day = todayKey()): void {
    quests.value = ensureQuests(quests.value, day)
  }

  function claimQuest(id: string): number {
    const q = quests.value?.items.find((x) => x.id === id)
    if (!q || q.claimed || !isComplete(q)) return 0
    q.claimed = true
    earn(q.reward)
    return q.reward
  }

  /** Après une manche : quêtes + commande livrée. Renvoie la commande et son bonus (déjà crédité). */
  function recordRound(r: { mode: CutModeId; grade: Grade; reward: number }): { order: Order; bonus: number } | null {
    refreshQuests()
    quests.value = { ...quests.value!, items: applyRound(quests.value!.items, r) }
    refreshOrders()
    const order = matchOrder(orders.value, r.mode, r.grade)
    if (!order) return null
    const bonus = orderBonus(r.reward, order)
    earn(bonus)
    orders.value = ensureOrders(orders.value.filter((o) => o.id !== order.id), createRng(Date.now() >>> 0))
    return { order, bonus }
  }

  function submitScore(entry: ScoreEntry): number | null {
    const res = addScore(leaderboard.value, entry)
    leaderboard.value = res.list
    return res.rank
  }

  function toSave(): SaveV1 {
    return {
      version: 1, money: money.value, totalEarned: totalEarned.value,
      ownedKnives: ownedKnives.value, equippedKnifeId: equippedKnifeId.value,
      stats: stats.value, settings: settings.value,
      unlockedPotatoes: unlockedPotatoes.value, selectedPotatoId: selectedPotatoId.value, upgrades: upgrades.value,
      orders: orders.value, quests: quests.value, leaderboard: leaderboard.value,
    }
  }

  function resetSave(): void {
    const d = defaultSave()
    money.value = d.money
    totalEarned.value = d.totalEarned
    ownedKnives.value = d.ownedKnives
    equippedKnifeId.value = STARTER_KNIFE_ID
    stats.value = d.stats
    settings.value = d.settings
    unlockedPotatoes.value = d.unlockedPotatoes
    selectedPotatoId.value = STARTER_POTATO_ID
    upgrades.value = d.upgrades
    orders.value = []
    quests.value = null
    leaderboard.value = []
    clearSave()
  }

  refreshOrders()
  refreshQuests()

  return { unlockedPotatoes, selectedPotatoId, upgrades, orders, quests, leaderboard, selectedPotato, hasPotato, buyPotato, selectPotato, upgradeLevel, valueMult, buyUpgrade, refreshOrders, refreshQuests, claimQuest, recordRound, submitScore, money, totalEarned, ownedKnives, equippedKnifeId, stats, settings, equippedKnife, owns, canAfford, earn, buy, equip, openCrate, toSave, resetSave }
})
