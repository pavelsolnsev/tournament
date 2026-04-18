<template>
  <!-- Simple10: Список MVP турнира с аватаром и краткой статистикой. -->
  <div id="summary-mvp" class="scroll-mt-24 pt-5 pb-5 sm:px-6">
    <p class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">⭐ MVP турнира</p>

    <div
      v-for="player in mvp"
      :key="player.playerId"
      class="relative overflow-hidden rounded-2xl border border-amber-300/50 bg-slate-50 p-4
             dark:border-amber-500/25 dark:bg-slate-800/70"
    >
      <div class="pointer-events-none absolute -left-4 -top-4 h-32 w-32 rounded-full bg-amber-300/10 blur-3xl" aria-hidden="true" />

      <div class="relative flex items-center gap-3">
        <div class="relative shrink-0 h-9 w-9">
          <AtomsPlayerAvatar
            :photo="player.photo"
            :fallback-name="player.name"
            size="md"
            class="ring-2 ring-amber-400/50"
          />
          <span
            class="absolute -bottom-1 -right-1 flex h-[16px] w-[16px] items-center justify-center rounded-full bg-white dark:bg-slate-900 text-[9px] ring-1 ring-amber-500/40 leading-none"
            aria-hidden="true"
          >🏆</span>
        </div>

        <div class="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
          <div class="flex min-w-0 items-center gap-1.5">
            <p class="min-w-0 truncate text-[14px] font-bold leading-tight text-slate-800 dark:text-amber-200">{{ player.name }}</p>
            <div
              v-if="player.tournamentStats && mvpMarksTotal(player.tournamentStats) > 0"
              class="flex shrink-0 flex-wrap items-center gap-1"
            >
              <span
                v-if="player.tournamentStats.goals > 0"
                class="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-900 dark:text-emerald-300"
              >⚽ {{ player.tournamentStats.goals }}</span>
              <span
                v-if="player.tournamentStats.assists > 0"
                class="inline-flex items-center gap-0.5 rounded bg-sky-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-sky-900 dark:text-sky-300"
              >🎯 {{ player.tournamentStats.assists }}</span>
              <span
                v-if="player.tournamentStats.saves > 0"
                class="inline-flex items-center gap-0.5 rounded bg-violet-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-violet-900 dark:text-violet-300"
              >🧤 {{ player.tournamentStats.saves }}</span>
              <span
                v-if="player.tournamentStats.yellows > 0"
                class="inline-flex items-center gap-0.5 rounded bg-yellow-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-yellow-900 dark:text-yellow-300"
              >🟨 {{ player.tournamentStats.yellows }}</span>
            </div>
          </div>
          <p class="flex items-center gap-1 text-[11px] leading-none text-slate-600 dark:text-slate-400">
            <AtomsTeamMarkerOrLogo
              :team-name="player.teamName"
              :marker="player.teamMarker"
              size="xs"
            />
            <span class="truncate">{{ player.teamName }}</span>
          </p>
        </div>

        <span class="shrink-0 self-center rounded-md bg-amber-400/15 px-2 py-1 text-[11px] font-bold tracking-wider text-amber-800 ring-1 ring-amber-300/40 dark:text-amber-300 dark:ring-amber-500/25">
          MVP
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AwardWinner } from '~/composables/useTournamentSummary'
import { mvpMarksTotal } from '~/utils/tournamentSummaryPlurals'

defineProps<{
  mvp: AwardWinner[]
}>()
</script>
