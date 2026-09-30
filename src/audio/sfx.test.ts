// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { playBuy, playChop, playCoin, playError, playScratch, playSizzle, setSoundEnabled } from './sfx'

describe('sfx', () => {
  it('ne lève pas sans WebAudio', () => {
    expect(() => { playChop(); playCoin(); playScratch(); playError(); playSizzle(); playBuy() }).not.toThrow()
  })
  it('son coupé : aucun effet', () => {
    setSoundEnabled(false)
    expect(() => playChop()).not.toThrow()
    setSoundEnabled(true)
  })
})
