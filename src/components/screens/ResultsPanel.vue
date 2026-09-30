<script setup lang="ts">
import { computed, watch } from 'vue'
import { useGameStore } from '../../stores/game'

const game = useGameStore()
const r = computed(() => game.round?.result)
const pct = (v: number) => `${Math.round(v * 100)} %`
const fmt = new Intl.NumberFormat('fr-FR')
function again() {
  game.nextPotato()
}

// en chrono : enchaîne automatiquement la patate suivante
watch(() => game.resultsVisible && game.phase === 'results', (show) => {
  if (show && game.challenge && !game.challenge.done) setTimeout(() => { if (game.phase === 'results') game.nextPotato() }, 900)
}, { immediate: true })
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
      <p v-if="game.round?.bad" class="warn">⚠ Patate abîmée : gain réduit, série perdue.</p>
      <p class="gain" data-testid="reward">+ {{ fmt.format(r.reward) }} 🥔</p>
      <p v-if="game.round?.order" class="order" data-testid="order-delivered">🍽 {{ game.round.order.label }} livré : + {{ fmt.format(game.round.order.bonus) }} 🥔</p>
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
.warn { color: var(--bad); font-weight: 700; margin: 4px 0; }
.order { background: #e6f6e9; border-radius: 10px; padding: 6px 10px; font-weight: 700; margin: 4px 0; }
.gain { font-size: 1.6rem; font-weight: 800; margin: 8px 0; color: var(--ok); }
.row { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
@keyframes pop { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .card { animation: none; } }
</style>
