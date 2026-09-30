<script setup lang="ts">
import { KNIVES } from '../../game/data/knives'
import { RARITY_META } from '../../game/data/rarities'
import CratePanel from '../shop/CratePanel.vue'
import KnifeCard from '../shop/KnifeCard.vue'
import ScreenShell from './ScreenShell.vue'

const sorted = [...KNIVES].sort((a, b) => RARITY_META[a.rarity].order - RARITY_META[b.rarity].order || (a.price ?? 1e9) - (b.price ?? 1e9))
</script>

<template>
  <ScreenShell title="Boutique">
    <CratePanel />
    <div class="grid" data-testid="shop">
      <KnifeCard v-for="k in sorted" :key="k.id" :knife="k" />
    </div>
  </ScreenShell>
</template>
