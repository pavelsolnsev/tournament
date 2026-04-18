<template>
  <!-- Simple10: Лучший игрок в каждой команде по итогам турнира. -->
  <div id="summary-team-mvps" class="scroll-mt-24 pt-5 pb-5 sm:px-6">
    <p class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">👑 MVP команд</p>

    <div class="flex flex-col gap-2 sm:grid sm:grid-cols-2">
      <div
        v-for="teamMvp in teamMvps"
        :key="teamMvp.teamName"
        class="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700/60 dark:bg-slate-800/50"
      >
        <div class="relative shrink-0">
          <AtomsPlayerAvatar
            :photo="teamMvp.players[0]?.photo"
            :fallback-name="teamMvp.players[0]?.name ?? teamMvp.teamName"
            size="md"
          />
          <div
            class="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-slate-300 dark:bg-slate-900 dark:ring-slate-700/60"
            aria-hidden="true"
          >
            <AtomsTeamMarkerOrLogo
              :team-name="teamMvp.teamName"
              :marker="teamMvp.teamMarker"
              size="xs"
            />
          </div>
        </div>

        <div class="min-w-0 flex-1">
          <p class="text-[10px] font-semibold uppercase tracking-widest text-slate-600 leading-none dark:text-slate-400">{{ teamMvp.teamName }}</p>
          <p v-if="teamMvp.players.length > 0" class="mt-1 truncate text-[13px] font-semibold text-slate-800 leading-tight dark:text-slate-100">
            {{ teamMvp.players[0]!.name }}
          </p>
          <p v-else class="mt-1 text-[13px] text-slate-600 dark:text-slate-500">—</p>
        </div>

        <div v-if="teamMvp.players.length > 0" class="flex shrink-0 items-center gap-1">
          <span
            v-if="teamMvp.goals > 0"
            class="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-900 dark:text-emerald-300"
          >⚽ {{ teamMvp.goals }}</span>
          <span
            v-if="teamMvp.assists > 0"
            class="inline-flex items-center gap-0.5 rounded bg-sky-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-sky-900 dark:text-sky-300"
          >🎯 {{ teamMvp.assists }}</span>
          <span
            v-if="teamMvp.saves > 0"
            class="inline-flex items-center gap-0.5 rounded bg-violet-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-violet-900 dark:text-violet-300"
          >🧤 {{ teamMvp.saves }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TeamMvp } from '~/composables/useTournamentSummary'

defineProps<{
  teamMvps: TeamMvp[]
}>()
</script>
