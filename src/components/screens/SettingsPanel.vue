<script setup lang="ts">
import { ref } from 'vue'
import { CloudFailure, downloadSave, formatCode, generateCode, normalizeCode, pullSave, pushSave, readSaveFile, storeCode, storedCode } from '../../cloud'
import type { SaveV1 } from '../../game/save/saveSchema'
import { useProfileStore } from '../../stores/profile'
import ScreenShell from './ScreenShell.vue'

const profile = useProfileStore()
const confirming = ref(false)
// ---- sauvegarde en ligne + fichier
const codeInput = ref(storedCode() ? formatCode(storedCode()) : '')
const cloudMsg = ref('')
const cloudBusy = ref(false)
const pending = ref<{ save: SaveV1; label: string; code?: string } | null>(null)
const fileInput = ref<HTMLInputElement>()

const ERR: Record<string, string> = {
  network: 'Serveur injoignable.', unknown_code: 'Code inconnu : aucune sauvegarde trouvée.', rate_limited: 'Trop de requêtes, réessaie dans une minute.',
  too_large: 'Sauvegarde trop volumineuse.', server: 'Erreur du serveur.',
}

async function guarded(fn: () => Promise<void>) {
  cloudBusy.value = true
  cloudMsg.value = ''
  try { await fn() } catch (e) { cloudMsg.value = ERR[e instanceof CloudFailure ? e.kind : 'server'] } finally { cloudBusy.value = false }
}

const createCode = () => guarded(async () => {
  const code = generateCode()
  await pushSave(code, profile.toSave())
  storeCode(code)
  codeInput.value = formatCode(code)
  cloudMsg.value = 'Code créé et sauvegarde envoyée. Note bien ce code !'
})

const push = () => guarded(async () => {
  const code = normalizeCode(codeInput.value)
  if (!code) { cloudMsg.value = 'Code invalide (16 caractères A–Z, 2–7).'; return }
  await pushSave(code, profile.toSave())
  storeCode(code)
  cloudMsg.value = 'Sauvegarde envoyée.'
})

const pull = () => guarded(async () => {
  const code = normalizeCode(codeInput.value)
  if (!code) { cloudMsg.value = 'Code invalide (16 caractères A–Z, 2–7).'; return }
  const { save, updatedAt } = await pullSave(code)
  pending.value = { save, code, label: new Date(updatedAt).toLocaleString() }
})

async function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!f) return
  const save = await readSaveFile(f)
  if (!save) { cloudMsg.value = 'Fichier invalide.'; return }
  pending.value = { save, label: f.name }
}

function confirmReplace() {
  if (!pending.value) return
  profile.applySave(pending.value.save)
  if (pending.value.code) storeCode(pending.value.code)
  cloudMsg.value = 'Sauvegarde restaurée.'
  pending.value = null
}

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
      <label>Langue
        <select v-model="profile.settings.lang" data-testid="opt-lang" aria-label="Langue / Language">
          <option value="fr">Français</option><option value="en">English</option>
        </select>
      </label>
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
    <section class="panel set save" data-testid="save-panel">
      <h2>☁ Sauvegarde</h2>
      <label>Code de synchronisation
        <input v-model="codeInput" data-testid="sync-code" type="text" maxlength="24" autocomplete="off" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX" />
      </label>
      <div class="row">
        <button :disabled="cloudBusy" data-testid="cloud-create" @click="createCode">Créer un code</button>
        <button class="ghost" :disabled="cloudBusy" data-testid="cloud-push" @click="push">Envoyer</button>
        <button class="ghost" :disabled="cloudBusy" data-testid="cloud-pull" @click="pull">Restaurer</button>
      </div>
      <div class="row">
        <button class="ghost" data-testid="file-export" @click="downloadSave(profile.toSave())">Exporter (.json)</button>
        <button class="ghost" data-testid="file-import" @click="fileInput?.click()">Importer un fichier</button>
        <input ref="fileInput" type="file" accept="application/json,.json" hidden data-testid="file-input" @change="onFile" />
      </div>
      <div v-if="pending" class="confirm" data-testid="replace-confirm">
        <span>Remplacer la sauvegarde locale par « {{ pending.label }} » ?</span>
        <button data-testid="replace-yes" @click="confirmReplace">Confirmer</button>
        <button class="ghost" @click="pending = null">Annuler</button>
      </div>
      <p v-if="cloudMsg" class="msg" role="status" data-testid="cloud-msg">{{ cloudMsg }}</p>
    </section>
  </ScreenShell>
</template>

<style scoped>
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.confirm { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; background: #fff0cc; border-radius: 10px; padding: 8px; }
.msg { margin: 0; font-weight: 700; }
input[type='text'] { width: 100%; padding: 8px; font: inherit; font-family: ui-monospace, monospace; letter-spacing: 1px; border: 2px solid var(--ink); border-radius: 8px; }
.save { margin-top: 12px; }
.set { display: flex; flex-direction: column; gap: 14px; max-width: 420px; }
</style>
