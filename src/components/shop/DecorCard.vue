<script setup lang="ts">
import { computed } from 'vue'
import { playBuy } from '../../audio/sfx'
import type { DecorDef, PropKind } from '../../game/data/decor'
import { RARITY_META } from '../../game/data/rarities'
import { useProfileStore } from '../../stores/profile'
import RarityBadge from './RarityBadge.vue'

const props = defineProps<{ decor: DecorDef }>()
const profile = useProfileStore()
const owned = computed(() => profile.ownsDecor(props.decor.id))
const equipped = computed(() => profile.isDecorEquipped(props.decor.id))
const fmt = new Intl.NumberFormat('fr-FR')
const base = import.meta.env.BASE_URL
const EMOJI: Record<PropKind, string> = { plant: '🪴', plates: '🍽️', spices: '🧂', candles: '🕯️', lamp: '💡' }

const preview = computed(() => {
  const d = props.decor
  if (d.board) return d.board.tex ? `${base}decor/${d.board.tex}_diff.webp` : `${base}textures/wood_table_001_diff.webp`
  if (d.wall) return `${base}decor/${d.wall.tex}_diff.webp`
  return null
})
const moodStyle = computed(() => {
  const m = props.decor.mood
  return m ? { background: `linear-gradient(135deg, ${m.bg}, ${m.sun.color})` } : {}
})

function buy() {
  if (profile.buyDecor(props.decor.id) === 'ok') playBuy()
}
</script>

<template>
  <article class="card" :class="{ equipped }" :style="{ borderColor: RARITY_META[decor.rarity].color }" :data-testid="`decor-${decor.id}`">
    <div class="pv" :style="moodStyle">
      <img v-if="preview" :src="preview" :alt="decor.name" loading="lazy" />
      <span v-else-if="decor.prop" class="emoji">{{ EMOJI[decor.prop] }}</span>
      <span v-else class="emoji">{{ decor.mood?.neon ? '🌃' : '☀️' }}</span>
    </div>
    <div class="head"><h3>{{ decor.name }}</h3><RarityBadge :rarity="decor.rarity" /></div>
    <p>{{ decor.description }}</p>
    <template v-if="owned">
      <button v-if="decor.category === 'prop'" data-testid="toggle" @click="profile.equipDecor(decor.id)">{{ equipped ? 'Retirer' : 'Placer' }}</button>
      <button v-else-if="equipped" disabled data-testid="equipped">Équipé</button>
      <button v-else data-testid="equip" @click="profile.equipDecor(decor.id)">Équiper</button>
    </template>
    <button v-else data-testid="buy" :disabled="profile.money < decor.price" @click="buy">Acheter · {{ fmt.format(decor.price) }} 🥔</button>
  </article>
</template>

<style scoped>
.card { background: #fff; border: 3px solid; border-radius: 14px; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
.card.equipped { box-shadow: 0 0 0 3px var(--ok); }
.pv { height: 84px; border-radius: 8px; overflow: hidden; display: grid; place-items: center; background: #efe3cc; }
.pv img { width: 100%; height: 100%; object-fit: cover; }
.emoji { font-size: 2.6rem; }
.head { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
h3 { margin: 0; font-size: 1rem; }
p { margin: 0; font-size: 0.85rem; opacity: 0.8; }
</style>
