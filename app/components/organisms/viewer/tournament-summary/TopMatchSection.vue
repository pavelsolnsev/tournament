<template>
  <!-- Simple10: Матч с максимумом голов — счёт, бейджи статистики и раскрываемые детали. -->
  <div id="summary-top-match" class="scroll-mt-24 pt-5 pb-5 sm:px-6">
    <div
      class="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/90 transition-colors dark:border-slate-600/50 dark:bg-transparent"
    >
      <div class="flex w-full items-center justify-between gap-3 bg-slate-50/80 px-4 py-3.5 dark:bg-transparent">
        <span class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <span class="truncate">🔥 Топ-матч</span>
          <span class="flex shrink-0 flex-wrap items-center gap-1">
            <span
              v-if="totals.goals > 0"
              class="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-900 dark:text-emerald-300"
            >⚽ {{ totals.goals }}</span>
            <span
              v-if="totals.assists > 0"
              class="inline-flex items-center gap-0.5 rounded bg-sky-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-sky-900 dark:text-sky-300"
            >🎯 {{ totals.assists }}</span>
            <span
              v-if="totals.saves > 0"
              class="inline-flex items-center gap-0.5 rounded bg-violet-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-violet-900 dark:text-violet-300"
            >🧤 {{ totals.saves }}</span>
          </span>
        </span>
        <span
          class="shrink-0 rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600 tabular-nums dark:bg-slate-800/70 dark:text-slate-400"
        >
          М{{ match.matchNumber }}
        </span>
      </div>

      <div class="border-t border-slate-200 bg-slate-50/80 px-3 pb-3 pt-1 dark:border-slate-700/50 dark:bg-transparent">
        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-1 py-3 sm:px-2">
          <div class="flex min-w-0 items-center gap-2">
            <AtomsTeamMarkerOrLogo
              :team-name="match.homeTeam"
              :marker="homeTeamMarker"
              size="md"
            />
            <span class="min-w-0 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{{ match.homeTeam }}</span>
          </div>
          <div class="flex shrink-0 flex-col items-center gap-0.5">
            <span
              class="rounded-md px-3 py-1 font-mono text-base font-bold tabular-nums ring-1"
              :class="pillClass"
            >
              {{ match.homeGoals }}&nbsp;:&nbsp;{{ match.awayGoals }}
            </span>
          </div>
          <div class="flex min-w-0 items-center justify-end gap-2">
            <span class="min-w-0 truncate text-right text-sm font-semibold text-slate-700 dark:text-slate-200">{{ match.awayTeam }}</span>
            <AtomsTeamMarkerOrLogo
              :team-name="match.awayTeam"
              :marker="awayTeamMarker"
              size="md"
            />
          </div>
        </div>

        <details
          class="border-t border-slate-100 dark:border-slate-800/60"
          @toggle="onTopMatchDetailsToggle"
        >
          <summary
            class="flex cursor-pointer list-none items-center gap-2 rounded-xl py-2 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 [&::-webkit-details-marker]:hidden"
          >
            <span
              class="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium transition-colors"
              :class="
                topMatchDetailsOpen
                  ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                  : 'text-slate-600 md:hover:bg-slate-100 md:hover:text-slate-800 dark:md:hover:bg-slate-800 dark:md:hover:text-slate-300'
              "
            >
              <svg
                class="h-3.5 w-3.5 shrink-0"
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
              Детали
            </span>
          </summary>
          <OrganismsTournamentPlayedMatchesPlayedMatchDetails
            :match="match"
            :team-marker="teamMarkerForRow"
            :player-avatars-by-id="playerAvatarsById"
            embedded
            omit-top-border
          />
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlayedMatch } from '~/composables/tournament-standings/types'

const props = defineProps<{
  match: PlayedMatch
  pillClass: string
  totals: { goals: number; assists: number; saves: number }
  homeTeamMarker: string
  awayTeamMarker: string
  teamMarkerForRow: (teamName: string) => string
  playerAvatarsById: Record<number, { photo: string | null; name: string }>
}>()

const topMatchDetailsOpen = ref(false)

function onTopMatchDetailsToggle(ev: Event) {
  const el = ev.target
  if (el instanceof HTMLDetailsElement) topMatchDetailsOpen.value = el.open
}

watch(
  () => props.match.matchNumber,
  () => {
    topMatchDetailsOpen.value = false
  },
)
</script>
