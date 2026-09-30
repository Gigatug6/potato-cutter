// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { CUT_MODES } from '../game/cutting/cutModes'
import { ACHIEVEMENTS } from '../game/data/achievements'
import { DECOR } from '../game/data/decor'
import { KNIVES } from '../game/data/knives'
import { BAD_LOOKS, POTATOES } from '../game/data/potatoes'
import { RARITY_META } from '../game/data/rarities'
import { UPGRADES } from '../game/data/upgrades'
import { DISHES } from '../game/orders/orders'
import { setLanguage } from './dom'
import { tr } from './translate'

// mots identiques en français et en anglais (noms propres, etc.)
const SAME = new Set(['Bintje', 'Ratte', 'Désirée', 'Vitelotte', 'Rare', 'Studio', 'Excalipatate', 'Collection', 'Menu', 'Perfection'])

describe('i18n — couverture des données', () => {
  const strings: string[] = [
    ...KNIVES.flatMap((k) => [k.name, k.description]),
    ...POTATOES.flatMap((p) => [p.name, p.description]),
    ...Object.values(BAD_LOOKS).map((b) => b.label),
    ...UPGRADES.flatMap((u) => [u.name, u.description]),
    ...DECOR.flatMap((d) => [d.name, d.description]),
    ...ACHIEVEMENTS.flatMap((a) => [a.name, a.description]),
    ...DISHES.map((d) => d.label),
    ...Object.values(CUT_MODES).map((m) => m.label),
    ...Object.values(RARITY_META).map((r) => r.label),
  ]
  it('chaque texte de donnée a une traduction', () => {
    const missing = strings.filter((s) => tr(s) === s && !SAME.has(s))
    expect(missing).toEqual([])
  })
})

describe('i18n — règles dynamiques', () => {
  it.each([
    ['Épluché 12 %', 'Peeled 12 %'],
    ['Coupes 3/7', 'Cuts 3/7'],
    ['🔪 Office rouillé', '🔪 Rusty paring knife'],
    ['Acheter · 1 500 🥔', 'Buy · 1 500 🥔'],
    ['Niveau 2/5', 'Level 2/5'],
    ['Gains ×1.4', 'Earnings ×1.4'],
    ['Succès débloqué : Première patate', 'Achievement unlocked: First potato'],
    ['Coupe ta première patate. · +50 🥔', 'Cut your first potato. · +50 🥔'],
    ['🥔 Chips croustillantes', '🥔 Crispy chips'],
    ['rondelles · ≥ D', 'slices · ≥ D'],
    ['Rondelles · note ≥ S', 'Slices · grade ≥ S'],
    ['🍽 Gratin dauphinois livré : + 240 🥔', '🍽 Potato gratin delivered: + 240 🥔'],
    ['Faire 4 patates en frites', 'Do 4 potatoes as fries'],
    ['Couper 7 patates', 'Cut 7 potatoes'],
    ['  Boutique  ', '  Shop  '],
    ['Texte inconnu', 'Texte inconnu'],
  ])('%s → %s', (fr, en) => expect(tr(fr)).toBe(en))
})

describe('i18n — DOM', () => {
  it('traduit, suit les mises à jour de Vue et restaure le français', async () => {
    document.body.innerHTML = '<main><button aria-label="Volume de la musique">Jouer</button><p id="p">Épluché 10 %</p></main>'
    setLanguage('en')
    expect(document.querySelector('button')!.textContent).toBe('Play')
    expect(document.querySelector('button')!.getAttribute('aria-label')).toBe('Music volume')
    expect(document.documentElement.lang).toBe('en')
    // mise à jour comme le ferait Vue (nouveau texte français)
    document.getElementById('p')!.firstChild!.nodeValue = 'Épluché 55 %'
    await Promise.resolve()
    expect(document.getElementById('p')!.textContent).toBe('Peeled 55 %')
    // nœud ajouté après coup
    document.body.insertAdjacentHTML('beforeend', '<span>Boutique</span>')
    await Promise.resolve()
    expect(document.body.lastElementChild!.textContent).toBe('Shop')
    setLanguage('fr')
    expect(document.querySelector('button')!.textContent).toBe('Jouer')
    expect(document.querySelector('button')!.getAttribute('aria-label')).toBe('Volume de la musique')
    expect(document.getElementById('p')!.textContent).toBe('Épluché 55 %') // dernière valeur française écrite par « Vue »
    expect(document.body.lastElementChild!.textContent).toBe('Boutique')
    expect(document.documentElement.lang).toBe('fr')
  })
})
