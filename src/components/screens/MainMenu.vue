<script setup lang="ts">
import { ref } from 'vue'
import { CUT_MODES, type CutModeId } from '../../game/cutting/cutModes'
import { POTATOES } from '../../game/data/potatoes'
import { CHALLENGE_SECONDS } from '../../game/scoring/leaderboard'
import { useGameStore } from '../../stores/game'
import { useProfileStore } from '../../stores/profile'
import MoneyCounter from '../hud/MoneyCounter.vue'
import OrdersPanel from './OrdersPanel.vue'
import QuestsPanel from './QuestsPanel.vue'

const game = useGameStore()
const profile = useProfileStore()
const selected = ref<CutModeId>('rondelles')
const modes = Object.values(CUT_MODES)
</script>

<template>
  <div class="menu" data-testid="menu">
    <div class="top"><MoneyCounter /></div>
    <button class="ghost lang" data-testid="lang-toggle" aria-label="Langue / Language" @click="profile.settings.lang = profile.settings.lang === 'fr' ? 'en' : 'fr'">🌐 {{ profile.settings.lang === 'fr' ? 'EN' : 'FR' }}</button>
    <div class="cols">
      <div class="panel box">
        <h1>🥔 Potato Cutter</h1>
        <p>Épluche, tranche, encaisse. Achète des couteaux, des patates rares et des améliorations !</p>
        <div class="modes">
          <button v-for="m in modes" :key="m.id" class="mode" :class="{ on: selected === m.id }" :data-testid="`mode-${m.id}`" @click="selected = m.id">
            <b>{{ m.label }}</b><small>base {{ m.baseReward }} 🥔</small>
          </button>
        </div>
        <div class="potatoes" data-testid="potato-picker">
          <button v-for="p in POTATOES.filter((x) => profile.hasPotato(x.id))" :key="p.id" class="pot" :class="{ on: profile.selectedPotatoId === p.id }"
            :data-testid="`pick-${p.id}`" @click="profile.selectPotato(p.id)">
            {{ p.name }} <small>×{{ p.valueMult }}</small>
          </button>
        </div>
        <div class="play">
          <button class="big" data-testid="play" @click="game.startRound(selected)">Jouer</button>
          <button class="big chrono" data-testid="play-challenge" @click="game.startChallenge(selected)">⏱ Chrono {{ CHALLENGE_SECONDS }} s</button>
        </div>
        <div class="nav">
          <button class="ghost" data-testid="nav-shop" @click="game.screen = 'shop'">Boutique</button>
          <button class="ghost" data-testid="nav-collection" @click="game.screen = 'collection'">Collection & classement</button>
          <button class="ghost" data-testid="nav-settings" @click="game.screen = 'settings'">Réglages</button>
        </div>
      </div>
      <div class="side">
        <OrdersPanel />
        <QuestsPanel />
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu { position: absolute; inset: 0; overflow-y: auto; pointer-events: auto; padding: 56px 12px 16px; }
.lang { position: fixed; top: 8px; right: 8px; z-index: 2; padding: 6px 12px; background: var(--panel); }
.top { position: fixed; top: 8px; left: 8px; z-index: 2; }
.cols { display: flex; gap: 12px; justify-content: center; align-items: flex-start; flex-wrap: wrap; max-width: 960px; margin: 0 auto; }
.box { text-align: center; flex: 1 1 340px; max-width: 460px; display: flex; flex-direction: column; gap: 12px; }
.side { flex: 1 1 300px; max-width: 420px; display: flex; flex-direction: column; gap: 12px; }
.modes { display: flex; gap: 8px; justify-content: center; }
.mode { display: flex; flex-direction: column; background: #fff; color: var(--ink); box-shadow: none; border: 2px solid transparent; flex: 1; }
.mode.on, .pot.on { border-color: var(--accent); background: #ffe9c4; }
.potatoes { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.pot { background: #fff; color: var(--ink); box-shadow: none; border: 2px solid transparent; padding: 6px 10px; font-size: 0.85rem; }
.play { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.chrono { background: #6a3fb5; box-shadow: 0 3px 0 #48277f; }
.nav { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
</style>
