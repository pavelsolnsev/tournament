<!-- StepStandingsMatchManagement.vue -->
<template>
  <div class="flex flex-col gap-4">

    <h3 class="text-xs font-medium uppercase tracking-widest text-slate-400">
      ⚽ Управление матчем
    </h3>

    <!-- Выбор команд (дом/гость) — можно скрывать и открывать -->
    <div>
      <button
        :id="teamPickersToggleId"
        type="button"
        class="flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left
               transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        :class="isTeamPickersOpen ? 'bg-slate-800/80' : 'bg-transparent'"
        :aria-expanded="isTeamPickersOpen"
        :aria-controls="teamPickersPanelId"
        @click="isTeamPickersOpen = !isTeamPickersOpen"
      >
        <span class="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-100">
          Команды (дом/гость)
          <span
            class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            :class="isTeamPickersOpen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800/80 text-slate-500'"
          >
            {{ isTeamPickersOpen ? 'Открыт' : 'Скрыт' }}
          </span>
        </span>
        <svg
          class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200"
          :class="isTeamPickersOpen && 'rotate-180'"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <Transition
        enter-active-class="transition-all duration-200 ease-out overflow-hidden"
        enter-from-class="max-h-0 opacity-0"
        enter-to-class="max-h-40 opacity-100"
        leave-active-class="transition-all duration-150 ease-in overflow-hidden"
        leave-from-class="max-h-40 opacity-100"
        leave-to-class="max-h-0 opacity-0"
      >
        <div
          v-if="isTeamPickersOpen"
          :id="teamPickersPanelId"
          role="region"
          :aria-labelledby="teamPickersToggleId"
          class="pt-3"
        >
          <OrganismsTournamentStepStandingsTeamPickers
            :teams="teams"
            :home-team="homeTeam"
            :away-team="awayTeam"
            @update:home-team="$emit('update:homeTeam', $event)"
            @update:away-team="$emit('update:awayTeam', $event)"
          />
        </div>
      </Transition>
    </div>

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

      <!-- Составы: на мобайле — друг под другом, на широком — рядом -->
      <div class="flex flex-col divide-y divide-slate-700/60 sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <OrganismsTournamentStepStandingsTeamRosterColumn
          side="home"
          :team-name="homeTeam"
          :players="playersByTeam(homeTeam)"
          active-shadow-class="bg-sky-500/10 border-sky-500/40"
          :team-color-index="effectiveTeamColors[homeTeam] ?? 0"
          :team-marker="teamMarker"
          :display-player-label="displayPlayerLabelWithoutRating"
          :is-active-player="isActivePlayer"
          :select-player-for-mark="selectPlayerForMark"
          :player-stat="playerStat"
          :add-player-event="addPlayerEvent"
          :remove-player-event="removePlayerEvent"
        />
        <OrganismsTournamentStepStandingsTeamRosterColumn
          side="away"
          :team-name="awayTeam"
          :players="playersByTeam(awayTeam)"
          active-shadow-class="bg-emerald-500/10 border-emerald-500/40"
          :team-color-index="effectiveTeamColors[awayTeam] ?? 0"
          :team-marker="teamMarker"
          :display-player-label="displayPlayerLabelWithoutRating"
          :is-active-player="isActivePlayer"
          :select-player-for-mark="selectPlayerForMark"
          :player-stat="playerStat"
          :add-player-event="addPlayerEvent"
          :remove-player-event="removePlayerEvent"
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
            : 'bg-transparent'"
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
          <span
            class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            :class="isMgmtOpen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800/80 text-slate-500'"
          >
            {{ isMgmtOpen ? 'Открыт' : 'Скрыт' }}
          </span>
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
                   text-slate-200 transition-colors md:hover:bg-slate-600 active:bg-slate-800"
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
import type { StatKey } from '~/composables/tournament-standings/types'
import { clipLongPlayerLabel } from '~/composables/usePlayerDisplay'

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
  effectiveTeamColors: Record<string, number>
  displayPlayerLabel: (player: Player) => string
  isActivePlayer: (side: Side, playerId: number) => boolean
  selectPlayerForMark: (side: Side, playerId: number) => void
  playerStat: (side: Side, playerId: number) => PlayerMatchStats
  onSelectAction: (side: Side, playerId: number, event: Event) => void
  addPlayerEvent: (side: Side, playerId: number, key: StatKey) => void
  removePlayerEvent: (side: Side, playerId: number, key: StatKey) => void
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

// Управляем видимостью select'ов (дом/гость) внутри блока управления матчем.
const teamPickersToggleId = `match-team-pickers-toggle-${uid}`
const teamPickersPanelId = `match-team-pickers-panel-${uid}`
const isTeamPickersOpen = ref(true)

function displayPlayerLabelWithoutRating(player: Player): string {
  // Берём ник без @, чтобы в управлении матчем был аккуратный короткий текст.
  const cleanedUsername = player.username?.replace(/^@+/, '').trim()
  // Если ника нет или он "unknown", показываем имя игрока.
  const baseLabel = !cleanedUsername || cleanedUsername.toLowerCase() === 'unknown'
    ? (player.name || '').trim()
    : cleanedUsername
  // Обрезаем только текст ника/имени, без добавления рейтинга в этом блоке.
  return clipLongPlayerLabel(baseLabel)
}

function handleMgmtAction(fn: () => void) {
  isMgmtOpen.value = false
  fn()
}
</script>