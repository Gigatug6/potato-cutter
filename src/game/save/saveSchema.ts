import { KNIVES, STARTER_KNIFE_ID } from '../data/knives'
import type { CutModeId } from '../cutting/cutModes'

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
  settings: { sound: boolean; reducedMotion: boolean; pixelRatioCap: number }
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
    settings: { sound: true, reducedMotion: false, pixelRatioCap: 2 },
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
  }
  return s
}
