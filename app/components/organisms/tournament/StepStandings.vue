<!-- Компонент StepStandings: шаг, который собирает герой + список матчей + управление матчем. -->
<template>
  <div class="space-y-4">
    <OrganismsTournamentStepStandingsHero
      :tournament-name="tournamentName"
      :tournament-date="tournamentDate"
      :teams="teams"
      :standings-rows="standingsRows"
      :effective-team-colors="effectiveTeamColors"
    />

    <section class="rounded-2xl bg-slate-900/70 space-y-4">
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
} = useTournamentStandingsRefactored({
  teams: props.teams,
  teamColors: props.teamColors,
  players: props.players,
  assignmentByPlayerId: props.assignmentByPlayerId,
})
// Здесь подключаем логику турнира и достаём нужные refs/функции для UI.

function handleUpdateHomeTeam(next: string) {
  homeTeam.value = next
}
// Это обновляет домашнюю команду, когда пользователь меняет select в дочернем UI.

function handleUpdateAwayTeam(next: string) {
  awayTeam.value = next
}
// Это обновляет гостевую команду, когда пользователь меняет select в дочернем UI.
</script>

