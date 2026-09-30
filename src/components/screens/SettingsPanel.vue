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
      <label>Musique et ambiance
        <input v-model.number="profile.settings.music" type="range" min="0" max="1" step="0.05" data-testid="opt-music" aria-label="Volume de la musique" />
      </label>
      <label><input v-model="profile.settings.reducedMotion" type="checkbox" data-testid="opt-motion" /> Réduire les animations</label>
      <label>Qualité graphique
        <select v-model="profile.settings.quality" data-testid="opt-quality">
          <option value="low">Basse (rapide)</option><option value="high">Élevée (AO, bloom, cinéma)</option><option value="ultra">Ultra (+ profondeur de champ)</option>
        </select>
      </label>
      <label>Résolution max
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
