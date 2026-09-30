<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { CUT_MODES } from '../../game/cutting/cutModes'
import { useGameStore } from '../../stores/game'
import { useProfileStore } from '../../stores/profile'
import MoneyCounter from './MoneyCounter.vue'

const game = useGameStore()
const profile = useProfileStore()
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval>
onMounted(() => { timer = setInterval(() => (now.value = Date.now()), 250) })
onBeforeUnmount(() => clearInterval(timer))

const elapsed = computed(() => {
  const r = game.round
  if (!r) return '0:00'
  const s = Math.floor(((r.result ? r.startedAt + r.result.durationMs : now.value) - r.startedAt) / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})
const peelPct = computed(() => Math.round((game.round?.peelCoverage ?? 0) * 100))
const cutsLabel = computed(() => `${game.round?.cutCount ?? 0}/${game.targetCuts()}`)
const modeLabel = computed(() => (game.round ? CUT_MODES[game.round.mode].label : ''))
</script>

<template>
  <header class="hud" data-testid="hud">
    <MoneyCounter />
    <div class="chip">{{ modeLabel }}</div>
    <div class="chip" data-testid="timer">⏱ {{ elapsed }}</div>
    <div class="chip" data-testid="peel">Épluché {{ peelPct }} %</div>
    <div class="chip" data-testid="cuts">Coupes {{ cutsLabel }}</div>
    <div class="chip">🔪 {{ profile.equippedKnife.name }}</div>
  </header>
</template>

<style scoped>
.hud { position: absolute; top: 8px; left: 8px; right: 8px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.chip { background: var(--panel); padding: 6px 12px; border-radius: 999px; box-shadow: var(--shadow); font-size: 0.9rem; }
@media (max-width: 600px) { .chip { padding: 4px 8px; font-size: 0.78rem; } }
</style>
