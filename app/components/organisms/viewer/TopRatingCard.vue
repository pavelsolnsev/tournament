<!-- Топ-10 рейтинга игроков для гостя на главной: место, фото, имя, рейтинг и стрелка прогресса. -->
<template>
  <section
    v-if="top.length > 0"
    class="flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-slate-300 bg-white/80 p-4 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/70 sm:p-6"
    aria-label="Топ-10 рейтинга"
  >
    <p class="text-[11px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">🏅 Топ-10 рейтинга</p>

    <ol class="flex flex-col">
      <li
        v-for="(p, i) in top"
        :key="p.id"
        class="flex min-w-0 items-center gap-2.5 border-b border-slate-200/70 py-1.5 last:border-b-0 dark:border-slate-700/40"
      >
        <span
          class="w-6 shrink-0 text-right text-sm font-bold tabular-nums"
          :class="i < 3 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'"
        >{{ i + 1 }}</span>
        <AtomsPlayerAvatar :photo="p.photo" :fallback-name="p.name" size="sm" class="shrink-0" />
        <span class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{{ p.name }}</span>
        <!-- Стрелка: вырос / упал с прошлого обновления рейтинга (как на сайте рейтингов) -->
        <span
          v-if="(p.ratingTrend ?? 0) > 0"
          class="shrink-0 text-xs text-emerald-600 dark:text-emerald-400"
          title="Рейтинг вырос"
        >▲</span>
        <span
          v-else-if="(p.ratingTrend ?? 0) < 0"
          class="shrink-0 text-xs text-red-600 dark:text-red-400"
          title="Рейтинг упал"
        >▼</span>
        <span class="w-12 shrink-0 text-right text-sm font-bold tabular-nums text-slate-800 dark:text-slate-100">{{ formatRating(p.rating) }}</span>
      </li>
    </ol>

    <a
      href="https://football.pavelsolntsev.ru"
      target="_blank"
      rel="noopener noreferrer"
      class="text-center text-sm font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
    >Весь рейтинг игроков →</a>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Player } from '~/types/tournament'

const TOP_SIZE = 10

const props = defineProps<{
  players: Player[]
}>()

// Лучшие по рейтингу среди тех, кто уже играл (новичков с нулевым рейтингом не показываем).
const top = computed(() =>
  [...props.players]
    .filter((p) => Number(p.rating) > 0 && Number(p.gamesPlayed ?? 1) > 0)
    .sort((a, b) => Number(b.rating) - Number(a.rating))
    .slice(0, TOP_SIZE),
)

// Рейтинг с одним знаком после запятой, как в таблице рейтинга.
function formatRating(r: number | null | undefined): string {
  const n = Number(r)
  return Number.isFinite(n) ? n.toFixed(1) : '—'
}
</script>
