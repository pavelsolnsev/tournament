<!-- Компонент StepStandings: таблица, составы со статистикой, сыгранные матчи и управление матчем — отдельными блоками. -->
<template>
  <div
    class="min-w-0 space-y-4"
    :class="props.readonly !== true && !hideCountdownTimerBar && 'pb-24'"
  >
    <!-- Блок 1: турнирная таблица -->
    <div
      class="overflow-hidden rounded-2xl border bg-slate-50 dark:bg-slate-900/60 transition-colors"
      :class="isStandingsBlockOpen ? 'border-slate-300 dark:border-slate-700/60' : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/50'"
    >
      <button
        :id="standingsToggleId"
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        :class="isStandingsBlockOpen ? 'bg-slate-50 dark:bg-slate-800/80' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'"
        :aria-expanded="isStandingsBlockOpen"
        :aria-controls="standingsPanelId"
        @click="isStandingsBlockOpen = !isStandingsBlockOpen"
      >
        <div class="min-w-0 flex-1">
          <span class="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Таблица
            <span
              class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              :class="isStandingsBlockOpen ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'"
            >
              {{ isStandingsBlockOpen ? 'Открыт' : 'Скрыт' }}
            </span>
          </span>
          <span
            v-if="tournamentName"
            class="mt-0.5 block truncate text-xs text-slate-600 dark:text-slate-500"
          >
            {{ tournamentName }}
          </span>
        </div>
        <svg
          class="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-400 transition-transform duration-200"
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
        @after-enter="scrollExpandedPanelIntoView"
      >
        <div
          v-if="isStandingsBlockOpen"
          :id="standingsPanelId"
          role="region"
          :aria-labelledby="standingsToggleId"
          class="pt-1"
        >
          <AtomsEmptyStateBox v-if="teams.length === 0" align="center" size="sm" root-class="mx-4 mb-4">
            Пока нет команд — добавьте и подтвердите их, чтобы появилась таблица.
          </AtomsEmptyStateBox>
          <AtomsEmptyStateBox v-else-if="standingsRows.length === 0" align="center" size="sm" root-class="mx-4 mb-4">
            Таблица пока пустая — сыграйте хотя бы один матч.
          </AtomsEmptyStateBox>
          <OrganismsTournamentStepStandingsHero
            v-else
            :tournament-name="tournamentName"
            :teams="teams"
            :standings-rows="standingsRows"
            :effective-team-colors="effectiveTeamColors"
            :show-heading="false"
          />
        </div>
      </Transition>
    </div>

    <!-- Блок 2: составы и накопленная статистика игроков -->
    <div
      class="overflow-hidden rounded-2xl border bg-slate-50 dark:bg-slate-900/60 transition-colors"
      :class="isRosterTotalsOpen ? 'border-slate-300 dark:border-slate-700/60' : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/50'"
    >
      <button
        :id="rosterTotalsToggleId"
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        :class="isRosterTotalsOpen ? 'bg-slate-50 dark:bg-slate-800/80' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'"
        :aria-expanded="isRosterTotalsOpen"
        :aria-controls="rosterTotalsPanelId"
        @click="isRosterTotalsOpen = !isRosterTotalsOpen"
      >
        <span class="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          Составы
          <span
            class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            :class="isRosterTotalsOpen ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'"
          >
            {{ isRosterTotalsOpen ? 'Открыт' : 'Скрыт' }}
          </span>
        </span>
        <svg
          class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200"
          :class="isRosterTotalsOpen && 'rotate-180'"
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
        @after-enter="scrollExpandedPanelIntoView"
      >
        <div
          v-if="isRosterTotalsOpen"
          :id="rosterTotalsPanelId"
          role="region"
          :aria-labelledby="rosterTotalsToggleId"
          class="w-full min-w-0 border-t border-slate-200 px-3 pb-4 pt-3 dark:border-slate-700/60 sm:px-4"
        >
          <AtomsEmptyStateBox v-if="teams.length === 0" align="center" size="sm" root-class="mx-4 mb-4">
            Пока нет команд — составы появятся после подтверждения команд.
          </AtomsEmptyStateBox>
          <OrganismsTournamentStepStandingsTeamRosterTotals
            v-else
            :teams="teams"
            :players-by-team="playersByTeam"
            :team-marker="teamMarker"
            :display-player-label="displayPlayerLabel"
            :aggregate-player-stats="aggregatePlayerStats"
            :player-rating-deltas="playerRatingDeltas"
            :hide-base-player-rating="hideBasePlayerRating"
            :show-heading="false"
          />
        </div>
      </Transition>
    </div>

    <!-- Блок 3: результаты матчей + управление текущим матчем -->
    <section class="min-w-0 space-y-4">
      <div
        class="overflow-hidden rounded-2xl border bg-slate-50 dark:bg-slate-900/60 transition-colors"
        :class="isPlayedMatchesOpen ? 'border-slate-300 dark:border-slate-700/60' : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/50'"
      >
        <button
          :id="playedMatchesToggleId"
          type="button"
          class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          :class="isPlayedMatchesOpen ? 'bg-slate-50 dark:bg-slate-800/80' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'"
          :aria-expanded="isPlayedMatchesOpen"
          :aria-controls="playedMatchesPanelId"
          @click="isPlayedMatchesOpen = !isPlayedMatchesOpen"
        >
          <span class="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Результаты
            <span
              class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              :class="isPlayedMatchesOpen ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'"
            >
              {{ isPlayedMatchesOpen ? 'Открыт' : 'Скрыт' }}
            </span>
          </span>
          <div class="flex shrink-0 items-center gap-2">
            <span
              v-if="playedMatchesList.length > 0"
              class="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-400"
            >
              {{ playedMatchesList.length }}
            </span>
            <svg
              class="h-5 w-5 text-slate-400 transition-transform duration-200"
              :class="isPlayedMatchesOpen && 'rotate-180'"
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
          </div>
        </button>

        <Transition
          enter-active-class="transition-all duration-200 ease-out overflow-hidden"
          enter-from-class="max-h-0 opacity-0"
          enter-to-class="max-h-[120rem] opacity-100"
          leave-active-class="transition-all duration-150 ease-in overflow-hidden"
          leave-from-class="max-h-[120rem] opacity-100"
          leave-to-class="max-h-0 opacity-0"
          @after-enter="scrollExpandedPanelIntoView"
        >
          <div
            v-if="isPlayedMatchesOpen"
            :id="playedMatchesPanelId"
            role="region"
            :aria-labelledby="playedMatchesToggleId"
            class="w-full min-w-0 border-t border-slate-200 px-3 pb-3 pt-1 dark:border-slate-700/60 sm:px-4"
          >
            <!-- В деталях и редакторе матча рейтинг не нужен — передаём версию без него. -->
            <OrganismsTournamentStepStandingsPlayedMatches
              :played-matches-list="playedMatchesList"
              :team-marker="teamMarker"
              :team-color-by-name="effectiveTeamColors"
              :players-by-team="playersByTeam"
              :display-player-label="displayPlayerLabelWithoutRating"
              :player-avatars-by-id="playerAvatarsById"
              :update-played-match="updatePlayedMatch"
              :delete-played-match="deletePlayedMatch"
              :show-heading="false"
              :readonly="props.readonly === true"
            />
          </div>
        </Transition>
      </div>

      <OrganismsTournamentStepStandingsMatchManagement
        v-if="props.readonly !== true"
        :teams="teams"
        :home-team="homeTeam"
        :away-team="awayTeam"
        :home-goals="homeGoals"
        :away-goals="awayGoals"
        :has-next-match="hasNextMatch"
        :can-finish-match="canFinishMatch"
        :has-played-matches="playedMatchesList.length > 0"
        :players-by-team="playersByTeam"
        :team-marker="teamMarker"
        :effective-team-colors="effectiveTeamColors"
        :display-player-label="displayPlayerLabel"
        :is-active-player="isActivePlayer"
        :select-player-for-mark="selectPlayerForMark"
        :player-stat="playerStat"
        :on-select-action="onSelectAction"
        :add-player-event="addPlayerEvent"
        :remove-player-event="removePlayerEvent"
        :go-to-next-match="handleGoToNextMatch"
        :reset-match-stats="resetMatchStats"
        :reset-tournament-marks="handleResetTournamentMarks"
        :finish-match="handleFinishMatchShowResults"
        :finish-match-silent="handleFinishMatchSilent"
        :finish-tournament-status="finishStatus"
        :finish-tournament-error="finishErrorMessage"
        :on-finish-tournament="handleFinishTournament"
        :show-clear-tournament-confirm="props.showClearTournamentConfirm"
        :clear-tournament-seconds-left="props.clearTournamentSecondsLeft"
        :clear-tournament-busy="props.clearTournamentBusy"
        @update:home-team="handleUpdateHomeTeam"
        @update:away-team="handleUpdateAwayTeam"
        @clear-tournament="emit('clear-tournament')"
        @cancel-clear-tournament="emit('cancel-clear-tournament')"
        @confirm-clear-tournament="emit('confirm-clear-tournament')"
      />

    </section>

    <!-- Таймер матча только при ведении турнира (не в режиме зрителя). -->
    <MoleculesMatchCountdownTimerBar v-if="props.readonly !== true && !hideCountdownTimerBar" />
  </div>
