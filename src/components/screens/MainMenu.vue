<script setup lang="ts">
import { ref } from 'vue'
import { CUT_MODES, type CutModeId } from '../../game/cutting/cutModes'
import { useGameStore } from '../../stores/game'
import MoneyCounter from '../hud/MoneyCounter.vue'

const game = useGameStore()
const selected = ref<CutModeId>('rondelles')
const modes = Object.values(CUT_MODES)
</script>

<template>
  <div class="menu" data-testid="menu">
    <div class="top"><MoneyCounter /></div>
    <div class="panel box">
      <h1>🥔 Potato Cutter</h1>
      <p>Épluche, tranche, encaisse. Achète des couteaux de plus en plus rares !</p>
      <div class="modes">
        <button v-for="m in modes" :key="m.id" class="mode" :class="{ on: selected === m.id }" :data-testid="`mode-${m.id}`" @click="selected = m.id">
          <b>{{ m.label }}</b><small>base {{ m.baseReward }} 🥔</small>
        </button>
      </div>
      <button class="big" data-testid="play" @click="game.startRound(selected)">Jouer</button>
      <div class="nav">
        <button class="ghost" data-testid="nav-shop" @click="game.screen = 'shop'">Boutique</button>
        <button class="ghost" data-testid="nav-collection" @click="game.screen = 'collection'">Collection</button>
        <button class="ghost" data-testid="nav-settings" @click="game.screen = 'settings'">Réglages</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
.top { position: absolute; top: 8px; left: 8px; }
.box { pointer-events: auto; text-align: center; max-width: 92vw; width: 420px; display: flex; flex-direction: column; gap: 12px; }
.modes { display: flex; gap: 8px; justify-content: center; }
.mode { display: flex; flex-direction: column; background: #fff; color: var(--ink); box-shadow: none; border: 2px solid transparent; flex: 1; }
.mode.on { border-color: var(--accent); background: #ffe9c4; }
.nav { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
</style>
