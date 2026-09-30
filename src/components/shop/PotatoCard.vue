<script setup lang="ts">
import { computed } from 'vue'
import { playBuy } from '../../audio/sfx'
import type { PotatoKind } from '../../game/data/potatoes'
import { useProfileStore } from '../../stores/profile'

const props = defineProps<{ kind: PotatoKind }>()
const profile = useProfileStore()
const owned = computed(() => profile.hasPotato(props.kind.id))
const selected = computed(() => profile.selectedPotatoId === props.kind.id)
const fmt = new Intl.NumberFormat('fr-FR')
const swatch = computed(() => {
  const [r, g, b] = props.kind.flesh
  const c = (v: number) => Math.round(255 * Math.pow(Math.min(1, v), 1 / 2.2))
  return `rgb(${c(r)}, ${c(g)}, ${c(b)})`
})
function buy() {
  if (profile.buyPotato(props.kind.id) === 'ok') { playBuy(); profile.selectPotato(props.kind.id) }
}
</script>

<template>
  <article class="card" :class="{ selected }" :data-testid="`potato-${kind.id}`">
    <div class="swatch" :style="{ background: swatch }"></div>
    <h3>{{ kind.name }}</h3>
    <p>{{ kind.description }}</p>
    <b>Valeur ×{{ kind.valueMult }}</b>
    <button v-if="selected" disabled data-testid="selected">Sélectionnée</button>
    <button v-else-if="owned" data-testid="select" @click="profile.selectPotato(kind.id)">Choisir</button>
    <button v-else data-testid="buy" :disabled="profile.money < kind.price" @click="buy">Débloquer · {{ fmt.format(kind.price) }} 🥔</button>
  </article>
</template>

<style scoped>
.card { background: #fff; border-radius: 14px; padding: 10px; display: flex; flex-direction: column; gap: 6px; border: 3px solid transparent; }
.card.selected { border-color: var(--ok); }
.swatch { height: 46px; border-radius: 40px / 28px; box-shadow: inset 0 -6px 10px rgba(0, 0, 0, 0.15); }
h3 { margin: 0; font-size: 1rem; }
p { margin: 0; font-size: 0.85rem; opacity: 0.8; }
</style>
