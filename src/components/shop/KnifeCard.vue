<script setup lang="ts">
import { computed } from 'vue'
import { playBuy } from '../../audio/sfx'
import { knifeThumbnail } from '../../engine/knives/thumbnails'
import type { KnifeDef } from '../../game/data/knives'
import { RARITY_META } from '../../game/data/rarities'
import { useProfileStore } from '../../stores/profile'
import RarityBadge from './RarityBadge.vue'

const props = defineProps<{ knife: KnifeDef; previewed?: boolean }>()
const emit = defineEmits<{ preview: [id: string] }>()
const profile = useProfileStore()
const owned = computed(() => profile.owns(props.knife.id))
const equipped = computed(() => profile.equippedKnifeId === props.knife.id)
const thumb = computed(() => knifeThumbnail(props.knife))
const fmt = new Intl.NumberFormat('fr-FR')
const color = computed(() => RARITY_META[props.knife.rarity].color)
</script>

<template>
  <article class="card" :class="{ equipped, previewed }" :style="{ borderColor: color }" :data-testid="`knife-${knife.id}`" @click="emit('preview', knife.id)">
    <img v-if="thumb" :src="thumb" :alt="knife.name" width="280" height="140" />
    <div class="head"><h3>{{ knife.name }}</h3><RarityBadge :rarity="knife.rarity" /></div>
    <p class="desc">{{ knife.description }}</p>
    <ul class="stats">
      <li>Gains ×{{ knife.stats.gainMult }}</li>
      <li>Vitesse ×{{ knife.stats.speed }}</li>
      <li>Précision {{ Math.round(knife.stats.precision * 100) }} %</li>
    </ul>
    <button v-if="equipped" disabled data-testid="equipped">Équipé</button>
    <button v-else-if="owned" data-testid="equip" @click.stop="profile.equip(knife.id)">Équiper</button>
    <button v-else-if="knife.price === null" disabled>Caisse uniquement</button>
    <button v-else data-testid="buy" :disabled="!profile.canAfford(knife.id)" @click.stop="profile.buy(knife.id) === 'ok' && playBuy()">
      Acheter · {{ fmt.format(knife.price) }} 🥔
    </button>
  </article>
</template>

<style scoped>
.card { background: #fff; border: 3px solid; border-radius: 14px; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
.card { cursor: pointer; }
.card.previewed { outline: 3px dashed var(--accent); outline-offset: 2px; }
.card.equipped { box-shadow: 0 0 0 3px var(--ok); }
img { width: 100%; height: auto; border-radius: 8px; background: #efe3cc; }
.head { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
h3 { margin: 0; font-size: 1rem; }
.desc { margin: 0; font-size: 0.85rem; opacity: 0.8; }
.stats { list-style: none; margin: 0; padding: 0; font-size: 0.82rem; display: flex; gap: 10px; flex-wrap: wrap; }
</style>
