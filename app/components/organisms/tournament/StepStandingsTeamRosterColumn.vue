<!-- Компонент StepStandingsTeamRosterColumn: колонка списка игроков команды (хозяева/гости) в управлении матчем. -->
<template>
  <div class="rounded-xl bg-slate-900/70 p-2">
    <h3 class="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-100">
      <span v-if="teamName" aria-hidden="true">
        {{ teamMarker(teamName) }}
      </span>
      <span class="truncate">{{ teamName }}</span>
    </h3>

    <ul class="space-y-1.5" role="list">
      <li
        v-for="p in players"
        :key="p.id"
        class="rounded-lg bg-slate-800/60 px-2 py-1.5 text-left transition cursor-pointer"
        :class="[
          isActivePlayer(side, p.id)
            ? ['bg-slate-900/80', activeShadowClass]
            : 'hover:bg-slate-800'
        ]"
        @click="selectPlayerForMark(side, p.id)"
      >
        <div class="flex min-w-0 items-center justify-between gap-2">
          <div class="min-w-0 truncate">
            <span class="text-xs font-medium text-slate-100">
              {{ displayPlayerLabel(p) }}
            </span>
          </div>

          <div class="flex shrink-0 items-center gap-2 text-[11px] text-slate-300">
            <span v-if="playerStat(side, p.id).goals">⚽ {{ playerStat(side, p.id).goals }}</span>
            <span v-if="playerStat(side, p.id).assists">🎯 {{ playerStat(side, p.id).assists }}</span>
            <span v-if="playerStat(side, p.id).saves">🧤 {{ playerStat(side, p.id).saves }}</span>
            <span v-if="playerStat(side, p.id).yellows">🟨 {{ playerStat(side, p.id).yellows }}</span>
          </div>
        </div>

        <div
          v-if="isActivePlayer(side, p.id)"
          class="mt-1 flex items-center gap-2 text-[11px]"
        >
          <select
            :class="[
              'w-full max-w-[11rem] rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 focus:outline-none',
              selectFocusClass,
            ]"
            @click.stop
            @mousedown.stop
            @change="onSelectAction(side, p.id, $event)"
          >
            <option value="">
              Добавить событие
            </option>
            <option value="goals">
              ⚽ Гол
            </option>
            <option value="assists">
              🎯 Ассист
            </option>
            <option value="saves">
              🧤 Сейв
            </option>
            <option value="yellows">
              🟨 Жёлтая
            </option>
          </select>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'

type Side = 'home' | 'away'
// Это сторона матча: домашняя или гостевая.

type PlayerMatchStats = {
  goals: number
  assists: number
  saves: number
  yellows: number
}
// Это маленькие счётчики событий игрока в текущем матче.

// Этот блок показывает список игроков команды и даёт добавить события.
defineProps<{
  side: Side
  teamName: string
  players: Player[]
  activeShadowClass: string
  selectFocusClass: string
  teamMarker: (teamName: string) => string
  displayPlayerLabel: (player: Player) => string
  isActivePlayer: (side: Side, playerId: number) => boolean
  selectPlayerForMark: (side: Side, playerId: number) => void
  playerStat: (side: Side, playerId: number) => PlayerMatchStats
  onSelectAction: (side: Side, playerId: number, event: Event) => void
}>()
</script>
