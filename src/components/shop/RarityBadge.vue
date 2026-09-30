<script setup lang="ts">
import { computed } from 'vue'
import { RARITY_META, type Rarity } from '../../game/data/rarities'

const props = defineProps<{ rarity: Rarity }>()
const meta = computed(() => RARITY_META[props.rarity])
</script>

<template>
  <span class="badge" :style="{ background: meta.color }">{{ meta.label }}</span>
</template>

<style scoped>
.badge { color: #fff; font-size: 0.75rem; font-weight: 800; padding: 2px 8px; border-radius: 999px; text-shadow: 0 1px 1px rgba(0, 0, 0, 0.4); }
</style>
