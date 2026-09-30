<script setup lang="ts">
import GameCanvas from './components/GameCanvas.vue'
</script>

<template>
  <main class="app">
    <GameCanvas />
  </main>
</template>

<style>
html, body, #app { margin: 0; height: 100%; }
body { font-family: system-ui, sans-serif; overflow: hidden; }
.app { position: relative; width: 100%; height: 100%; }
</style>
