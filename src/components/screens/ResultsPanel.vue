<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../../stores/game'

const game = useGameStore()
const r = computed(() => game.round?.result)
const pct = (v: number) => `${Math.round(v * 100)} %`
const fmt = new Intl.NumberFormat('fr-FR')
function again() {
  if (game.round) game.startRound(game.round.mode)
}
</script>

<template>
  <div v-if="r && game.phase === 'results' && game.resultsVisible" class="results" data-testid="results">
    <div class="panel card">
      <h2>Patate terminée !</h2>
      <div class="grade" :data-grade="r.grade">{{ r.grade }}</div>
      <ul>
        <li>Épluchage : {{ pct(r.peelScore) }}</li>
        <li>Précision des coupes : {{ pct(r.cutScore) }}</li>
        <li>Complétion : {{ pct(r.completion) }}</li>
        <li>Bonus vitesse : {{ pct(r.speedBonus) }}</li>
      </ul>
      <p class="gain" data-testid="reward">+ {{ fmt.format(r.reward) }} 🥔</p>
      <div class="row">
        <button class="big" data-testid="next" @click="again">Patate suivante</button>
        <button class="ghost" @click="game.backToMenu()">Menu</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.results { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
.card { pointer-events: auto; text-align: center; min-width: 280px; max-width: 92vw; animation: pop 0.35s ease-out; }
ul { list-style: none; padding: 0; margin: 8px 0; text-align: left; }
.grade { font-size: 4rem; font-weight: 900; line-height: 1; color: var(--accent-2); }
.grade[data-grade='S'] { color: #d4a100; }
.gain { font-size: 1.6rem; font-weight: 800; margin: 8px 0; color: var(--ok); }
.row { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
@keyframes pop { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .card { animation: none; } }
</style>
