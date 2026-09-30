import { defaultSave, parseSave, type SaveV1 } from './saveSchema'

export const SAVE_KEY = 'potato-cutter:save'

export function loadSave(): SaveV1 {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return raw ? parseSave(JSON.parse(raw)) : defaultSave()
  } catch {
    return defaultSave()
  }
}

export function writeSave(save: SaveV1): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save))
  } catch {
    /* quota / mode privé : on ignore */
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    /* ignore */
  }
}
