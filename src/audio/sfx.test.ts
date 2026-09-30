// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { playChop, playCoin, playScratch, setSoundEnabled } from './sfx'

describe('sfx', () => {
  it('ne lève pas sans WebAudio', () => {
    expect(() => { playChop(); playCoin(); playScratch() }).not.toThrow()
  })
  it('son coupé : aucun effet', () => {
    setSoundEnabled(false)
    expect(() => playChop()).not.toThrow()
    setSoundEnabled(true)
  })
})
