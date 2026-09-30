// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { DECOR } from '../game/data/decor'
import { MOODS, Music, chordFreqs, midiToFreq, moodFor } from './music'

describe('music', () => {
  it('midiToFreq : La4 = 440 Hz, octave = ×2', () => {
    expect(midiToFreq(69)).toBeCloseTo(440)
    expect(midiToFreq(81)).toBeCloseTo(880)
    expect(chordFreqs([60, 64, 67])).toHaveLength(3)
  })
  it('une musique par ambiance du décor, accords et gammes valides', () => {
    for (const d of DECOR.filter((x) => x.category === 'mood')) expect(MOODS[d.id]).toBeDefined()
    for (const m of Object.values(MOODS)) {
      expect(m.tempo).toBeGreaterThan(50)
      expect(m.chords.length).toBe(4)
      for (const c of m.chords) for (const note of c) expect(note).toBeGreaterThan(30)
    }
    expect(moodFor('inconnu')).toBe(MOODS['mood-studio'])
  })
  it('sans WebAudio : aucun effet, pas d’exception', () => {
    const m = new Music()
    expect(() => { m.start(); m.setVolume(0.5); m.setMood('mood-night'); m.stop() }).not.toThrow()
    expect(m.running).toBe(false)
  })
})
