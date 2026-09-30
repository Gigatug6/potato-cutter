// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { CODE_RE, formatCode, generateCode, normalizeCode, readSaveFile } from './cloud'

describe('cloud', () => {
  it('generateCode : 16 caractères base32, tous différents d’un appel à l’autre', () => {
    const a = generateCode(), b = generateCode()
    expect(a).toMatch(CODE_RE)
    expect(a).not.toBe(b)
    expect(generateCode(() => new Uint8Array(16))).toBe('AAAAAAAAAAAAAAAA')
  })
  it('normalizeCode accepte tirets, espaces, minuscules ; rejette le reste', () => {
    expect(normalizeCode('abcd-efgh ijkl mnop')).toBe('ABCDEFGHIJKLMNOP')
    expect(normalizeCode('ABCD')).toBe('')
    expect(normalizeCode('ABCDEFGHIJKLMNO1')).toBe('') // « 1 » hors alphabet base32
    expect(formatCode('ABCDEFGHIJKLMNOP')).toBe('ABCD-EFGH-IJKL-MNOP')
  })
  it('readSaveFile : répare une sauvegarde partielle, refuse le non-JSON et les mauvaises versions', async () => {
    const ok = await readSaveFile(new File([JSON.stringify({ version: 1, money: 42 })], 's.json'))
    expect(ok?.money).toBe(42)
    expect(ok?.equippedKnifeId).toBe('office-rouille')
    expect(await readSaveFile(new File(['pas du json'], 's.json'))).toBeNull()
    expect(await readSaveFile(new File([JSON.stringify({ version: 7 })], 's.json'))).toBeNull()
  })
})
