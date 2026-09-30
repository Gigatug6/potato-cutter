<script setup lang="ts">
import { ref } from 'vue'
import { useProfileStore } from '../../stores/profile'
import ScreenShell from './ScreenShell.vue'

const profile = useProfileStore()
const confirming = ref(false)
function reset() {
  if (!confirming.value) { confirming.value = true; return }
  profile.resetSave()
  confirming.value = false
}
</script>

<template>
  <ScreenShell title="Réglages">
    <section class="panel set">
      <label><input v-model="profile.settings.sound" type="checkbox" data-testid="opt-sound" /> Son</label>
      <label><input v-model="profile.settings.reducedMotion" type="checkbox" data-testid="opt-motion" /> Réduire les animations</label>
      <label>Qualité (résolution max)
        <select v-model.number="profile.settings.pixelRatioCap">
          <option :value="1">Basse</option><option :value="2">Normale</option><option :value="3">Haute</option>
        </select>
      </label>
      <button class="ghost" data-testid="reset" @click="reset">{{ confirming ? 'Confirmer : tout effacer ?' : 'Réinitialiser la sauvegarde' }}</button>
      <button v-if="confirming" class="ghost" @click="confirming = false">Annuler</button>
    </section>
  </ScreenShell>
</template>

<style scoped>
.set { display: flex; flex-direction: column; gap: 14px; max-width: 420px; }
</style>
