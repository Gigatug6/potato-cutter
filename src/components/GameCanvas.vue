<script setup lang="ts">
import { markRaw, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { playChop, playCoin, playError, playScratch, playSizzle, setSoundEnabled } from '../audio/sfx'
import { autoPeelSpeed, potatoScale } from '../game/data/upgrades'
import { installDebug } from '../debug'
import { effectiveQuality } from '../quality'
import { music } from '../audio/music'
import { shareCapture } from '../share'
import { decorById } from '../game/data/decor'
import { Engine } from '../engine/Engine'
import { engineRef } from '../engine/bridge'
import { useGameStore } from '../stores/game'
import { useProfileStore } from '../stores/profile'

const host = ref<HTMLDivElement>()
const lost = ref(false)
const photo = ref({ active: false, samples: 0, compiling: false, error: '' })
interface Floater { id: number; x: number; y: number; text: string; big: boolean }
const floaters = ref<Floater[]>([])
let floaterId = 0
function addFloater(x: number, y: number, text: string, big = false) {
  const id = ++floaterId
  floaters.value.push({ id, x, y, text, big })
  setTimeout(() => (floaters.value = floaters.value.filter((f) => f.id !== id)), 1100)
}
void autoPeelSpeed
const game = useGameStore()
const profile = useProfileStore()
let engine: Engine | null = null
const offs: (() => void)[] = []

// Le menu s'affiche d'abord ; la scène 3D (textures, HDRI, shaders) s'initialise ensuite, hors du chemin critique.
onMounted(() => {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(init, { timeout: 700 })
    else setTimeout(init, 50)
  }))
})

function moodId(ids: string[]): string {
  return ids.find((i) => decorById(i)?.category === 'mood') ?? 'mood-studio'
}

// la musique démarre au premier geste (politique d'autoplay des navigateurs)
function armMusic() {
  const go = () => { music.setMood(moodId(profile.decorEquipped)); music.setVolume(profile.settings.music); music.start() }
  window.addEventListener('pointerdown', go, { once: true })
  window.addEventListener('keydown', go, { once: true })
}

function init() {
  if (engine || !host.value) return
  armMusic()
  setSoundEnabled(profile.settings.sound)
  engine = markRaw(new Engine(host.value!, {
    knife: profile.equippedKnife,
    pixelRatioCap: profile.settings.pixelRatioCap,
    reducedMotion: profile.settings.reducedMotion,
    quality: effectiveQuality(profile.settings.quality),
    adaptive: !navigator.webdriver, // les tests automatisés gardent une résolution stable
    decor: profile.decorEquipped,
  }))
  engineRef.current = engine
  const ev = engine.events
  offs.push(
    ev.on('peelProgress', (c) => { game.setPeelCoverage(c); if (game.phase === 'peeling' && c > 0) playScratch() }),
    ev.on('cut', (p) => { game.registerCut(p.pieceCount); playChop(); if (!profile.settings.reducedMotion) addFloater(p.screen.x, p.screen.y, '✂') }),
    ev.on('cutRejected', () => playError()),
    ev.on('fried', () => { game.resultsVisible = true; playSizzle() }),
    ev.on('contextLost', () => (lost.value = true)),
    ev.on('photo', (p) => (photo.value = { active: p.active, samples: p.samples, compiling: p.compiling, error: p.error ?? '' })),
    ev.on('allCutsDone', () => engine?.finish()),
    ev.on('finished', ({ bounds, cuts }) => {
      const res = game.finishRound(bounds, cuts)
      playCoin()
      if (res && host.value && !profile.settings.reducedMotion) addFloater(host.value.clientWidth / 2, host.value.clientHeight * 0.3, `+${res.reward + (game.round?.order?.bonus ?? 0)} 🥔`, true)
    }),
    installDebug(engine),
  )
  const startIfNeeded = () => {
    const r = game.round
    if (r && !r.result && game.phase === 'peeling') launch(r)
  }
  startIfNeeded()
  window.addEventListener('keydown', onKey)
}

watch(() => game.round, (r) => {
  if (r && engine && !r.result && game.phase === 'peeling') launch(r)
})
watch(() => game.challenge, (c) => engine?.setSkipFry(!!c))
watch(() => game.rotateMode, (v) => engine?.setRotateMode(v))
watch(() => game.phase, (p) => { if (p === 'cutting') engine?.beginCutting() })
// écrans opaques : on coupe le rendu 3D (économie GPU/batterie)
watch(() => game.screen, (sc) => engine?.setPaused(sc === 'shop' || sc === 'collection' || sc === 'settings'))
watch(() => profile.settings.quality, (q) => engine?.setQuality(effectiveQuality(q)))
watch(() => [...profile.decorEquipped], (ids) => { engine?.setDecor(ids); music.setMood(moodId(ids)) })
watch(() => profile.settings.music, (v) => { music.setVolume(v); if (v > 0) music.start() })
watch(() => profile.settings.sound, (v) => setSoundEnabled(v))
watch(() => profile.equippedKnife, (k) => engine?.setKnife(k))
watch(() => [profile.settings.pixelRatioCap, profile.settings.reducedMotion] as const, ([p, r]) =>
  engine?.setSettings({ pixelRatioCap: p, reducedMotion: r }))

