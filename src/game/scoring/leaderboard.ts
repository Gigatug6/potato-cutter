import type { CutModeId } from '../cutting/cutModes'

export interface ScoreEntry { score: number; potatoes: number; mode: CutModeId; date: string }

export const LEADERBOARD_SIZE = 10
export const CHALLENGE_SECONDS = 60

/** Insère un score ; renvoie la liste triée (top 10) et le rang (1-based) ou null si hors classement. */
export function addScore(list: ScoreEntry[], entry: ScoreEntry): { list: ScoreEntry[]; rank: number | null } {
  const merged = [...list, entry].sort((a, b) => b.score - a.score || a.date.localeCompare(b.date))
  const top = merged.slice(0, LEADERBOARD_SIZE)
  const idx = top.indexOf(entry)
  return { list: top, rank: idx === -1 ? null : idx + 1 }
}
