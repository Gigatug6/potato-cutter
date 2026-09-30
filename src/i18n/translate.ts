import { EXACT, RULES } from './en'

export type { Lang } from '../game/save/saveSchema'

const LEAD = /^([^\p{L}\p{N}]+?)\s+(\S.*)$/u

function core(s: string): string {
  const exact = EXACT[s]
  if (exact !== undefined) return exact
  for (const [re, fn] of RULES) {
    const m = s.match(re)
    if (m) return fn(m, tr)
  }
  // émoji/symboles en tête : on traduit le reste (« 🥔 Chips croustillantes »)
  const lead = s.match(LEAD)
  if (lead) {
    const rest = core(lead[2])
    if (rest !== lead[2]) return `${lead[1]} ${rest}`
  }
  return s
}

/** FR → EN (identité si inconnu). Conserve les espaces de début/fin. */
export function tr(s: string): string {
  const t = s.trim()
  if (!t) return s
  const out = core(t)
  return out === t ? s : s.replace(t, out)
}
