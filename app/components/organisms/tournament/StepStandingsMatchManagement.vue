<!-- Компонент StepStandingsMatchManagement: управление текущим матчем (выбор команд, счёт, события). -->
<template>
  <div class="flex flex-col gap-5">
    <h3 class="flex items-center gap-2 text-lg font-semibold text-slate-100">
      <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-300">
        ⚽
      </span>
      Управление матчами
    </h3>

    <!-- Выбор команд -->
    <OrganismsTournamentStepStandingsTeamPickers
      :teams="teams"
      :home-team="homeTeam"
      :away-team="awayTeam"
      @update:home-team="$emit('update:homeTeam', $event)"
      @update:away-team="$emit('update:awayTeam', $event)"
    />

    <!-- Информация о матче -->
    <div
      v-if="homeTeam && awayTeam"
      class="rounded-2xl bg-slate-950/70 p-2 sm:p-3"
    >
      <div class="mb-3 flex items-center justify-between gap-3">
        <div class="flex-1 min-w-0 text-left">
          <p class="flex items-center gap-2 truncate text-sm font-semibold text-slate-100">
            <span aria-hidden="true" class="shrink-0 text-base">
              {{ teamMarker(homeTeam) }}
            </span>
            <span class="truncate">
              {{ homeTeam }}
            </span>
          </p>
        </div>

        <div class="shrink-0 text-center">
          <p class="text-xs text-slate-400">
            Счёт
          </p>
          <p class="text-xl font-semibold text-slate-50">
            {{ homeGoals }} : {{ awayGoals }}
          </p>
        </div>

        <div class="flex-1 min-w-0 text-right">
          <p class="flex items-center justify-end gap-2 truncate text-sm font-semibold text-slate-100">
            <span class="truncate">
              {{ awayTeam }}
            </span>
            <span aria-hidden="true" class="shrink-0 text-base">
              {{ teamMarker(awayTeam) }}
            </span>
          </p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <OrganismsTournamentStepStandingsTeamRosterColumn
          side="home"
          :team-name="homeTeam"
          :players="playersByTeam(homeTeam)"
          active-shadow-class="shadow-inner shadow-emerald-500/30"
          select-focus-class="focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/70"
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
          active-shadow-class="shadow-inner shadow-sky-500/30"
          select-focus-class="focus:border-sky-500 focus:ring-1 focus:ring-sky-500/70"
          :team-marker="teamMarker"
          :display-player-label="displayPlayerLabel"
          :is-active-player="isActivePlayer"
          :select-player-for-mark="selectPlayerForMark"
          :player-stat="playerStat"
          :on-select-action="onSelectAction"
        />
      </div>

      <div class="mt-3 flex flex-col gap-2">
        <button
          type="button"
          class="w-full rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-sky-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
          :disabled="!hasNextMatch || !homeTeam || !awayTeam"
          @click="handleGoToNextMatch"
        >
          Следующий матч
        </button>

        <button
          type="button"
          class="w-full rounded-lg bg-slate-700 px-3 py-2 text-xs font-medium text-slate-100 transition hover:bg-slate-600 focus:outline-none sm:w-auto"
          @click="isManagementOpen = !isManagementOpen"
        >
          Управление
        </button>

        <div
          v-if="isManagementOpen"
          class="flex flex-col gap-2"
        >
          <button
            type="button"
            class="w-full rounded-lg bg-slate-700 px-3 py-2 text-xs font-medium text-slate-100 transition hover:bg-slate-600 focus:outline-none sm:w-auto"
            @click="handleResetMatch"
          >
            Сбросить матч
          </button>

          <button
            type="button"
            class="w-full rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-emerald-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
            :disabled="!canFinishMatch"
            @click="handleFinishMatch"
          >
            Завершить матч
          </button>
        </div>

        <p
          v-if="!hasNextMatch"
          class="mt-1 text-[11px] text-slate-500"
        >
          Все пары команд уже сыграли между собой.
        </p>
      </div>
    </div>
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
// Это счётчики событий игрока в текущем матче.

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
// Эти пропы приходят из родителя, где живёт composable состояния матча.

// Эти события нужны, чтобы родитель мог обновить ref'ы выбранных команд из composable.
defineEmits<{
  'update:homeTeam': [value: string]
  'update:awayTeam': [value: string]
}>()

// Храним состояние раскрытия блока управления матчами внутри компонента.
const isManagementOpen = ref(false)

function handleGoToNextMatch() {
  isManagementOpen.value = false
  props.goToNextMatch()
}
// Это закрывает "Управление" и переключает матч дальше по логике composable.

function handleResetMatch() {
  isManagementOpen.value = false
  props.resetMatchStats()
}
// Это закрывает "Управление" и очищает статистику текущего матча.

function handleFinishMatch() {
  isManagementOpen.value = false
  props.finishMatch()
}
// Это закрывает "Управление" и фиксирует матч (как завершённый).
</script>

