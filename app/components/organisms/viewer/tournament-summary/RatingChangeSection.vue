<template>
  <!-- Simple10: Рейтинг за турнир — кто больше всех прибавил (слева) и потерял (справа). -->
  <div id="summary-rating" class="scroll-mt-24 py-5 sm:px-6">
    <p class="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">📈 Рейтинг за турнир</p>
    <!-- Откуда цифры: полный итог с бонусами или только матчи (старые архивы и идущий турнир). -->
    <p class="mb-3 text-[11px] leading-snug text-slate-500 dark:text-slate-500">
      {{ ratingChanges.withTournamentBonus ? 'С бонусами за явку и звания' : 'Изменение за матчи, без бонусов за турнир' }}
    </p>

    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <div
        v-for="col in columns"
        :key="col.key"
        class="rounded-xl border px-3 py-2"
        :class="col.boxClass"
      >
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-widest" :class="col.labelClass">{{ col.title }}</p>
        <p v-if="col.rows.length === 0" class="py-1 text-[12px] text-slate-500 dark:text-slate-500">{{ col.empty }}</p>
        <div
          v-for="row in col.rows"
          :key="row.playerId"
          class="flex min-w-0 items-center gap-2.5 py-1"
        >
          <AtomsPlayerAvatar :photo="row.photo" :fallback-name="row.name" size="sm" class="shrink-0" />
          <span class="min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight text-slate-800 dark:text-slate-100">{{ row.name }}</span>
          <AtomsTeamMarkerOrLogo :team-name="row.teamName" :marker="row.teamMarker" size="sm" />
          <span class="w-12 shrink-0 text-right text-[13px] font-bold tabular-nums" :class="col.valueClass">{{ formatDelta(row.value) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RatingChanges } from '~/composables/tournament-summary/ratingAndGoalPlusAssist'

const props = defineProps<{
  ratingChanges: RatingChanges
}>()

// Две колонки одинаковой разметки: рост зелёным, падение красным.
const columns = computed(() => [
  {
    key: 'up',
    title: 'Больше всех прибавили',
    empty: 'Никто не прибавил',
    rows: props.ratingChanges.up,
    boxClass: 'border-emerald-300/35 bg-slate-50/90 dark:border-emerald-500/20 dark:bg-emerald-500/5',
    labelClass: 'text-emerald-700/80 dark:text-emerald-500/80',
    valueClass: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    key: 'down',
    title: 'Больше всех потеряли',
    empty: 'Никто не потерял',
    rows: props.ratingChanges.down,
    boxClass: 'border-red-300/35 bg-slate-50/90 dark:border-red-500/20 dark:bg-red-500/5',
    labelClass: 'text-red-700/80 dark:text-red-500/80',
    valueClass: 'text-red-700 dark:text-red-300',
  },
])

// +2.5 / −1.0 — один знак после запятой, настоящий минус для читаемости.
function formatDelta(v: number): string {
  const abs = Math.abs(v).toFixed(1)
  return v > 0 ? `+${abs}` : `−${abs}`
}
</script>
