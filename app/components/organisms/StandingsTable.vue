<template>
  <div class="w-full overflow-x-auto overflow-y-hidden rounded-lg border border-slate-600">
    <table class="standings-table w-full min-w-0 table-fixed border-collapse text-left text-xs sm:text-sm">
      <colgroup>
        <col :style="{ width: colMWidth }">
        <col :style="{ width: colKomWidth }">
        <col v-for="n in 8" :key="n" :style="{ width: colNumWidth }">
      </colgroup>
      <thead>
        <tr class="border-b border-slate-600 bg-slate-800/70">
          <th class="px-0.5 py-1 font-semibold text-slate-300 sm:px-2 sm:py-2">М</th>
          <th class="min-w-0 px-0.5 py-1 text-left font-semibold text-slate-300 sm:px-2 sm:py-2">Ком</th>
          <th class="px-0.5 py-1 text-center font-semibold text-slate-300 sm:px-2 sm:py-2">И</th>
          <th class="px-0.5 py-1 text-center font-semibold text-slate-300 sm:px-2 sm:py-2">В</th>
          <th class="px-0.5 py-1 text-center font-semibold text-slate-300 sm:px-2 sm:py-2">Н</th>
          <th class="px-0.5 py-1 text-center font-semibold text-slate-300 sm:px-2 sm:py-2">П</th>
          <th class="px-0.5 py-1 text-center font-semibold text-slate-300 sm:px-2 sm:py-2">ЗМ</th>
          <th class="px-0.5 py-1 text-center font-semibold text-slate-300 sm:px-2 sm:py-2">ПМ</th>
          <th class="px-0.5 py-1 text-center font-semibold text-slate-300 sm:px-2 sm:py-2">РМ</th>
          <th class="px-0.5 py-1 text-center font-semibold text-slate-300 sm:px-2 sm:py-2">О</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, i) in rows"
          :key="row.teamName"
          class="border-b border-slate-700/70 hover:bg-slate-800/30"
        >
          <td class="px-0.5 py-0.5 font-medium text-slate-400 sm:px-2 sm:py-1.5">{{ row.place }}</td>
          <td class="min-w-0 truncate px-0.5 py-0.5 sm:px-2 sm:py-1.5">
            <span class="mr-0.5 sm:mr-1.5" aria-hidden="true">{{ markerForTeam(row.teamName, i) }}</span>
            <span class="text-slate-100">{{ row.teamName }}</span>
          </td>
          <td class="whitespace-nowrap px-0.5 py-0.5 text-center tabular-nums text-slate-300 sm:px-2 sm:py-1.5">{{ row.played }}</td>
          <td class="whitespace-nowrap px-0.5 py-0.5 text-center tabular-nums text-slate-300 sm:px-2 sm:py-1.5">{{ row.wins }}</td>
          <td class="whitespace-nowrap px-0.5 py-0.5 text-center tabular-nums text-slate-300 sm:px-2 sm:py-1.5">{{ row.draws }}</td>
          <td class="whitespace-nowrap px-0.5 py-0.5 text-center tabular-nums text-slate-300 sm:px-2 sm:py-1.5">{{ row.losses }}</td>
          <td class="whitespace-nowrap px-0.5 py-0.5 text-center tabular-nums text-slate-300 sm:px-2 sm:py-1.5">{{ row.goalsFor }}</td>
          <td class="whitespace-nowrap px-0.5 py-0.5 text-center tabular-nums text-slate-300 sm:px-2 sm:py-1.5">{{ row.goalsAgainst }}</td>
          <td class="whitespace-nowrap px-0.5 py-0.5 text-center tabular-nums text-slate-300 sm:px-2 sm:py-1.5">
            <span :class="row.goalDiff > 0 ? 'text-emerald-400' : row.goalDiff < 0 ? 'text-red-400' : ''">
              {{ row.goalDiff >= 0 ? ` ${row.goalDiff}` : row.goalDiff }}
            </span>
          </td>
          <td class="whitespace-nowrap px-0.5 py-0.5 text-center tabular-nums font-medium text-slate-100 sm:px-2 sm:py-1.5">{{ row.points }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
export interface StandingsRow {
  place: number
  teamName: string
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}

const props = defineProps<{
  teams: string[]
  /** Team name -> color index 0–3 (🔴 🟢 🔵 🟡) */
  teamColors?: Record<string, number>
  /** Optional: precomputed rows (e.g. from API). If not provided, rows are built with zeros. */
  rows?: StandingsRow[]
}>()

const teamMarkers = ['🔴', '🟢', '🔵', '🟡']

const colMWidth = '3%'
const colKomWidth = '22%'
const colNumWidth = '9.375%'

const rows = computed<StandingsRow[]>(() => {
  if (props.rows && props.rows.length > 0) {
    return props.rows
  }
  return props.teams.map((name, index) => ({
    place: index + 1,
    teamName: name,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  }))
})

function markerForTeam(teamName: string, rowIndex: number): string {
  const index = props.teamColors?.[teamName] ?? rowIndex % 4
  return teamMarkers[Math.max(0, Math.min(index, 3))]
}
</script>
