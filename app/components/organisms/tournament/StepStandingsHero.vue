<!-- Компонент StepStandingsHero: заголовок шага турнирной таблицы и сама таблица standings. -->
<template>
  <div>
    <template v-if="showHeading">
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-50">
        Турнирная таблица
      </h1>
      <p class="text-slate-600 dark:text-slate-400 text-sm mb-4">
        <span v-if="tournamentName" class="truncate">{{ tournamentName }}</span>
        <span v-if="tournamentName && tournamentDate"> · </span>
        <span v-if="tournamentDate">{{ tournamentDate }}</span>
      </p>
    </template>
    <OrganismsStandingsTable
      :teams="teams"
      :rows="standingsRows"
      :team-colors="effectiveTeamColors"
    />
  </div>
</template>

<script setup lang="ts">
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'

// Этот блок только показывает заголовок шага и таблицу (без логики матчей).
withDefaults(
  defineProps<{
    tournamentName: string
    tournamentDate: string
    teams: string[]
    effectiveTeamColors: Record<string, number>
    standingsRows: StandingsRow[]
    /** Если false — только таблица (заголовок уже снаружи, например в сворачиваемой панели). */
    showHeading?: boolean
  }>(),
  { showHeading: true },
)
</script>

