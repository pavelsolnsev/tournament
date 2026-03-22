<!-- Компонент StepStandings: шаг, который собирает герой + список матчей + управление матчем. -->
<template>
  <div class="min-w-0 space-y-4">
    <div class="overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/50">
      <button
        :id="standingsToggleId"
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        :class="isStandingsBlockOpen
          ? 'bg-slate-800/80'
          : 'bg-slate-900/70 hover:bg-slate-800/60'"
        :aria-expanded="isStandingsBlockOpen"
        :aria-controls="standingsPanelId"
        @click="isStandingsBlockOpen = !isStandingsBlockOpen"
      >
        <div class="min-w-0 flex-1">
          <span class="block text-sm font-semibold text-slate-100">
            Турнирная таблица и составы
          </span>
          <span
            v-if="tournamentName || tournamentDate"
            class="mt-0.5 block truncate text-xs text-slate-500"
          >
            <span v-if="tournamentName">{{ tournamentName }}</span>
            <span v-if="tournamentName && tournamentDate"> · </span>
            <span v-if="tournamentDate">{{ tournamentDate }}</span>
          </span>
        </div>
        <svg
          class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200"
          :class="isStandingsBlockOpen && 'rotate-180'"
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
        enter-to-class="max-h-[120rem] opacity-100"
        leave-active-class="transition-all duration-150 ease-in overflow-hidden"
        leave-from-class="max-h-[120rem] opacity-100"
        leave-to-class="max-h-0 opacity-0"
      >
        <div
          v-if="isStandingsBlockOpen"
          :id="standingsPanelId"
          role="region"
          :aria-labelledby="standingsToggleId"
          class="space-y-4 border-t border-slate-800/60 px-4 pb-4 pt-4"
        >
          <OrganismsTournamentStepStandingsHero
            :tournament-name="tournamentName"
            :tournament-date="tournamentDate"
            :teams="teams"
            :standings-rows="standingsRows"
            :effective-team-colors="effectiveTeamColors"
            :show-heading="false"
          />

          <OrganismsTournamentStepStandingsTeamRosterTotals
            :teams="teams"
            :players-by-team="playersByTeam"
            :team-marker="teamMarker"
            :display-player-label="displayPlayerLabel"
            :aggregate-player-stats="aggregatePlayerStats"
          />
        </div>
      </Transition>
    </div>

    <section class="min-w-0 space-y-4 overflow-x-hidden rounded-2xl bg-slate-900/70">
      <OrganismsTournamentStepStandingsPlayedMatches
        :played-matches-list="playedMatchesList"
        :team-marker="teamMarker"
      />

      <OrganismsTournamentStepStandingsMatchManagement
        :teams="teams"
        :home-team="homeTeam"
        :away-team="awayTeam"
        :home-goals="homeGoals"
        :away-goals="awayGoals"
        :has-next-match="hasNextMatch"
        :can-finish-match="canFinishMatch"
        :players-by-team="playersByTeam"
        :team-marker="teamMarker"
        :display-player-label="displayPlayerLabel"
        :is-active-player="isActivePlayer"
        :select-player-for-mark="selectPlayerForMark"
        :player-stat="playerStat"
        :on-select-action="onSelectAction"
        :go-to-next-match="goToNextMatch"
        :reset-match-stats="resetMatchStats"
        :finish-match="finishMatch"
        @update:home-team="handleUpdateHomeTeam"
        @update:away-team="handleUpdateAwayTeam"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import { useTournamentStandingsRefactored } from '~/composables/useTournamentStandingsRefactored'

// Этот шаг показывает матчи и турнирную таблицу.
const props = defineProps<{
  tournamentName: string
  tournamentDate: string
  teams: string[]
  teamColors: Record<string, number>
  players: Player[]
  assignmentByPlayerId: Record<number, string>
}>()

const {
  effectiveTeamColors,
  teamMarker,
  standingsRows,
  playedMatchesList,
  hasNextMatch,
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
  canFinishMatch,
  playersByTeam,
  selectPlayerForMark,
  isActivePlayer,
  playerStat,
  onSelectAction,
  resetMatchStats,
  finishMatch,
  goToNextMatch,
  displayPlayerLabel,
  aggregatePlayerStats,
} = useTournamentStandingsRefactored({
  teams: props.teams,
  teamColors: props.teamColors,
  players: props.players,
  assignmentByPlayerId: props.assignmentByPlayerId,
})
// Здесь подключаем логику турнира и достаём нужные refs/функции для UI.

const standingsUid = useId?.() ?? Math.random().toString(36).slice(2)
const standingsToggleId = `standings-block-toggle-${standingsUid}`
const standingsPanelId = `standings-block-panel-${standingsUid}`

// Таблица и составы скрыты по умолчанию — открываются кнопкой, когда нужно посмотреть.
const isStandingsBlockOpen = ref(false)

function handleUpdateHomeTeam(next: string) {
  homeTeam.value = next
}
// Это обновляет домашнюю команду, когда пользователь меняет select в дочернем UI.

function handleUpdateAwayTeam(next: string) {
  awayTeam.value = next
}
// Это обновляет гостевую команду, когда пользователь меняет select в дочернем UI.
</script>

