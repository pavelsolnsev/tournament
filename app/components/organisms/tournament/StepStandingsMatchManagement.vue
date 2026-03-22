<!-- StepStandingsMatchManagement.vue -->
<template>
  <div class="flex flex-col gap-4">

    <h3 class="text-xs font-medium uppercase tracking-widest text-slate-400">
      ⚽ Управление матчем
    </h3>

    <!-- Выбор команд -->
    <OrganismsTournamentStepStandingsTeamPickers
      :teams="teams"
      :home-team="homeTeam"
      :away-team="awayTeam"
      @update:home-team="$emit('update:homeTeam', $event)"
      @update:away-team="$emit('update:awayTeam', $event)"
    />

    <!-- Карточка матча -->
    <div
      v-if="homeTeam && awayTeam"
      class="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900"
    >

      <!-- Табло -->
      <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-slate-700/60 px-4 py-3">
        <p class="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-100">
          <span class="shrink-0">{{ teamMarker(homeTeam) }}</span>
          <span class="truncate">{{ homeTeam }}</span>
        </p>

        <div class="text-center">
          <p class="mb-0.5 text-[10px] uppercase tracking-widest text-slate-500">Счёт</p>
          <p class="font-mono text-xl font-semibold tabular-nums text-slate-50">
            {{ homeGoals }}&nbsp;:&nbsp;{{ awayGoals }}
          </p>
        </div>

        <p class="flex items-center justify-end gap-1.5 truncate text-sm font-semibold text-slate-100">
          <span class="truncate">{{ awayTeam }}</span>
          <span class="shrink-0">{{ teamMarker(awayTeam) }}</span>
        </p>
      </div>

      <!-- Составы -->
      <div class="grid grid-cols-2 divide-x divide-slate-700/60">
        <OrganismsTournamentStepStandingsTeamRosterColumn
          side="home"
          :team-name="homeTeam"
          :players="playersByTeam(homeTeam)"
          active-shadow-class="bg-sky-500/10 border-sky-500/40"
          :team-marker="teamMarker"
          :display-player-label="displayPlayerLabel"
          :is-active-player="isActivePlayer"
          :select-player-for-mark="selectPlayerForMark"
          :player-stat="playerStat"
          :on-select-action="onSelectAction"
        />
        <OrganismsTournamentStepStandingsTeamRosterColumn
          side="away"
          :team-name="awayTeam"
          :players="playersByTeam(awayTeam)"
          active-shadow-class="bg-emerald-500/10 border-emerald-500/40"
          :team-marker="teamMarker"
          :display-player-label="displayPlayerLabel"
          :is-active-player="isActivePlayer"
          :select-player-for-mark="selectPlayerForMark"
          :player-stat="playerStat"
          :on-select-action="onSelectAction"
        />
      </div>

      <!-- Панель кнопок -->
      <div class="flex flex-wrap items-center gap-2 border-t border-slate-700/60 px-3 py-2.5">
        <button
          type="button"
          class="rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-900
                 transition-opacity active:opacity-75
                 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!hasNextMatch"
          @click="handleMgmtAction(goToNextMatch)"
        >
          Следующий матч →
        </button>

        <button
          :id="mgmtToggleId"
          type="button"
          class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium
                 text-slate-300 transition-colors focus:outline-none"
          :class="isMgmtOpen
            ? 'bg-slate-600 ring-1 ring-slate-500/50'
            : 'bg-slate-700 hover:bg-slate-600'"
          :aria-expanded="isMgmtOpen"
          :aria-controls="mgmtPanelId"
          @click="isMgmtOpen = !isMgmtOpen"
        >
          <span
            class="text-[10px] font-bold leading-none tracking-tight"
            :class="isMgmtOpen ? 'text-sky-400' : 'text-slate-400'"
          >
            •••
          </span>
          <span>Управление</span>
          <svg
            class="h-3.5 w-3.5 text-slate-400 transition-transform duration-200"
            :class="isMgmtOpen && 'rotate-180'"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <!-- Скрытые действия управления -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out overflow-hidden"
        enter-from-class="max-h-0 opacity-0"
        enter-to-class="max-h-40 opacity-100"
        leave-active-class="transition-all duration-150 ease-in overflow-hidden"
        leave-from-class="max-h-40 opacity-100"
        leave-to-class="max-h-0 opacity-0"
      >
        <div
          v-if="isMgmtOpen"
          :id="mgmtPanelId"
          role="region"
          :aria-labelledby="mgmtToggleId"
          class="flex flex-col gap-2 border-t border-slate-700/60 bg-slate-950/40 px-3 py-2.5"
        >
          <button
            type="button"
            class="w-full rounded-lg bg-slate-700 px-3 py-2 text-xs font-medium
                   text-slate-200 transition-colors hover:bg-slate-600 active:bg-slate-800"
            @click="handleMgmtAction(resetMatchStats)"
          >
            Сбросить матч
          </button>
          <button
            type="button"
            class="w-full rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold
                   text-slate-900 transition-colors active:bg-emerald-600
                   disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="!canFinishMatch"
            @click="handleMgmtAction(finishMatch)"
          >
            Завершить матч
          </button>
        </div>
      </Transition>

      <!-- Подсказка -->
      <p
        v-if="!hasNextMatch"
        class="px-4 pb-3 text-[11px] text-slate-500"
      >
        Все пары команд уже сыграли между собой.
      </p>

    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'

type Side = 'home' | 'away'

type PlayerMatchStats = {
  goals: number
  assists: number
  saves: number
  yellows: number
}

const props = defineProps<{
  teams: string[]
  homeTeam: string
  awayTeam: string
  homeGoals: number
  awayGoals: number
  hasNextMatch: boolean
  canFinishMatch: boolean
  playersByTeam: (teamName: string) => Player[]
  teamMarker: (teamName: string) => string
  displayPlayerLabel: (player: Player) => string
  isActivePlayer: (side: Side, playerId: number) => boolean
  selectPlayerForMark: (side: Side, playerId: number) => void
  playerStat: (side: Side, playerId: number) => PlayerMatchStats
  onSelectAction: (side: Side, playerId: number, event: Event) => void
  goToNextMatch: () => void
  resetMatchStats: () => void
  finishMatch: () => void
}>()

defineEmits<{
  'update:homeTeam': [value: string]
  'update:awayTeam': [value: string]
}>()

const uid = useId?.() ?? Math.random().toString(36).slice(2)
const mgmtToggleId = `match-mgmt-toggle-${uid}`
const mgmtPanelId  = `match-mgmt-panel-${uid}`

const isMgmtOpen = ref(false)

function handleMgmtAction(fn: () => void) {
  isMgmtOpen.value = false
  fn()
}
</script>