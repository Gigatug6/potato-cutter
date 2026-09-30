<script setup lang="ts">
import { computed, watch } from 'vue'
import { playBuy } from '../../audio/sfx'
import { useProfileStore } from '../../stores/profile'

const profile = useProfileStore()
const current = computed(() => profile.toasts[0] ?? null)
let timer: ReturnType<typeof setTimeout> | undefined

watch(current, (a) => {
  if (timer) clearTimeout(timer)
  if (a) {
    playBuy()
    timer = setTimeout(() => profile.dismissToast(), 4200)
  }
}, { immediate: true })
</script>

<template>
  <div class="wrap" aria-live="polite" role="status">
    <transition name="pop">
      <div v-if="current" :key="current.id" class="toast" data-testid="achievement-toast" @click="profile.dismissToast()">
        <span class="ic">{{ current.icon }}</span>
        <div>
          <b>Succès débloqué : {{ current.name }}</b>
          <small>{{ current.description }} · +{{ current.reward }} 🥔</small>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.wrap { position: fixed; top: 10px; left: 0; right: 0; display: flex; justify-content: center; pointer-events: none; z-index: 50; }
.toast { pointer-events: auto; display: flex; gap: 10px; align-items: center; background: #fff8ea; border: 3px solid #d4a100; border-radius: 14px; padding: 8px 14px; box-shadow: 0 8px 24px rgba(60, 35, 10, 0.35); max-width: 92vw; cursor: pointer; }
.ic { font-size: 2rem; }
small { display: block; opacity: 0.8; }
.pop-enter-active, .pop-leave-active { transition: all 0.3s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(-20px) scale(0.95); }
</style>
