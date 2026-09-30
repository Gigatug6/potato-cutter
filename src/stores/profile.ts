import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { createRng } from '../game/core/rng'
import { CRATE_PRICE, KNIVES, STARTER_KNIFE_ID, knifeById, type KnifeDef } from '../game/data/knives'
import { openCrate as rollCrate, type CrateResult } from '../game/economy/crate'
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

  function toSave(): SaveV1 {
    return {
      version: 1, money: money.value, totalEarned: totalEarned.value,
      ownedKnives: ownedKnives.value, equippedKnifeId: equippedKnifeId.value,
      stats: stats.value, settings: settings.value,
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
    clearSave()
  }

  return { money, totalEarned, ownedKnives, equippedKnifeId, stats, settings, equippedKnife, owns, canAfford, earn, buy, equip, openCrate, toSave, resetSave }
})
