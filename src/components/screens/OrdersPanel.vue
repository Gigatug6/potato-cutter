<script setup lang="ts">
import { CUT_MODES } from '../../game/cutting/cutModes'
import { useProfileStore } from '../../stores/profile'

const profile = useProfileStore()
</script>

<template>
  <section class="panel" data-testid="orders">
    <h2>🍽 Commandes</h2>
    <p class="sub">Livre un plat pour un bonus ! Fais le bon mode avec la note demandée.</p>
    <ul>
      <li v-for="o in profile.orders" :key="o.id" :data-testid="`order-${o.dishId}`">
        <b>{{ o.label }}</b>
        <span>{{ CUT_MODES[o.mode].label }} · note ≥ {{ o.minGrade }}</span>
        <em>bonus ×{{ o.multiplier }}</em>
      </li>
    </ul>
  </section>
</template>

<style scoped>
h2 { font-size: 1.1rem; }
.sub { margin: 0 0 6px; font-size: 0.8rem; opacity: 0.75; }
ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
li { display: grid; grid-template-columns: 1fr auto; gap: 0 8px; background: #fff; border-radius: 10px; padding: 6px 10px; font-size: 0.88rem; }
li span { grid-column: 1; font-size: 0.78rem; opacity: 0.75; }
li em { grid-column: 2; grid-row: 1 / span 2; align-self: center; color: var(--ok); font-weight: 800; font-style: normal; }
</style>
