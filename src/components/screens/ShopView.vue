<script setup lang="ts">
import { computed, ref } from 'vue'
import { DECOR, DECOR_CATEGORIES } from '../../game/data/decor'
import { KNIVES, knifeById } from '../../game/data/knives'
import { POTATOES } from '../../game/data/potatoes'
import { RARITY_META } from '../../game/data/rarities'
import { UPGRADES } from '../../game/data/upgrades'
import { useProfileStore } from '../../stores/profile'
import DecorCard from '../shop/DecorCard.vue'
import CratePanel from '../shop/CratePanel.vue'
import KnifeCard from '../shop/KnifeCard.vue'
import KnifePreview from '../shop/KnifePreview.vue'
import PotatoCard from '../shop/PotatoCard.vue'
import UpgradeCard from '../shop/UpgradeCard.vue'
import ScreenShell from './ScreenShell.vue'

type Tab = 'knives' | 'potatoes' | 'upgrades' | 'decor'
const tab = ref<Tab>('knives')
const previewId = ref(useProfileStore().equippedKnifeId)
const previewKnife = computed(() => knifeById(previewId.value) ?? KNIVES[0])
const sorted = [...KNIVES].sort((a, b) => RARITY_META[a.rarity].order - RARITY_META[b.rarity].order || (a.price ?? 1e9) - (b.price ?? 1e9))
const tabs: { id: Tab; label: string }[] = [
  { id: 'knives', label: '🔪 Couteaux' }, { id: 'potatoes', label: '🥔 Patates' }, { id: 'upgrades', label: '⚙ Améliorations' }, { id: 'decor', label: '🏠 Décors' },
]
</script>

<template>
  <ScreenShell title="Boutique">
    <div class="tabs" role="tablist">
      <button v-for="t in tabs" :key="t.id" role="tab" :class="{ on: tab === t.id, ghost: tab !== t.id }" :data-testid="`tab-${t.id}`" @click="tab = t.id">{{ t.label }}</button>
    </div>
    <template v-if="tab === 'knives'">
      <KnifePreview :knife="previewKnife" />
      <p class="name" data-testid="preview-name">{{ previewKnife.name }}</p>
      <CratePanel />
      <div class="grid" data-testid="shop">
        <KnifeCard v-for="k in sorted" :key="k.id" :knife="k" :previewed="k.id === previewId" @preview="previewId = $event" />
      </div>
    </template>
    <div v-else-if="tab === 'potatoes'" class="grid" data-testid="shop-potatoes">
      <PotatoCard v-for="p in POTATOES" :key="p.id" :kind="p" />
    </div>
    <div v-else-if="tab === 'decor'" data-testid="shop-decor">
      <section v-for="c in DECOR_CATEGORIES" :key="c.id" class="cat">
        <h2>{{ c.label }}</h2>
        <div class="grid">
          <DecorCard v-for="d in DECOR.filter((x) => x.category === c.id)" :key="d.id" :decor="d" />
        </div>
      </section>
    </div>
    <div v-else class="grid" data-testid="shop-upgrades">
      <UpgradeCard v-for="u in UPGRADES" :key="u.id" :def="u" />
    </div>
  </ScreenShell>
</template>

<style scoped>
.tabs { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.cat { margin-bottom: 16px; }
.name { text-align: center; font-weight: 800; margin: -4px 0 10px; }
</style>
