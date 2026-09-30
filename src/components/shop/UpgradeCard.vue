<script setup lang="ts">
import { computed } from 'vue'
import { playBuy } from '../../audio/sfx'
import { upgradePrice, type UpgradeDef } from '../../game/data/upgrades'
import { useProfileStore } from '../../stores/profile'

const props = defineProps<{ def: UpgradeDef }>()
const profile = useProfileStore()
const level = computed(() => profile.upgradeLevel(props.def.id))
const price = computed(() => upgradePrice(props.def, level.value))
const fmt = new Intl.NumberFormat('fr-FR')
function buy() {
  if (profile.buyUpgrade(props.def.id) === 'ok') playBuy()
}
</script>

<template>
  <article class="card" :data-testid="`upgrade-${def.id}`">
    <h3>{{ def.name }}</h3>
    <p>{{ def.description }}</p>
    <div class="pips" :aria-label="`niveau ${level} sur ${def.max}`">
      <span v-for="i in def.max" :key="i" :class="{ on: i <= level }"></span>
    </div>
    <b data-testid="level">Niveau {{ level }}/{{ def.max }}</b>
    <button v-if="price === null" disabled>Niveau maximum</button>
    <button v-else data-testid="buy" :disabled="profile.money < price" @click="buy">Améliorer · {{ fmt.format(price) }} 🥔</button>
  </article>
</template>

<style scoped>
.card { background: #fff; border-radius: 14px; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
h3 { margin: 0; font-size: 1rem; }
p { margin: 0; font-size: 0.85rem; opacity: 0.8; }
.pips { display: flex; gap: 4px; }
.pips span { flex: 1; height: 8px; border-radius: 4px; background: #eadfc8; }
.pips span.on { background: var(--accent); }
</style>
