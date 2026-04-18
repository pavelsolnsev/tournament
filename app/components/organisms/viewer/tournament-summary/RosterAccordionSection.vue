<template>
  <!-- Simple10: Составы в аккордеоне — те же тоталы, что на шаге турнира. -->
  <div id="summary-rosters" class="scroll-mt-24 pt-5 pb-5 sm:px-6">
    <div
      class="w-full min-w-0 overflow-hidden rounded-2xl border bg-slate-50/90 dark:bg-slate-900/60 transition-colors"
      :class="isRosterOpen ? 'border-slate-300 dark:border-slate-700/60' : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/50'"
    >
      <button
        :id="rosterToggleId"
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        :class="isRosterOpen ? 'bg-slate-50/80 dark:bg-slate-800/80' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'"
        :aria-expanded="isRosterOpen"
        :aria-controls="rosterPanelId"
        @click="isRosterOpen = !isRosterOpen"
      >
        <span class="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <span class="truncate">👥 Составы</span>
          <span
            class="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            :class="isRosterOpen ? 'bg-emerald-400/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'"
          >
            {{ isRosterOpen ? 'Открыт' : 'Скрыт' }}
          </span>
        </span>
        <div class="flex shrink-0 items-center gap-2">
          <span
            class="rounded-full bg-slate-100/90 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          >
            {{ rosterTeams.length }}
          </span>
          <svg
            class="h-5 w-5 text-slate-400 transition-transform duration-200"
            :class="isRosterOpen && 'rotate-180'"
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
          v-if="isRosterOpen"
          :id="rosterPanelId"
          role="region"
          :aria-labelledby="rosterToggleId"
          class="w-full min-w-0 border-t border-slate-200 px-3 pb-4 pt-3 dark:border-slate-700/60 sm:px-4"
        >
          <OrganismsTournamentStepStandingsTeamRosterTotals
            :teams="rosterTeams"
            :players-by-team="rosterPlayersByTeam"
            :team-marker="teamMarkerForRow"
            :display-player-label="displayPlayerLabelWithoutRating"
            :aggregate-player-stats="aggregatePlayerStats ?? {}"
            :player-rating-deltas="playerRatingDeltas ?? {}"
            :hide-base-player-rating="hideBasePlayerRating"
            :show-heading="false"
          />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { PlayerMatchStats } from '~/composables/tournament-standings/types'
import { displayPlayerLabelWithoutRating } from '~/composables/usePlayerDisplay'
import { scrollExpandedPanelIntoView } from '~/utils/scrollExpandedPanelIntoView'

defineProps<{
  rosterTeams: string[]
  rosterPlayersByTeam: (teamName: string) => Player[]
  teamMarkerForRow: (teamName: string) => string
  aggregatePlayerStats?: Record<number, PlayerMatchStats>
  playerRatingDeltas?: Record<number, number>
  hideBasePlayerRating: boolean
}>()

const rosterSectionUid = useId?.() ?? Math.random().toString(36).slice(2)
const rosterToggleId = `viewer-summary-roster-${rosterSectionUid}`
const rosterPanelId = `viewer-summary-roster-panel-${rosterSectionUid}`
const isRosterOpen = ref(false)
</script>
