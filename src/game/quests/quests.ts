import { createRng } from '../core/rng'
import type { CutModeId } from '../cutting/cutModes'
import { gradeAtLeast } from '../orders/orders'
import type { Grade } from '../scoring/scoring'

export type QuestType = 'potatoes' | 'goodGrade' | 'earn' | 'mode'

export interface Quest {
  id: string
  type: QuestType
  label: string
  target: number
  progress: number
  reward: number
  claimed: boolean
  mode?: CutModeId
}

export interface QuestState { day: string; items: Quest[] }

export const todayKey = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

const MODE_LABEL: Record<CutModeId, string> = { rondelles: 'rondelles', frites: 'frites', des: 'dés' }

export function generateQuests(day: string): Quest[] {
  const rng = createRng(hash(day))
  const between = (a: number, b: number) => a + Math.floor(rng() * (b - a + 1))
  const n1 = between(5, 10)
  const n2 = between(2, 4)
  const quests: Quest[] = [
    { id: `${day}-potatoes`, type: 'potatoes', label: `Couper ${n1} patates`, target: n1, progress: 0, reward: n1 * 30, claimed: false },
    { id: `${day}-goodGrade`, type: 'goodGrade', label: `Obtenir ${n2} notes A ou S`, target: n2, progress: 0, reward: n2 * 80, claimed: false },
  ]
  if (rng() < 0.5) {
    const t = between(2, 5) * 100
    quests.push({ id: `${day}-earn`, type: 'earn', label: `Gagner ${t} 🥔`, target: t, progress: 0, reward: Math.floor(t / 2), claimed: false })
  } else {
    const modes: CutModeId[] = ['rondelles', 'frites', 'des']
    const mode = modes[Math.floor(rng() * 3)]
    const t = between(3, 5)
    quests.push({ id: `${day}-mode`, type: 'mode', mode, label: `Faire ${t} patates en ${MODE_LABEL[mode]}`, target: t, progress: 0, reward: t * 50, claimed: false })
  }
  return quests
}

/** Quêtes du jour ; régénérées si le jour a changé. */
export function ensureQuests(state: QuestState | null, day = todayKey()): QuestState {
  return state && state.day === day && state.items.length ? state : { day, items: generateQuests(day) }
}

export function applyRound(items: Quest[], r: { mode: CutModeId; grade: Grade; reward: number }): Quest[] {
  return items.map((q) => {
    let add = 0
    if (q.type === 'potatoes') add = 1
    else if (q.type === 'goodGrade') add = gradeAtLeast(r.grade, 'A') ? 1 : 0
    else if (q.type === 'earn') add = r.reward
    else if (q.type === 'mode') add = q.mode === r.mode ? 1 : 0
    return add && !q.claimed ? { ...q, progress: Math.min(q.target, q.progress + add) } : q
  })
}

export const isComplete = (q: Quest): boolean => q.progress >= q.target
