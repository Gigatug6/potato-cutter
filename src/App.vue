<script setup lang="ts">
import GameCanvas from './components/GameCanvas.vue'
import HudBar from './components/hud/HudBar.vue'
import PhaseActions from './components/hud/PhaseActions.vue'
import MainMenu from './components/screens/MainMenu.vue'
import ResultsPanel from './components/screens/ResultsPanel.vue'
import { useGameStore } from './stores/game'

const game = useGameStore()
</script>

<template>
  <main class="app">
    <GameCanvas />
    <div class="overlay">
      <MainMenu v-if="game.screen === 'menu'" />
      <template v-else-if="game.screen === 'game'">
        <HudBar />
        <PhaseActions />
        <ResultsPanel />
      </template>
    </div>
  </main>
</template>

<style scoped>
.app { position: relative; width: 100%; height: 100%; }
</style>
