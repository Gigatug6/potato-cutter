import { KNIVES, STARTER_KNIFE_ID } from '../data/knives'
import type { CutModeId } from '../cutting/cutModes'
import { ORDER_COUNT, type Order } from '../orders/orders'
import { POTATOES, STARTER_POTATO_ID } from '../data/potatoes'
import { DEFAULT_DECOR, decorById, sanitizeEquipped } from '../data/decor'
import { UPGRADES } from '../data/upgrades'
import type { QuestState } from '../quests/quests'
import type { ScoreEntry } from '../scoring/leaderboard'

export type Quality = 'low' | 'high' | 'ultra'
export const QUALITIES: Quality[] = ['low', 'high', 'ultra']

export interface SaveV1 {
  version: 1
  money: number
  totalEarned: number
  ownedKnives: Record<string, { acquiredAt: number; count: number }>
  equippedKnifeId: string
  stats: {
    potatoes: number
    bestGrade: Record<CutModeId, string | null>
    bestTimeMs: Record<CutModeId, number | null>
    streak: number
  }
  settings: { sound: boolean; reducedMotion: boolean; pixelRatioCap: number; quality: Quality }
  // ajouts phase 6 (tous optionnels dans les anciennes sauvegardes, réparés par parseSave)
  unlockedPotatoes: string[]
  selectedPotatoId: string
  upgrades: Record<string, number>
  orders: Order[]
  quests: QuestState | null
  leaderboard: ScoreEntry[]
  decorOwned: string[]
  decorEquipped: string[]
}

const MODES: CutModeId[] = ['rondelles', 'frites', 'des']
const GRADES = ['S', 'A', 'B', 'C', 'D']

export function defaultSave(): SaveV1 {
  return {
    version: 1, money: 0, totalEarned: 0,
    ownedKnives: { [STARTER_KNIFE_ID]: { acquiredAt: 0, count: 1 } },
    equippedKnifeId: STARTER_KNIFE_ID,
    stats: {
      potatoes: 0, streak: 0,
      bestGrade: { rondelles: null, frites: null, des: null },
      bestTimeMs: { rondelles: null, frites: null, des: null },
    },
    settings: { sound: true, reducedMotion: false, pixelRatioCap: 2, quality: 'high' },
    unlockedPotatoes: [STARTER_POTATO_ID],
    selectedPotatoId: STARTER_POTATO_ID,
    upgrades: {},
    orders: [],
    quests: null,
    leaderboard: [],
    decorOwned: [...DEFAULT_DECOR],
    decorEquipped: [...DEFAULT_DECOR],
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const num = (v: unknown, def: number, min = 0, max = Number.MAX_SAFE_INTEGER): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.floor(v))) : def

/** Ne lève jamais : répare toute donnée invalide. */
export function parseSave(raw: unknown): SaveV1 {
  const d = defaultSave()
  if (!isObj(raw) || raw.version !== 1) return d
  const s = d
  s.money = num(raw.money, 0)
  s.totalEarned = num(raw.totalEarned, 0)
  if (isObj(raw.ownedKnives)) {
    for (const k of KNIVES) {
      const e = (raw.ownedKnives as Record<string, unknown>)[k.id]
      if (isObj(e)) s.ownedKnives[k.id] = { acquiredAt: num(e.acquiredAt, 0), count: Math.max(1, num(e.count, 1)) }
    }
  }
  s.equippedKnifeId =
    typeof raw.equippedKnifeId === 'string' && s.ownedKnives[raw.equippedKnifeId] ? raw.equippedKnifeId : STARTER_KNIFE_ID
  if (isObj(raw.stats)) {
    const st = raw.stats
    s.stats.potatoes = num(st.potatoes, 0)
    s.stats.streak = num(st.streak, 0)
    for (const m of MODES) {
      const g = isObj(st.bestGrade) ? st.bestGrade[m] : null
      s.stats.bestGrade[m] = typeof g === 'string' && GRADES.includes(g) ? g : null
      const t = isObj(st.bestTimeMs) ? st.bestTimeMs[m] : null
      s.stats.bestTimeMs[m] = typeof t === 'number' && Number.isFinite(t) && t > 0 ? t : null
    }
  }
  if (isObj(raw.settings)) {
    s.settings.sound = typeof raw.settings.sound === 'boolean' ? raw.settings.sound : true
    s.settings.reducedMotion = typeof raw.settings.reducedMotion === 'boolean' ? raw.settings.reducedMotion : false
    s.settings.pixelRatioCap = num(raw.settings.pixelRatioCap, 2, 1, 3)
    s.settings.quality = QUALITIES.includes(raw.settings.quality as Quality) ? (raw.settings.quality as Quality) : 'high'
  }
  const knownPotatoes = POTATOES.map((p) => p.id)
  if (Array.isArray(raw.unlockedPotatoes)) {
    s.unlockedPotatoes = [...new Set([STARTER_POTATO_ID, ...raw.unlockedPotatoes.filter((x): x is string => typeof x === 'string' && knownPotatoes.includes(x))])]
  }
  s.selectedPotatoId =
    typeof raw.selectedPotatoId === 'string' && s.unlockedPotatoes.includes(raw.selectedPotatoId) ? raw.selectedPotatoId : STARTER_POTATO_ID
  if (isObj(raw.upgrades)) {
    for (const u of UPGRADES) s.upgrades[u.id] = num(raw.upgrades[u.id], 0, 0, u.max)
  }
  if (Array.isArray(raw.orders)) {
    s.orders = raw.orders.filter(validOrder).slice(0, ORDER_COUNT)
  }
  if (isObj(raw.quests) && typeof raw.quests.day === 'string' && Array.isArray(raw.quests.items)) {
    const items = raw.quests.items.filter(validQuest)
    s.quests = items.length ? { day: raw.quests.day, items } : null
  }
  if (Array.isArray(raw.leaderboard)) {
    s.leaderboard = raw.leaderboard.filter(validScore).sort((a, b) => b.score - a.score).slice(0, 10)
  }
  const ownedDecor = Array.isArray(raw.decorOwned)
    ? raw.decorOwned.filter((x): x is string => typeof x === 'string' && !!decorById(x))
    : []
  s.decorOwned = [...new Set([...DEFAULT_DECOR, ...ownedDecor])]
  s.decorEquipped = sanitizeEquipped(raw.decorEquipped, s.decorOwned)
  return s
}

const validMode = (m: unknown): m is CutModeId => typeof m === 'string' && (MODES as string[]).includes(m)
const validGrade = (g: unknown): boolean => typeof g === 'string' && GRADES.includes(g)

function validOrder(o: unknown): o is Order {
  return isObj(o) && typeof o.id === 'string' && typeof o.dishId === 'string' && validMode(o.mode) && validGrade(o.minGrade) &&
    typeof o.multiplier === 'number' && Number.isFinite(o.multiplier) && typeof o.label === 'string'
}

function validQuest(q: unknown): q is QuestState['items'][number] {
  return isObj(q) && typeof q.id === 'string' && typeof q.label === 'string' && ['potatoes', 'goodGrade', 'earn', 'mode'].includes(q.type as string) &&
    typeof q.target === 'number' && q.target > 0 && typeof q.progress === 'number' && q.progress >= 0 &&
    typeof q.reward === 'number' && q.reward >= 0 && typeof q.claimed === 'boolean' && (q.mode === undefined || validMode(q.mode))
}

function validScore(e: unknown): e is ScoreEntry {
  return isObj(e) && typeof e.score === 'number' && Number.isFinite(e.score) && e.score >= 0 && typeof e.potatoes === 'number' && validMode(e.mode) && typeof e.date === 'string'
}
