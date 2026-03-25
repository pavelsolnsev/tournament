<!-- Компонент PlayedMatchDetails: показывает детали матча (отмеченных игроков и их события). -->
<template>
  <div class="border-t border-slate-800/60 bg-slate-950/40 px-3 pb-3 pt-2.5">
    <!-- Нет ни одного игрока с событиями -->
    <p
      v-if="match.homePlayers.length === 0 && match.awayPlayers.length === 0"
      class="text-center text-xs text-slate-600"
    >
      Нет отмеченных игроков.
    </p>

    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-4">
      <!-- Домашняя команда -->
      <div v-if="match.homePlayers.length > 0" class="min-w-0">
        <div class="mb-2 flex min-w-0 items-center gap-1.5">
          <span aria-hidden="true" class="shrink-0 text-sm">{{ teamMarker(match.homeTeam) }}</span>
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">{{ match.homeTeam }}</span>
        </div>
        <div class="flex flex-col gap-1.5">
          <div
            v-for="p in match.homePlayers"
            :key="p.playerId"
            class="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-slate-800/40 px-2.5 py-2"
          >
            <span class="min-w-0 flex-1 truncate text-sm text-slate-300">{{ p.name }}</span>
            <span v-if="p.eventsLabel" class="shrink-0 text-xs text-slate-500">{{ p.eventsLabel }}</span>
          </div>
        </div>
      </div>

      <!-- Гостевая команда -->
      <div v-if="match.awayPlayers.length > 0" class="min-w-0">
        <div class="mb-2 flex min-w-0 items-center gap-1.5">
          <span aria-hidden="true" class="shrink-0 text-sm">{{ teamMarker(match.awayTeam) }}</span>
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">{{ match.awayTeam }}</span>
        </div>
        <div class="flex flex-col gap-1.5">
          <div
            v-for="p in match.awayPlayers"
            :key="p.playerId"
            class="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-slate-800/40 px-2.5 py-2"
          >
            <span class="min-w-0 flex-1 truncate text-sm text-slate-300">{{ p.name }}</span>
            <span v-if="p.eventsLabel" class="shrink-0 text-xs text-slate-500">{{ p.eventsLabel }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type MarkedPlayer = {
  playerId: number
  name: string
  eventsLabel: string
}
// Это игрок, у которого в матче были события (гол/пас и т.д.).

type PlayedMatch = {
  matchNumber: number
  homeTeam: string
  awayTeam: string
  homeGoals: number
  awayGoals: number
  homePlayers: MarkedPlayer[]
  awayPlayers: MarkedPlayer[]
}
// Это один завершённый матч: команды, счёт и отметки по игрокам.

defineProps<{
  match: PlayedMatch
  teamMarker: (teamName: string) => string
}>()
</script>

