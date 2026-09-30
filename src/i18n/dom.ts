import type { Lang } from '../game/save/saveSchema'
import { tr } from './translate'

/**
 * Traducteur DOM : en anglais, remplace les textes et attributs d'accessibilité français par leur équivalent (dictionnaire i18n/en.ts).
 * Les originaux sont mémorisés (WeakMap) : retour au français sans rechargement ; un MutationObserver suit les rendus de Vue.
 */
const ATTRS = ['aria-label', 'title', 'alt', 'placeholder']
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CANVAS'])

interface Memo { orig: string; out: string }
const textMemo = new WeakMap<Node, Memo>()
const attrMemo = new WeakMap<Element, Map<string, Memo>>()
let current: Lang = 'fr'
let observer: MutationObserver | null = null

function translateText(node: Node): void {
  const v = node.nodeValue ?? ''
  const m = textMemo.get(node)
  if (current === 'en') {
    if (m && v === m.out) return
    const out = tr(v)
    textMemo.set(node, { orig: v, out })
    if (out !== v) node.nodeValue = out
  } else if (m) {
    if (v === m.out && m.out !== m.orig) node.nodeValue = m.orig
    textMemo.delete(node)
  }
}

function translateAttr(el: Element, name: string): void {
  const v = el.getAttribute(name)
  if (v === null) return
  let map = attrMemo.get(el)
  if (!map) attrMemo.set(el, (map = new Map()))
  const m = map.get(name)
  if (current === 'en') {
    if (m && v === m.out) return
    const out = tr(v)
    map.set(name, { orig: v, out })
    if (out !== v) el.setAttribute(name, out)
  } else if (m) {
    if (v === m.out && m.out !== m.orig) el.setAttribute(name, m.orig)
    map.delete(name)
  }
}

function walk(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) { translateText(root); return }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return
  if (root.nodeType === Node.ELEMENT_NODE) {
    const el = root as Element
    for (const a of ATTRS) translateAttr(el, a)
    if (SKIP.has(el.tagName)) return
  }
  root.childNodes.forEach(walk)
}

function translateTitle(): void {
  const t = document.querySelector('title')
  if (t?.firstChild) translateText(t.firstChild)
}

function onMutations(records: MutationRecord[]): void {
  for (const r of records) {
    if (r.type === 'characterData') translateText(r.target)
    else if (r.type === 'attributes') translateAttr(r.target as Element, r.attributeName!)
    else r.addedNodes.forEach(walk)
  }
  translateTitle()
}

/** Applique la langue à tout le document et suit les changements ultérieurs. */
export function setLanguage(lang: Lang): void {
  current = lang
  document.documentElement.lang = lang
  observer?.disconnect()
  walk(document.body)
  translateTitle()
  if (lang === 'en') {
    observer ??= new MutationObserver(onMutations)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS })
    observer.observe(document.head, { childList: true, subtree: true, characterData: true })
  }
}