function launch(r: NonNullable<typeof game.round>) {
  engine!.setSkipFry(!!game.challenge)
  engine!.startRound(r.mode, r.seed, {
    kind: profile.selectedPotatoId === r.potatoId ? profile.selectedPotato : undefined,
    bad: r.bad,
    scale: potatoScale(profile.upgradeLevel('bigPotatoes')),
    autoPeelLevel: profile.upgradeLevel('autoPeeler'),
  })
}

const rtStart = () => { void engine?.startPhoto() }
const toast = ref('')
async function shot() {
  if (!engine) return
  const url = await engine.captureImage()
  const r = await shareCapture(url)
  profile.bump('photos')
  toast.value = r === 'shared' ? 'Capture partagée !' : 'Capture enregistrée !'
  setTimeout(() => (toast.value = ''), 2500)
}
const rtSave = () => { void shot() }
const rtStop = () => { engine?.stopPhoto() }

const reload = () => window.location.reload()

// clavier : ←/→ placent le couteau, Entrée/Espace tranchent
function onKey(e: KeyboardEvent) {
  if (game.phase !== 'cutting' || game.screen !== 'game') return
  if (e.target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(e.target.tagName) && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  if (e.key === 'ArrowLeft') { engine?.nudgeCut(-1); e.preventDefault() }
  else if (e.key === 'ArrowRight') { engine?.nudgeCut(1); e.preventDefault() }
  else if (e.key === 'Enter' || e.key === ' ') { engine?.cutAtKeyboard(); e.preventDefault() }
}

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  offs.forEach((f) => f())
  engine?.dispose()
  engineRef.current = null
  engine = null
})
</script>

<template>
  <div ref="host" class="game-canvas"></div>
  <div class="floaters">
    <span v-for="f in floaters" :key="f.id" class="floater" :class="{ big: f.big }" :style="{ left: f.x + 'px', top: f.y + 'px' }">{{ f.text }}</span>
  </div>
  <div v-if="game.screen === 'game' && game.phase !== 'idle'" class="photo-ui">
    <template v-if="!photo.active">
      <button class="ghost rt" data-testid="shot" title="Capturer et partager" @click="shot">📸 Capturer</button>
      <button class="ghost rt" data-testid="rt-start" @click="rtStart">📷 Ray tracing</button>
    </template>
    <template v-else>
      <span class="chip" data-testid="rt-status">{{ photo.compiling ? 'Compilation des shaders…' : `Path tracing : ${photo.samples} échantillons` }}</span>
      <button class="ghost rt" data-testid="rt-save" @click="rtSave">📸 Partager</button>
      <button class="rt" data-testid="rt-stop" @click="rtStop">Retour au jeu</button>
    </template>
    <span v-if="toast" class="chip" data-testid="shot-toast">{{ toast }}</span>
    <span v-if="photo.error" class="chip err" data-testid="rt-error">{{ photo.error }}</span>
  </div>
  <div v-if="lost" class="lost" data-testid="context-lost">
    <div class="panel">
      <h2>Affichage 3D perdu</h2>
      <p>Le navigateur a libéré le contexte WebGL.</p>
      <button class="big" @click="reload">Recharger</button>
    </div>
  </div>
</template>

<style scoped>
.game-canvas { position: absolute; inset: 0; }
.photo-ui { position: absolute; top: 56px; right: 8px; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: flex-end; z-index: 3; }
.rt { padding: 6px 10px; font-size: 0.85rem; background: var(--panel); color: var(--ink); box-shadow: var(--shadow); border: 0; }
.chip { background: var(--panel); padding: 6px 10px; border-radius: 999px; font-size: 0.82rem; box-shadow: var(--shadow); }
.chip.err { color: var(--bad); }
.floaters { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.floater { position: absolute; transform: translate(-50%, -50%); font-weight: 800; font-size: 1.4rem; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,.6); animation: rise 1.1s ease-out forwards; }
.floater.big { font-size: 2.2rem; color: #ffd36a; }
@keyframes rise { from { opacity: 1; margin-top: 0; } to { opacity: 0; margin-top: -70px; } }
.lost { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(244, 227, 200, 0.9); z-index: 10; text-align: center; }
</style>
