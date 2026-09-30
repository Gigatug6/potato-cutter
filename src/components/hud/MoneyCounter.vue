<script setup lang="ts">
import { computed } from 'vue'
import { useProfileStore } from '../../stores/profile'

const profile = useProfileStore()
const fmt = new Intl.NumberFormat('fr-FR')
const text = computed(() => fmt.format(profile.money))
</script>

<template>
  <div class="money" data-testid="money" aria-label="Patacoins">🥔 <b>{{ text }}</b> Patacoins</div>
</template>

<style scoped>
.money { background: var(--panel); padding: 6px 12px; border-radius: 999px; box-shadow: var(--shadow); white-space: nowrap; }
</style>
