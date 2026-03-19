<!-- Компонент StepStandingsHero: заголовок шага турнирной таблицы и сама таблица standings. -->
<template>
  <div>
    <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-50">
      Турнирная таблица
    </h1>
    <p class="text-slate-400 text-sm mb-4">
      <span v-if="tournamentName" class="truncate">{{ tournamentName }}</span>
      <span v-if="tournamentName && tournamentDate"> · </span>
      <span v-if="tournamentDate">{{ tournamentDate }}</span>
    </p>
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
defineProps<{
  tournamentName: string
  tournamentDate: string
  teams: string[]
  effectiveTeamColors: Record<string, number>
  standingsRows: StandingsRow[]
}>()
</script>

