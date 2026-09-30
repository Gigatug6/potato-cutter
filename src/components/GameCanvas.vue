<script setup lang="ts">
import { markRaw, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { installDebug } from '../debug'
import { Engine } from '../engine/Engine'
import { engineRef } from '../engine/bridge'
import { useGameStore } from '../stores/game'
import { useProfileStore } from '../stores/profile'

const host = ref<HTMLDivElement>()
const game = useGameStore()
const profile = useProfileStore()
let engine: Engine | null = null
const offs: (() => void)[] = []

onMounted(() => {
  engine = markRaw(new Engine(host.value!, {
    knife: profile.equippedKnife,
    pixelRatioCap: profile.settings.pixelRatioCap,
    reducedMotion: profile.settings.reducedMotion,
  }))
  engineRef.current = engine
  const ev = engine.events
  offs.push(
    ev.on('peelProgress', (c) => game.setPeelCoverage(c)),
    ev.on('cut', (p) => game.registerCut(p.pieceCount)),
    ev.on('allCutsDone', () => engine?.finish()),
    ev.on('finished', ({ bounds, cuts }) => game.finishRound(bounds, cuts)),
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
watch(() => game.phase, (p) => { if (p === 'cutting') engine?.beginCutting() })
watch(() => profile.equippedKnife, (k) => engine?.setKnife(k))
watch(() => [profile.settings.pixelRatioCap, profile.settings.reducedMotion] as const, ([p, r]) =>
  engine?.setSettings({ pixelRatioCap: p, reducedMotion: r }))

onBeforeUnmount(() => {
  offs.forEach((f) => f())
  engine?.dispose()
  engineRef.current = null
  engine = null
})
</script>

<template>
  <div ref="host" class="game-canvas"></div>
</template>

<style scoped>
.game-canvas { position: absolute; inset: 0; }
</style>
