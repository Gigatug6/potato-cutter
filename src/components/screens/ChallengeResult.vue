<script setup lang="ts">
import { useGameStore } from '../../stores/game'

const game = useGameStore()
</script>

<template>
  <div v-if="game.challenge?.done" class="wrap" data-testid="challenge-result">
    <div class="panel card">
      <h2>⏱ Temps écoulé !</h2>
      <p class="score">{{ game.challenge.score }} 🥔</p>
      <p>{{ game.challenge.potatoes }} patate(s) livrée(s)</p>
      <p v-if="game.challenge.rank" class="rank" data-testid="rank">🏆 Classement : n°{{ game.challenge.rank }}</p>
      <p v-else>Hors du top 10 cette fois.</p>
      <div class="row">
        <button class="big" data-testid="challenge-again" @click="game.startChallenge(game.challenge!.mode)">Rejouer</button>
        <button class="ghost" @click="game.backToMenu()">Menu</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrap { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(40, 20, 0, 0.35); }
.card { text-align: center; min-width: 280px; max-width: 92vw; }
.score { font-size: 2.4rem; font-weight: 900; margin: 4px 0; color: var(--accent-2); }
.rank { font-weight: 800; color: var(--ok); }
.row { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
</style>
