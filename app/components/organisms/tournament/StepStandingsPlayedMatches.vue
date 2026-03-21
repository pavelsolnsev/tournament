<!-- Компонент StepStandingsPlayedMatches: список уже сыгранных матчей и их события по игрокам. -->
<template>
  <div class="space-y-2">
    <h2 class="flex items-center gap-2 text-lg font-semibold text-slate-100">
      <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800/60 text-xs text-slate-300">
        🗒️
      </span>
      Сыгранные матчи
    </h2>

    <ul
      v-if="playedMatchesList.length > 0"
      class="max-h-72 overflow-y-auto pr-1 space-y-2"
      role="list"
    >
      <li
        v-for="m in playedMatchesList"
        :key="m.matchNumber"
        class="min-w-0 rounded-xl border border-slate-800/40 bg-slate-950/50 px-3 py-2.5"
      >
        <p class="mb-1.5 text-[10px] uppercase tracking-wider text-slate-500">
          Матч {{ m.matchNumber }}
        </p>

        <div
          v-if="m.homePlayers.length > 0 || m.awayPlayers.length > 0"
          class="mt-2 grid grid-cols-1 gap-y-2 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-0"
        >
          <div
            v-if="m.homePlayers.length > 0"
            class="min-w-0"
          >
            <div class="mb-2 flex min-w-0 items-center gap-2">
              <span aria-hidden="true" class="shrink-0 text-sm">{{ teamMarker(m.homeTeam) }}</span>
              <span class="min-w-0 truncate text-xs font-semibold text-slate-200">{{ m.homeTeam }}</span>
            </div>

            <div class="flex min-w-0 flex-col gap-2">
              <span
                v-for="p in m.homePlayers"
                :key="p.playerId"
                class="flex min-w-0 max-w-full items-center gap-1 rounded bg-slate-800/40 px-2 py-1 text-[11px] text-slate-300"
              >
                <span class="min-w-0 flex-1 truncate">{{ p.name }}</span>
                <span v-if="p.eventsLabel" class="shrink-0 truncate text-slate-500">{{ p.eventsLabel }}</span>
              </span>
            </div>
          </div>

          <div
            v-if="m.awayPlayers.length > 0"
            class="min-w-0"
          >
            <div class="mb-2 flex min-w-0 items-center gap-2">
              <span aria-hidden="true" class="shrink-0 text-sm">{{ teamMarker(m.awayTeam) }}</span>
              <span class="min-w-0 truncate text-xs font-semibold text-slate-200">{{ m.awayTeam }}</span>
            </div>

            <div class="flex min-w-0 flex-col gap-2">
              <span
                v-for="p in m.awayPlayers"
                :key="p.playerId"
                class="flex min-w-0 max-w-full items-center gap-1 rounded bg-slate-800/40 px-2 py-1 text-[11px] text-slate-300"
              >
                <span class="min-w-0 flex-1 truncate">{{ p.name }}</span>
                <span v-if="p.eventsLabel" class="shrink-0 truncate text-slate-500">{{ p.eventsLabel }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="flex min-w-0 items-center gap-2">
          <div class="flex min-w-0 flex-1 items-center gap-1.5 justify-start">
            <span aria-hidden="true" class="shrink-0 text-sm">{{ teamMarker(m.homeTeam) }}</span>
            <span class="min-w-0 truncate text-[11px] font-medium text-slate-300">{{ m.homeTeam }}</span>
          </div>

          <div class="shrink-0 rounded-lg bg-slate-800/60 px-2.5 py-1 text-center tabular-nums text-sm font-bold text-slate-100">
            {{ m.homeGoals }}&nbsp;:&nbsp;{{ m.awayGoals }}
          </div>

          <div class="flex min-w-0 flex-1 items-center gap-1.5 justify-end">
            <span class="min-w-0 truncate text-right text-[11px] font-medium text-slate-300">{{ m.awayTeam }}</span>
            <span aria-hidden="true" class="shrink-0 text-sm">{{ teamMarker(m.awayTeam) }}</span>
          </div>
        </div>
      </li>
    </ul>

    <p
      v-else
      class="rounded-lg bg-slate-900/30 px-3 py-4 text-center text-xs text-slate-500"
    >
      Пока матчей нет.
    </p>
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

// Эти типы повторяют структуру из composable, чтобы список матчей был типобезопасным.
defineProps<{
  playedMatchesList: PlayedMatch[]
  teamMarker: (teamName: string) => string
}>()
</script>

