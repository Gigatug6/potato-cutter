<script setup lang="ts">
import { computed } from 'vue'
import { engineRef } from '../../engine/bridge'
import { MIN_PEEL_TO_CUT, useGameStore } from '../../stores/game'

const game = useGameStore()
const cov = computed(() => game.round?.peelCoverage ?? 0)
const recommended = computed(() => cov.value >= 0.9)
</script>

<template>
  <div class="actions" v-if="game.phase === 'peeling' || game.phase === 'cutting'">
    <template v-if="game.phase === 'peeling'">
      <p class="hint">Frotte la patate pour l'éplucher (glisse en dehors pour tourner la vue).</p>
      <button class="big" :class="{ rec: recommended }" data-testid="to-cutting" :disabled="cov < MIN_PEEL_TO_CUT" @click="game.goToCutting()">
        Passer à la découpe
      </button>
      <small v-if="cov < MIN_PEEL_TO_CUT">Épluche au moins 50 %</small>
      <small v-else-if="!recommended">Conseil : 90 % pour une meilleure note</small>
    </template>
    <template v-else>
      <p class="hint">Clique sur la patate pour trancher à cet endroit.</p>
      <button class="big" data-testid="finish" @click="engineRef.current?.finish()">Terminer</button>
    </template>
  </div>
</template>

<style scoped>
.actions { position: absolute; bottom: 16px; left: 0; right: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; pointer-events: none; }
.actions > * { pointer-events: auto; }
.hint { background: var(--panel); padding: 6px 12px; border-radius: 999px; margin: 0; font-size: 0.9rem; text-align: center; }
small { background: var(--panel); padding: 2px 10px; border-radius: 999px; }
.rec { background: var(--ok); box-shadow: 0 3px 0 #1f7038; }
</style>
