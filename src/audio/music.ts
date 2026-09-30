import { sharedContext } from './sfx'

/** Musique générative « lofi » + ambiance de cuisine, synthétisées en WebAudio (aucun fichier audio). */

export interface MoodMusic { tempo: number; chords: number[][]; melodyScale: number[]; brightness: number }

const n = (name: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B', oct: number, sharp = 0): number =>
  12 * (oct + 1) + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[name] + sharp

// accords en numéros MIDI (septièmes) ; gammes pentatoniques pour la mélodie
export const MOODS: Record<string, MoodMusic> = {
  'mood-studio': { tempo: 78, brightness: 0.6, chords: [[n('C', 3), n('E', 3), n('G', 3), n('B', 3)], [n('A', 2), n('C', 3), n('E', 3), n('G', 3)], [n('D', 3), n('F', 3), n('A', 3), n('C', 4)], [n('G', 2), n('B', 2), n('D', 3), n('F', 3)]], melodyScale: [60, 62, 64, 67, 69, 72, 74, 76] },
  'mood-day': { tempo: 92, brightness: 0.85, chords: [[n('C', 3), n('E', 3), n('G', 3)], [n('G', 2), n('B', 2), n('D', 3)], [n('A', 2), n('C', 3), n('E', 3)], [n('F', 2), n('A', 2), n('C', 3)]], melodyScale: [67, 69, 72, 74, 76, 79, 81], },
  'mood-sunset': { tempo: 70, brightness: 0.5, chords: [[n('F', 2), n('A', 2), n('C', 3), n('E', 3)], [n('E', 2), n('G', 2), n('B', 2), n('D', 3)], [n('D', 3), n('F', 3), n('A', 3), n('C', 4)], [n('C', 3), n('E', 3), n('G', 3), n('B', 3)]], melodyScale: [65, 67, 69, 72, 74, 77, 79] },
  'mood-night': { tempo: 62, brightness: 0.3, chords: [[n('A', 2), n('C', 3), n('E', 3), n('G', 3), n('B', 3)], [n('F', 2), n('A', 2), n('C', 3), n('E', 3)], [n('D', 3), n('F', 3), n('A', 3), n('C', 4), n('E', 4)], [n('E', 2), n('G', 2, 1), n('B', 2), n('D', 3)]], melodyScale: [57, 60, 62, 64, 67, 69, 72] },
}

export const midiToFreq = (m: number): number => 440 * 2 ** ((m - 69) / 12)
export const chordFreqs = (midis: number[]): number[] => midis.map(midiToFreq)
export const moodFor = (id: string): MoodMusic => MOODS[id] ?? MOODS['mood-studio']

export class Music {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private noise: AudioBuffer | null = null
  private volume = 0.3
  private mood: MoodMusic = MOODS['mood-studio']
  private nextTime = 0
  private step = 0
  private ambience: AudioBufferSourceNode | null = null

  get running(): boolean {
    return this.timer !== null
  }

  setMood(id: string): void {
    this.mood = moodFor(id)
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v))
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.volume * 0.5, this.ctx.currentTime, 0.2)
    if (this.volume === 0) this.stop()
  }

  /** Démarre (à appeler après un geste utilisateur). Sans effet si le volume est nul ou WebAudio absent. */
  start(): void {
    if (this.timer || this.volume === 0) return
    const ctx = sharedContext()
    if (!ctx) return
    this.ctx = ctx
    const master = ctx.createGain()
    master.gain.value = 0
    const comp = ctx.createDynamicsCompressor()
    master.connect(comp).connect(ctx.destination)
    master.gain.setTargetAtTime(this.volume * 0.5, ctx.currentTime, 0.6)
    this.master = master
    this.startAmbience(ctx, master)
    this.nextTime = ctx.currentTime + 0.1
    this.step = 0
    this.timer = setInterval(() => this.schedule(), 100)
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    try { this.ambience?.stop() } catch { /* déjà arrêté */ }
    this.ambience = null
    if (this.master && this.ctx) {
      const m = this.master
      m.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15)
      setTimeout(() => m.disconnect(), 800)
    }
    this.master = null
  }

  private noiseBuf(ctx: AudioContext): AudioBuffer {
    if (!this.noise) {
      this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
      const d = this.noise.getChannelData(0)
      let last = 0
      for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5 } // bruit brun
    }
    return this.noise
  }

  /** Ambiance : souffle de cuisine grave et continu. */
  private startAmbience(ctx: AudioContext, out: AudioNode): void {
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuf(ctx)
    src.loop = true
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 500
    const g = ctx.createGain()
    g.gain.value = 0.09
    src.connect(f).connect(g).connect(out)
    src.start()
    this.ambience = src
  }

  private schedule(): void {
    const ctx = this.ctx
    if (!ctx || !this.master) return
    const beat = 60 / this.mood.tempo
    const eighth = beat / 2
    while (this.nextTime < ctx.currentTime + 0.35) {
      this.playStep(ctx, this.nextTime, this.step, beat)
      this.nextTime += eighth
      this.step++
    }
  }

  private playStep(ctx: AudioContext, t: number, step: number, beat: number): void {
    const m = this.mood
    const inBar = step % 8 // croches
    const bar = Math.floor(step / 8)
    const chord = m.chords[bar % m.chords.length]
    if (inBar === 0) {
      this.pad(ctx, t, chordFreqs(chord), beat * 4)
      this.tone(ctx, t, midiToFreq(chord[0] - 12), beat * 1.6, 'sine', 0.5, 300)
    }
    if (inBar === 4) this.tone(ctx, t, midiToFreq(chord[0] - 12), beat * 1.2, 'sine', 0.35, 300)
    if (inBar === 0 || inBar === 4) this.kick(ctx, t)
    this.hat(ctx, t, inBar % 2 === 0 ? 0.05 : 0.025)
    // mélodie clairsemée (pentatonique), en retard de swing
    if (Math.random() < 0.3) {
      const note = m.melodyScale[Math.floor(Math.random() * m.melodyScale.length)]
      this.tone(ctx, t + (inBar % 2 ? beat * 0.06 : 0), midiToFreq(note), beat * 1.1, 'triangle', 0.2 * (0.5 + m.brightness), 1800 * (0.5 + m.brightness))
    }
    // petit scintillement d'ambiance
    if (Math.random() < 0.03) this.tone(ctx, t, midiToFreq(96 + Math.floor(Math.random() * 5)), 0.5, 'sine', 0.05, 6000)
  }

  private tone(ctx: AudioContext, t: number, freq: number, dur: number, type: OscillatorType, gain: number, cutoff: number): void {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    const f = ctx.createBiquadFilter()
    o.type = type
    o.frequency.value = freq
    f.type = 'lowpass'
    f.frequency.value = cutoff
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(f).connect(g).connect(this.master!)
    o.start(t)
    o.stop(t + dur + 0.05)
  }

  private pad(ctx: AudioContext, t: number, freqs: number[], dur: number): void {
    freqs.forEach((fr, i) => {
      for (const det of [-5, 5]) {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        const f = ctx.createBiquadFilter()
        o.type = 'triangle'
        o.frequency.value = fr
        o.detune.value = det
        f.type = 'lowpass'
        f.frequency.value = 900 * (0.6 + this.mood.brightness)
        g.gain.setValueAtTime(0.0001, t)
        g.gain.linearRampToValueAtTime(0.05, t + 0.5 + i * 0.03)
        g.gain.linearRampToValueAtTime(0.0001, t + dur)
        o.connect(f).connect(g).connect(this.master!)
        o.start(t)
        o.stop(t + dur + 0.05)
      }
    })
  }

  private kick(ctx: AudioContext, t: number): void {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.setValueAtTime(110, t)
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12)
    g.gain.setValueAtTime(0.35, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
    o.connect(g).connect(this.master!)
    o.start(t)
    o.stop(t + 0.22)
  }

  private hat(ctx: AudioContext, t: number, gain: number): void {
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuf(ctx)
    const f = ctx.createBiquadFilter()
    f.type = 'highpass'
    f.frequency.value = 7000
    const g = ctx.createGain()
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
    src.connect(f).connect(g).connect(this.master!)
    src.start(t, Math.random(), 0.06)
  }
}

export const music = new Music()
