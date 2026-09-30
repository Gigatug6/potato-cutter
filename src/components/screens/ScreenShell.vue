<script setup lang="ts">
import { useGameStore } from '../../stores/game'
import MoneyCounter from '../hud/MoneyCounter.vue'

defineProps<{ title: string }>()
const game = useGameStore()
</script>

<template>
  <div class="screen">
    <header class="bar">
      <button class="ghost" data-testid="back" @click="game.screen = game.round ? 'game' : 'menu'">← Retour</button>
      <h1>{{ title }}</h1>
      <MoneyCounter />
    </header>
    <slot />
  </div>
</template>

<style scoped>
.bar { position: fixed; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; background: rgba(244, 227, 200, 0.98); z-index: 2; }
h1 { margin: 0; font-size: 1.3rem; }
</style>
