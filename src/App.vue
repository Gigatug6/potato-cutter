<script setup lang="ts">
import GameCanvas from './components/GameCanvas.vue'
import AchievementToasts from './components/hud/AchievementToasts.vue'
import HudBar from './components/hud/HudBar.vue'
import PhaseActions from './components/hud/PhaseActions.vue'
import MainMenu from './components/screens/MainMenu.vue'
import ResultsPanel from './components/screens/ResultsPanel.vue'
import { defineAsyncComponent, onMounted, watch } from 'vue'
import { setLanguage } from './i18n/dom'
import { useGameStore } from './stores/game'
import { useProfileStore } from './stores/profile'

// écrans secondaires chargés à la demande (boutique 3D, collection, réglages, fin de chrono)
const ShopView = defineAsyncComponent(() => import('./components/screens/ShopView.vue'))
const CollectionView = defineAsyncComponent(() => import('./components/screens/CollectionView.vue'))
const SettingsPanel = defineAsyncComponent(() => import('./components/screens/SettingsPanel.vue'))
const ChallengeResult = defineAsyncComponent(() => import('./components/screens/ChallengeResult.vue'))

const game = useGameStore()
const profile = useProfileStore()
// langue : traducteur DOM (FR source → EN), voir src/i18n
watch(() => profile.settings.lang, (l) => setLanguage(l), { immediate: false })
onMounted(() => { if (profile.settings.lang !== 'fr') setLanguage(profile.settings.lang) })

const TITLES: Record<string, string> = {
  menu: 'Potato Cutter — simulateur 3D de découpe de patates en ligne (gratuit)',
  game: 'En jeu · Potato Cutter',
  shop: 'Boutique : couteaux, patates, décors · Potato Cutter',
  collection: 'Collection et classement · Potato Cutter',
  settings: 'Réglages · Potato Cutter',
}
watch(() => game.screen, (sc) => { document.title = TITLES[sc] ?? TITLES.menu }, { immediate: true })
</script>

<template>
  <main class="app">
    <GameCanvas />
    <AchievementToasts />
    <div class="overlay">
      <MainMenu v-if="game.screen === 'menu'" />
      <template v-else-if="game.screen === 'game'">
        <HudBar />
        <PhaseActions />
        <ResultsPanel />
        <ChallengeResult />
      </template>
      <ShopView v-else-if="game.screen === 'shop'" />
      <CollectionView v-else-if="game.screen === 'collection'" />
      <SettingsPanel v-else-if="game.screen === 'settings'" />
    </div>
  </main>
</template>

<style scoped>
.app { position: relative; width: 100%; height: 100%; }
</style>
