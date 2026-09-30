import type { Quality } from './game/save/saveSchema'

/** Qualité réellement appliquée : ?fx=low|high|ultra dans l'URL prime ; les navigateurs automatisés (Playwright) restent en « low » (WebGL logiciel). */
export function effectiveQuality(saved: Quality): Quality {
  const p = new URLSearchParams(window.location.search).get('fx')
  if (p === 'low' || p === 'high' || p === 'ultra') return p
  if (navigator.webdriver) return 'low'
  return saved
}
