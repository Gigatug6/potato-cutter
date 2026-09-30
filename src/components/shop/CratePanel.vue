<script setup lang="ts">
import { computed, ref } from 'vue'
import { CRATE_PRICE, knifeById } from '../../game/data/knives'
import type { CrateResult } from '../../game/economy/crate'
import { RARITY_META } from '../../game/data/rarities'
import { useProfileStore } from '../../stores/profile'

const profile = useProfileStore()
const last = ref<CrateResult | null>(null)
const opening = ref(false)
const fmt = new Intl.NumberFormat('fr-FR')

function open() {
  if (opening.value || profile.money < CRATE_PRICE) return
  opening.value = true
  last.value = null
  setTimeout(() => {
    last.value = profile.openCrate()
    opening.value = false
  }, 700)
}
const knife = computed(() => (last.value ? knifeById(last.value.knifeId) : null))
const color = computed(() => (last.value ? RARITY_META[last.value.rarity].color : '#999'))
</script>

<template>
  <section class="panel crate" data-testid="crate">
    <h2>Caisse mystère</h2>
    <p>Peut contenir un couteau légendaire (1 % de chance). Un doublon est remboursé.</p>
    <button class="big" data-testid="open-crate" :disabled="opening || profile.money < CRATE_PRICE" @click="open">
      {{ opening ? 'Ouverture…' : `Ouvrir · ${fmt.format(CRATE_PRICE)} 🥔` }}
    </button>
    <div v-if="opening" class="box shake">📦</div>
    <div v-else-if="knife && last" class="reveal" :style="{ borderColor: color, boxShadow: `0 0 24px ${color}` }" data-testid="crate-result">
      <b>{{ knife.name }}</b> ({{ RARITY_META[last.rarity].label }})
      <div v-if="last.duplicate">Doublon : +{{ fmt.format(last.refund) }} 🥔 remboursés</div>
      <div v-else>Nouveau couteau !</div>
    </div>
  </section>
</template>

<style scoped>
.crate { margin-bottom: 16px; text-align: center; }
.box { font-size: 3rem; }
.shake { animation: shake 0.15s infinite; }
.reveal { margin-top: 10px; padding: 12px; border: 3px solid; border-radius: 12px; background: #fff; animation: pop 0.4s ease-out; }
@keyframes shake { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
@keyframes pop { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .shake, .reveal { animation: none; } }
</style>
