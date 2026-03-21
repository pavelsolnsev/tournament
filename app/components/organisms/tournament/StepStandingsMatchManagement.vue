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
          class="w-full rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none active:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          :disabled="!hasNextMatch || !homeTeam || !awayTeam"
          @click="handleGoToNextMatch"
        >
          Следующий матч
        </button>

        <!-- Обертка: визуально кнопка «Управление» и блок действий выглядят как одна раскрывающаяся панель. -->
        <div
          class="overflow-hidden rounded-xl sm:w-auto"
          :class="isManagementOpen
            && 'border border-slate-600/90 bg-slate-950/60 shadow-inner shadow-black/20'"
        >
          <button
            id="match-management-toggle"
            type="button"
            class="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-xs font-medium text-slate-100 focus:outline-none sm:w-auto sm:min-w-[11rem]"
            :class="isManagementOpen
              ? 'rounded-t-xl rounded-b-none bg-slate-600 active:bg-slate-700'
              : 'rounded-xl bg-slate-700 active:bg-slate-800'"
            :aria-expanded="isManagementOpen"
            aria-controls="match-management-actions"
            @click="isManagementOpen = !isManagementOpen"
          >
            <span class="flex min-w-0 flex-1 items-center gap-2">
              <!-- Три точки намекают, что под кнопкой спрятаны дополнительные действия. -->
              <span
                aria-hidden="true"
                class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-800/90 text-[10px] font-bold leading-none tracking-tight text-slate-400"
                :class="isManagementOpen && 'bg-slate-900/80 text-sky-300'"
              >
                •••
              </span>
              <span class="truncate">
                Управление
              </span>
            </span>
            <!-- Стрелка поворачивается: закрыто — вниз, открыто — вверх, как у типичного «раскрыть ещё кнопки». -->
            <span
              aria-hidden="true"
              class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-900/50 text-slate-300"
            >
              <svg
                class="h-4 w-4"
                :class="isManagementOpen && '-rotate-180'"
                viewBox="0 0 20 20"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
          </button>

          <div
            v-if="isManagementOpen"
            id="match-management-actions"
            role="region"
            aria-labelledby="match-management-toggle"
            class="flex flex-col gap-2 border-t border-slate-600/80 px-2 pb-2 pt-2"
          >
            <button
              type="button"
              class="w-full rounded-lg bg-slate-700 px-3 py-2 text-xs font-medium text-slate-100 focus:outline-none active:bg-slate-800 sm:w-auto"
              @click="handleResetMatch"
            >
              Сбросить матч
            </button>

            <button
              type="button"
              class="w-full rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none active:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              :disabled="!canFinishMatch"
              @click="handleFinishMatch"
            >
              Завершить матч
            </button>
          </div>
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

