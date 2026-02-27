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
    <OrganismsStandingsTable :teams="teams" :team-colors="teamColors" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  tournamentName: string
  tournamentDate: string
  teams: string[]
  teamColors: Record<string, number>
}>()
</script>

