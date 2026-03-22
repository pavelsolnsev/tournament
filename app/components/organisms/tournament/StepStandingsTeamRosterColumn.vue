<!-- Компонент StepStandingsTeamRosterColumn: колонка списка игроков команды (хозяева/гости) в управлении матчем. -->
<template>
  <div class="rounded-xl border border-slate-800/50 bg-slate-900/70 p-2 sm:p-3">
    <h3 class="mb-1.5 flex min-w-0 items-center gap-1 text-xs font-semibold text-slate-100">
      <span v-if="teamName" aria-hidden="true" class="shrink-0">
        {{ teamMarker(teamName) }}
      </span>
      <span class="min-w-0 truncate">{{ teamName }}</span>
    </h3>

    <ul class="max-h-72 min-h-0 space-y-1 overflow-y-auto pr-1" role="list">
      <li
        v-for="p in players"
        :key="p.id"
        :title="'Клик — сразу выбрать событие для: ' + displayPlayerLabel(p)"
        class="cursor-pointer rounded-lg border border-transparent bg-slate-800/50 px-3 py-2 text-left transition hover:bg-slate-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 active:scale-[0.99]"
        :class="[
          isActivePlayer(side, p.id)
            ? ['border-emerald-500/40', 'bg-slate-900/85', activeShadowClass]
            : []
        ]"
        @click="handlePlayerRowClick(side, p.id)"
      >
        <div class="flex min-w-0 items-center justify-between gap-2">
          <div class="min-w-0 flex-1">
            <span class="block min-w-0 truncate text-sm font-medium text-slate-100">
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
            :id="eventSelectDomId(side, p.id)"
            class="w-full max-w-[11rem] rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 outline-none ring-0 ring-offset-0 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0"
            @click.stop
            @mousedown.stop
            @change="onSelectAction(side, p.id, $event)"
          >
            <option class="bg-slate-900 text-slate-100" value="">
              Добавить событие
            </option>
            <option class="bg-slate-900 text-slate-100" value="goals">
              ⚽ Гол
            </option>
            <option class="bg-slate-900 text-slate-100" value="assists">
              🎯 Ассист
            </option>
            <option class="bg-slate-900 text-slate-100" value="saves">
              🧤 Сейв
            </option>
            <option class="bg-slate-900 text-slate-100" value="yellows">
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
const rosterColumnProps = defineProps<{
  side: Side
  teamName: string
  players: Player[]
  activeShadowClass: string
  teamMarker: (teamName: string) => string
  displayPlayerLabel: (player: Player) => string
  isActivePlayer: (side: Side, playerId: number) => boolean
  selectPlayerForMark: (side: Side, playerId: number) => void
  playerStat: (side: Side, playerId: number) => PlayerMatchStats
  onSelectAction: (side: Side, playerId: number, event: Event) => void
}>()

// Стабильный id для <select>, чтобы после клика по строке найти его и открыть список событий.
function eventSelectDomId(side: Side, playerId: number) {
  return `match-event-select-${side}-${playerId}`
}

// Сначала выбираем игрока; после отрисовки селекта сразу открываем выбор события (один жест с экрана).
function handlePlayerRowClick(side: Side, playerId: number) {
  rosterColumnProps.selectPlayerForMark(side, playerId)
  nextTick(() => {
    if (!rosterColumnProps.isActivePlayer(side, playerId)) return
    const el = document.getElementById(eventSelectDomId(side, playerId)) as HTMLSelectElement | null
    if (!el) return
    el.focus()
    try {
      el.showPicker?.()
    }
    catch {
      // В части браузеров showPicker недоступен или бросает — остаётся фокус, пользователь открывает список вручную.
    }
  })
}
</script>