</template>

<script setup lang="ts">
import type { Player, MatchStatus } from '~/types/tournament'
import type { SavedStandingsSnapshot } from '~/composables/useTournamentWizard'
import { useStepStandingsPage, type StepStandingsPageEmit } from '~/composables/useStepStandingsPage'

const props = defineProps<{
  tournamentName: string
  tournamentDate: string
  venueLabel?: string
  formatLabel?: string
  teams: string[]
  teamColors: Record<string, number>
  players: Player[]
  assignmentByPlayerId: Record<number, string>
  initialSnapshot?: SavedStandingsSnapshot | null
  readonly?: boolean
  showClearTournamentConfirm: boolean
  clearTournamentSecondsLeft: number
  clearTournamentBusy: boolean
  fetchRemoteStandingsSnapshot?: () => Promise<SavedStandingsSnapshot | null>
}>()

const emit = defineEmits<{
  'update:snapshot': [snapshot: SavedStandingsSnapshot]
  'tournament-finished': []
  'update:matchStatus': [status: MatchStatus, homeTeam: string, awayTeam: string]
  'clear-tournament': []
  'cancel-clear-tournament': []
  'confirm-clear-tournament': []
}>()

const {
  hideCountdownTimerBar,
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
  addPlayerEvent,
  removePlayerEvent,
  updatePlayedMatch,
  deletePlayedMatch,
  resetMatchStats,
  displayPlayerLabel,
  displayPlayerLabelWithoutRating,
  aggregatePlayerStats,
  playerRatingDeltas,
  playerAvatarsById,
  hideBasePlayerRating,
  standingsToggleId,
  standingsPanelId,
  rosterTotalsToggleId,
  rosterTotalsPanelId,
  playedMatchesToggleId,
  playedMatchesPanelId,
  isStandingsBlockOpen,
  isRosterTotalsOpen,
  isPlayedMatchesOpen,
  finishStatus,
  finishErrorMessage,
  handleUpdateHomeTeam,
  handleUpdateAwayTeam,
  handleFinishMatchShowResults,
  handleFinishMatchSilent,
  handleResetTournamentMarks,
  handleGoToNextMatch,
  handleFinishTournament,
  scrollExpandedPanelIntoView,
} = useStepStandingsPage(props, emit as StepStandingsPageEmit)
</script>

