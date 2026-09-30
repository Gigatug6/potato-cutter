/** Effets sonores synthétisés (WebAudio), aucun asset. Sans effet si WebAudio est indisponible ou son coupé. */
let ctx: AudioContext | null = null
let enabled = true
let noise: AudioBuffer | null = null
let lastScratch = 0

export function setSoundEnabled(v: boolean): void {
  enabled = v
}

function audio(): AudioContext | null {
  if (!enabled) return null
  try {
    const Ctor = globalThis.AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx ??= new Ctor()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function noiseBuffer(c: AudioContext): AudioBuffer {
  if (!noise) {
    noise = c.createBuffer(1, c.sampleRate * 0.3, c.sampleRate)
    const d = noise.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  return noise
}

/** Grattage d'épluchure (limité à ~8/s). */
export function playScratch(): void {
  const now = performance.now()
  if (now - lastScratch < 120) return
  const c = audio()
  if (!c) return
  lastScratch = now
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c)
  const f = c.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = 1800 + Math.random() * 1200
  const g = c.createGain()
  g.gain.setValueAtTime(0.12, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12)
  src.connect(f).connect(g).connect(c.destination)
  src.start()
  src.stop(c.currentTime + 0.13)
}

/** « Chop » : sinus grave à enveloppe courte + clic. */
export function playChop(): void {
  const c = audio()
  if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(180, c.currentTime)
  o.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.12)
  g.gain.setValueAtTime(0.5, c.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15)
  o.connect(g).connect(c.destination)
  o.start()
  o.stop(c.currentTime + 0.16)
}

/** Pièce : deux sinus aigus. */
export function playCoin(): void {
  const c = audio()
  if (!c) return
  ;[988, 1319].forEach((freq, i) => {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'sine'
    o.frequency.value = freq
    const t = c.currentTime + i * 0.09
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
    o.connect(g).connect(c.destination)
    o.start(t)
    o.stop(t + 0.26)
  })
}
