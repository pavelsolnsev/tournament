<template>
  <!-- Simple10: Список сыгранных матчей в режиме только чтения. -->
  <div id="summary-results" class="scroll-mt-24 pt-5 pb-5 sm:px-6">
    <div
      class="overflow-hidden rounded-2xl border bg-slate-50/90 dark:bg-slate-900/60 transition-colors"
      :class="isResultsOpen ? 'border-slate-300 dark:border-slate-700/60' : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/50'"
    >
      <button
        :id="resultsToggleId"
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        :class="isResultsOpen ? 'bg-slate-50/80 dark:bg-slate-800/80' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'"
        :aria-expanded="isResultsOpen"
        :aria-controls="resultsPanelId"
        @click="isResultsOpen = !isResultsOpen"
      >
        <span class="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <span class="truncate">Результаты</span>
          <span
            class="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            :class="isResultsOpen ? 'bg-emerald-400/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'"
          >
            {{ isResultsOpen ? 'Открыт' : 'Скрыт' }}
          </span>
        </span>
        <div class="flex shrink-0 items-center gap-2">
          <span
            class="rounded-full bg-slate-100/90 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          >
            {{ playedMatchesList.length }}
          </span>
          <svg
            class="h-5 w-5 text-slate-400 transition-transform duration-200"
            :class="isResultsOpen && 'rotate-180'"
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
          v-if="isResultsOpen"
          :id="resultsPanelId"
          role="region"
          :aria-labelledby="resultsToggleId"
          class="w-full min-w-0 border-t border-slate-200 px-3 pb-3 pt-1 dark:border-slate-700/60 sm:px-4"
        >
          <OrganismsTournamentStepStandingsPlayedMatches
            :played-matches-list="playedMatchesList"
            :team-marker="teamMarkerForRow"
            :team-color-by-name="teamColorByName"
            :players-by-team="rosterPlayersByTeam"
            :display-player-label="displayPlayerLabelWithoutRating"
            :player-avatars-by-id="playerAvatarsById"
            :update-played-match="noopUpdatePlayedMatch"
            :delete-played-match="noopDeletePlayedMatch"
            :show-heading="false"
            :readonly="true"
          />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { PlayedMatch, PlayerMatchStats } from '~/composables/tournament-standings/types'
import { displayPlayerLabelWithoutRating } from '~/composables/usePlayerDisplay'
import { scrollExpandedPanelIntoView } from '~/utils/scrollExpandedPanelIntoView'

defineProps<{
  playedMatchesList: PlayedMatch[]
  teamMarkerForRow: (teamName: string) => string
  teamColorByName: Record<string, number>
  rosterPlayersByTeam: (teamName: string) => Player[]
  playerAvatarsById: Record<number, { photo: string | null; name: string }>
}>()

const resultsSectionUid = useId?.() ?? Math.random().toString(36).slice(2)
const resultsToggleId = `viewer-summary-results-${resultsSectionUid}`
const resultsPanelId = `viewer-summary-results-panel-${resultsSectionUid}`
const isResultsOpen = ref(false)

function noopUpdatePlayedMatch(
  _matchNumber: number,
  _homeGoals: number,
  _awayGoals: number,
  _homeStats: Record<number, PlayerMatchStats>,
  _awayStats: Record<number, PlayerMatchStats>,
) {}

function noopDeletePlayedMatch(_matchNumber: number) {}
</script>
