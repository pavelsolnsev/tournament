<template>
  <!-- Simple10: Список игроков с жёлтыми карточками и визуализацией количества. -->
  <div id="summary-yellows" class="scroll-mt-24 px-4 pb-5 sm:px-6">
    <p class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">🟨 Жёлтые карточки</p>

    <div class="flex flex-col gap-1.5">
      <div
        v-for="player in yellowCards"
        :key="player.playerId"
        class="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5
               dark:border-yellow-500/15 dark:bg-yellow-500/5"
      >
        <AtomsPlayerAvatar
          :photo="player.photo"
          :fallback-name="player.name"
          size="sm"
          class="shrink-0"
        />

        <div class="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
          <p class="truncate text-[13px] font-semibold leading-tight text-slate-800 dark:text-slate-200">{{ player.name }}</p>
          <p class="flex items-center gap-1 text-[11px] leading-none text-slate-600 dark:text-slate-500">
            <AtomsTeamMarkerOrLogo
              :team-name="player.teamName"
              :marker="player.teamMarker"
              size="xs"
            />
            <span class="truncate">{{ player.teamName }}</span>
          </p>
        </div>

        <div class="shrink-0 flex items-center gap-1">
          <span
            v-for="n in player.count"
            :key="n"
            class="inline-block h-4 w-3 rounded-sm bg-yellow-400 ring-1 ring-yellow-500/50"
            aria-hidden="true"
          />
          <span class="ml-1 text-[12px] font-bold tabular-nums text-amber-800 dark:text-yellow-300">{{ player.count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { YellowCardPlayer } from '~/composables/useTournamentSummary'

defineProps<{
  yellowCards: YellowCardPlayer[]
}>()
</script>
