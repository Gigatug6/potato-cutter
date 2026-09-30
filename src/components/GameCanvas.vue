<script setup lang="ts">
import { markRaw, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { playChop, playCoin, playScratch, setSoundEnabled } from '../audio/sfx'
import { installDebug } from '../debug'
import { Engine } from '../engine/Engine'
import { engineRef } from '../engine/bridge'
import { useGameStore } from '../stores/game'
import { useProfileStore } from '../stores/profile'

const host = ref<HTMLDivElement>()
const lost = ref(false)
const game = useGameStore()
const profile = useProfileStore()
let engine: Engine | null = null
const offs: (() => void)[] = []

onMounted(() => {
  setSoundEnabled(profile.settings.sound)
  engine = markRaw(new Engine(host.value!, {
    knife: profile.equippedKnife,
    pixelRatioCap: profile.settings.pixelRatioCap,
    reducedMotion: profile.settings.reducedMotion,
  }))
  engineRef.current = engine
  const ev = engine.events
  offs.push(
    ev.on('peelProgress', (c) => { game.setPeelCoverage(c); if (game.phase === 'peeling' && c > 0) playScratch() }),
    ev.on('cut', (p) => { game.registerCut(p.pieceCount); playChop() }),
    ev.on('contextLost', () => (lost.value = true)),
    ev.on('allCutsDone', () => engine?.finish()),
    ev.on('finished', ({ bounds, cuts }) => { game.finishRound(bounds, cuts); playCoin() }),
    installDebug(engine),
  )
  const startIfNeeded = () => {
    const r = game.round
    if (r && !r.result && game.phase === 'peeling') engine!.startRound(r.mode, r.seed)
  }
  startIfNeeded()
})

watch(() => game.round, (r) => {
  if (r && engine && !r.result && game.phase === 'peeling') engine.startRound(r.mode, r.seed)
})
watch(() => game.rotateMode, (v) => engine?.setRotateMode(v))
watch(() => game.phase, (p) => { if (p === 'cutting') engine?.beginCutting() })
watch(() => profile.settings.sound, (v) => setSoundEnabled(v))
watch(() => profile.equippedKnife, (k) => engine?.setKnife(k))
watch(() => [profile.settings.pixelRatioCap, profile.settings.reducedMotion] as const, ([p, r]) =>
  engine?.setSettings({ pixelRatioCap: p, reducedMotion: r }))

const reload = () => window.location.reload()

onBeforeUnmount(() => {
  offs.forEach((f) => f())
  engine?.dispose()
  engineRef.current = null
  engine = null
})
</script>

<template>
  <div ref="host" class="game-canvas"></div>
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
.lost { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(244, 227, 200, 0.9); z-index: 10; text-align: center; }
</style>
