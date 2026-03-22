<!-- Составы команд и суммарная статистика игроков за турнир (под таблицей). -->
<template>
  <section class="min-w-0 space-y-3 rounded-2xl border border-slate-800/60 bg-slate-900/50 p-4">
    <h2 class="flex items-center gap-2 text-lg font-semibold text-slate-100">
      <span
        class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800/60 text-xs text-slate-300"
        aria-hidden="true"
      >
        📊
      </span>
      Составы и статистика игроков
    </h2>
    <p class="text-[11px] text-slate-500">
      Голы, ассисты, сейвы и жёлтые — суммарно по всем завершённым матчам.
    </p>

    <div class="grid gap-4 sm:grid-cols-2">
      <div
        v-for="teamName in teams"
        :key="teamName"
        class="min-w-0 rounded-xl border border-slate-800/50 bg-slate-900/70 p-3"
      >
        <h3 class="mb-2 flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-100">
          <span aria-hidden="true" class="shrink-0">{{ teamMarker(teamName) }}</span>
          <span class="min-w-0 truncate">{{ teamName }}</span>
        </h3>

        <ul
          v-if="playersByTeam(teamName).length > 0"
          class="max-h-64 space-y-1 overflow-y-auto pr-1"
          role="list"
        >
          <li
            v-for="p in playersByTeam(teamName)"
            :key="p.id"
            class="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/40 bg-slate-800/40 px-2.5 py-1.5"
          >
            <span class="min-w-0 truncate text-sm font-medium text-slate-100">
              {{ displayPlayerLabel(p) }}
            </span>
            <span class="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-300">
              <span v-if="statsFor(p.id).goals > 0">⚽ {{ statsFor(p.id).goals }}</span>
              <span v-if="statsFor(p.id).assists > 0">🎯 {{ statsFor(p.id).assists }}</span>
              <span v-if="statsFor(p.id).saves > 0">🧤 {{ statsFor(p.id).saves }}</span>
              <span v-if="statsFor(p.id).yellows > 0">🟨 {{ statsFor(p.id).yellows }}</span>
              <span
                v-if="totalEvents(p.id) === 0"
                class="text-slate-500"
              >
                нет событий
              </span>
            </span>
          </li>
        </ul>
        <p
          v-else
          class="text-xs text-slate-500"
        >
          В составе нет игроков.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'

type PlayerMatchStats = {
  goals: number
  assists: number
  saves: number
  yellows: number
}

const props = defineProps<{
  teams: string[]
  playersByTeam: (teamName: string) => Player[]
  teamMarker: (teamName: string) => string
  displayPlayerLabel: (player: Player) => string
  aggregatePlayerStats: Record<number, PlayerMatchStats>
}>()

// Достаём итоги по id игрока или нули, если матчей ещё не было.
function statsFor(playerId: number): PlayerMatchStats {
  return props.aggregatePlayerStats[playerId] ?? { goals: 0, assists: 0, saves: 0, yellows: 0 }
}

// Считаем, есть ли хоть одно событие — чтобы показать «нет событий».
function totalEvents(playerId: number): number {
  const s = statsFor(playerId)
  return s.goals + s.assists + s.saves + s.yellows
}
</script>
