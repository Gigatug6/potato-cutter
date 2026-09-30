import { describe, expect, it } from 'vitest'
import { captureFileName } from './share'

describe('share', () => {
  it('nom de fichier horodaté', () => {
    expect(captureFileName(new Date(2026, 8, 5, 7, 4, 9))).toBe('potato-cutter-20260905-070409.png')
  })
})
