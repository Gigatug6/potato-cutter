<script setup lang="ts">
import { ACHIEVEMENTS } from '../../game/data/achievements'
import { CUT_MODES } from '../../game/cutting/cutModes'
import { KNIVES } from '../../game/data/knives'
import { RARITY_META } from '../../game/data/rarities'
import { useProfileStore } from '../../stores/profile'
import RarityBadge from '../shop/RarityBadge.vue'
import ScreenShell from './ScreenShell.vue'

const profile = useProfileStore()
const modes = Object.values(CUT_MODES)
const sorted = [...KNIVES].sort((a, b) => RARITY_META[a.rarity].order - RARITY_META[b.rarity].order)
const secs = (ms: number | null) => (ms === null ? '—' : `${(ms / 1000).toFixed(1)} s`)
</script>

<template>
  <ScreenShell title="Collection">
    <section class="panel stats" data-testid="stats">
      <h2>Statistiques</h2>
      <p>Patates coupées : <b>{{ profile.stats.potatoes }}</b> · Série : <b>{{ profile.stats.streak }}</b> · Total gagné : <b>{{ profile.totalEarned }}</b> 🥔</p>
      <ul>
        <li v-for="m in modes" :key="m.id">{{ m.label }} : meilleure note <b>{{ profile.stats.bestGrade[m.id] ?? '—' }}</b>, meilleur temps <b>{{ secs(profile.stats.bestTimeMs[m.id]) }}</b></li>
      </ul>
    </section>
    <section class="panel stats" data-testid="achievements">
      <h2>🏆 Succès ({{ profile.achievements.length }}/{{ ACHIEVEMENTS.length }})</h2>
      <div class="ach">
        <article v-for="a in ACHIEVEMENTS" :key="a.id" class="a" :class="{ done: profile.achievements.includes(a.id) }" :data-testid="`ach-${a.id}`">
          <span class="ic">{{ profile.achievements.includes(a.id) ? a.icon : '🔒' }}</span>
          <div>
            <b>{{ a.name }}</b>
            <small>{{ a.description }}</small>
            <small v-if="a.progress && !profile.achievements.includes(a.id)">{{ a.progress(profile.achievementContext)[0] }}/{{ a.progress(profile.achievementContext)[1] }}</small>
          </div>
        </article>
      </div>
    </section>
    <section class="panel stats" data-testid="leaderboard">
      <h2>🏆 Classement chrono (local)</h2>
      <ol v-if="profile.leaderboard.length">
        <li v-for="(e, i) in profile.leaderboard" :key="i">
          <b>{{ e.score }} 🥔</b> — {{ e.potatoes }} patate(s) · {{ e.mode }} · {{ e.date }}
        </li>
      </ol>
      <p v-else>Aucun score. Lance un « Chrono 60 s » depuis le menu !</p>
    </section>
    <h2 class="t">Couteaux ({{ Object.keys(profile.ownedKnives).length }}/{{ KNIVES.length }})</h2>
    <div class="grid">
      <article v-for="k in sorted" :key="k.id" class="panel k" :class="{ missing: !profile.owns(k.id) }" :data-testid="`col-${k.id}`">
        <template v-if="profile.owns(k.id)">
          <b>{{ k.name }}</b> <RarityBadge :rarity="k.rarity" />
          <div>×{{ profile.ownedKnives[k.id].count }}</div>
        </template>
        <template v-else>
          <b>???</b> <RarityBadge :rarity="k.rarity" />
        </template>
      </article>
    </div>
  </ScreenShell>
</template>

<style scoped>
.t { margin-top: 16px; }
.stats { margin-bottom: 12px; }
.ach { display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
.a { display: flex; gap: 8px; align-items: center; background: #fff; border-radius: 10px; padding: 6px 10px; opacity: 0.6; }
.a.done { opacity: 1; box-shadow: inset 0 0 0 2px #d4a100; }
.a .ic { font-size: 1.6rem; }
.a small { display: block; opacity: 0.75; font-size: 0.78rem; }
.k.missing { opacity: 0.55; filter: grayscale(1); }
</style>
