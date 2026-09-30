import { watch } from 'vue'
import { writeSave } from '../game/save/storage'
import { useProfileStore } from './profile'

/** Sauvegarde le profil (debounce 300 ms + flush à la fermeture). Renvoie une fonction d'arrêt. */
export function installPersistence(delay = 300): () => void {
  const profile = useProfileStore()
  let timer: ReturnType<typeof setTimeout> | undefined
  const flush = () => { if (timer) clearTimeout(timer); timer = undefined; writeSave(profile.toSave()) }
  const stop = watch(
    () => JSON.stringify(profile.toSave()),
    () => { if (timer) clearTimeout(timer); timer = setTimeout(flush, delay) },
  )
  const onUnload = () => flush()
  if (typeof window !== 'undefined') window.addEventListener('beforeunload', onUnload)
  return () => {
    stop()
    if (typeof window !== 'undefined') window.removeEventListener('beforeunload', onUnload)
    if (timer) clearTimeout(timer)
  }
}
