<script setup lang="ts">
import { computed } from 'vue'
import { engineRef } from '../../engine/bridge'
import { BAD_LOOKS } from '../../game/data/potatoes'
import { MIN_PEEL_TO_CUT, useGameStore } from '../../stores/game'

const game = useGameStore()
const cov = computed(() => game.round?.peelCoverage ?? 0)
const recommended = computed(() => cov.value >= 0.9)
</script>

<template>
  <div class="actions" v-if="game.phase === 'peeling' || game.phase === 'cutting'">
    <div v-if="game.round?.bad" class="bad" data-testid="bad-banner">
      ⚠ {{ BAD_LOOKS[game.round.bad].label }} : ne rapporte presque rien !
      <button class="discard" data-testid="discard" @click="game.discardBadPotato()">🗑 Jeter</button>
    </div>
    <template v-if="game.phase === 'peeling'">
      <p class="hint">{{ game.rotateMode ? 'Glisse sur la patate pour la faire tourner.' : 'Frotte la patate pour l\'éplucher.' }} (clic droit ou Maj + glisser = tourner)</p>
      <button class="ghost rot" data-testid="rotate-toggle" :class="{ on: game.rotateMode }" @click="game.rotateMode = !game.rotateMode">
        {{ game.rotateMode ? '🔄 Mode tourner : activé' : '🔄 Tourner la patate' }}
      </button>
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
.bad { background: #fff0cc; border: 2px solid var(--bad); border-radius: 12px; padding: 6px 12px; font-weight: 700; display: flex; gap: 10px; align-items: center; }
.discard { background: var(--bad); box-shadow: 0 3px 0 #8c2a20; padding: 4px 10px; }
.rot { background: var(--panel); }
.rot.on { background: var(--accent); color: #fff; border-color: var(--accent-2); }
.rec { background: var(--ok); box-shadow: 0 3px 0 #1f7038; }
</style>
