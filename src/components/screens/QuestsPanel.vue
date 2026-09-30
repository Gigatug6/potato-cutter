<script setup lang="ts">
import { playBuy } from '../../audio/sfx'
import { isComplete } from '../../game/quests/quests'
import { useProfileStore } from '../../stores/profile'

const profile = useProfileStore()
function claim(id: string) {
  if (profile.claimQuest(id)) playBuy()
}
</script>

<template>
  <section class="panel" data-testid="quests">
    <h2>🎯 Quêtes du jour</h2>
    <ul v-if="profile.quests">
      <li v-for="q in profile.quests.items" :key="q.id" :data-testid="`quest-${q.type}`">
        <div class="t"><b>{{ q.label }}</b><span>{{ q.progress }}/{{ q.target }} · +{{ q.reward }} 🥔</span></div>
        <div class="bar"><div :style="{ width: Math.min(100, (q.progress / q.target) * 100) + '%' }"></div></div>
        <button v-if="!q.claimed" :disabled="!isComplete(q)" data-testid="claim" @click="claim(q.id)">Récupérer</button>
        <small v-else>✔ Récupérée</small>
      </li>
    </ul>
  </section>
</template>

<style scoped>
h2 { font-size: 1.1rem; }
ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
li { background: #fff; border-radius: 10px; padding: 8px 10px; display: grid; grid-template-columns: 1fr auto; gap: 4px 8px; align-items: center; font-size: 0.88rem; }
.t { display: flex; flex-direction: column; }
.t span { font-size: 0.78rem; opacity: 0.75; }
.bar { grid-column: 1 / -1; height: 6px; background: #eadfc8; border-radius: 3px; overflow: hidden; order: 3; }
.bar div { height: 100%; background: var(--ok); transition: width 0.3s; }
button { padding: 4px 10px; font-size: 0.8rem; }
</style>
