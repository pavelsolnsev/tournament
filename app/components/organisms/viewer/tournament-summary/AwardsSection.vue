<template>
  <!-- Simple10: Три карточки наград или заглушки, если статистики не было. -->
  <div id="summary-awards" class="scroll-mt-24 pt-5 pb-5 sm:px-6">
    <p class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">🎖️ Индивидуальные награды</p>

    <div class="flex flex-col gap-2 sm:grid sm:grid-cols-3">
      <AtomsAwardCard
        v-if="topScorers.length > 0"
        icon="⚽"
        label="Бомбардир"
        :value-label="pluralGoals(topScorers[0]!.value)"
        color="emerald"
        :winners="topScorers"
      />
      <MoleculesViewerTournamentSummaryEmptyAward v-else icon="⚽" text="Голов не забито" />

      <AtomsAwardCard
        v-if="topAssisters.length > 0"
        icon="🎯"
        label="Ассистент"
        :value-label="pluralAssists(topAssisters[0]!.value)"
        color="sky"
        :winners="topAssisters"
      />
      <MoleculesViewerTournamentSummaryEmptyAward v-else icon="🎯" text="Передач не было" />

      <AtomsAwardCard
        v-if="topGoalkeepers.length > 0"
        icon="🧤"
        label="Вратарь"
        :value-label="pluralSaves(topGoalkeepers[0]!.value)"
        color="violet"
        :winners="topGoalkeepers"
      />
      <MoleculesViewerTournamentSummaryEmptyAward v-else icon="🧤" text="Сейвов не было" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AwardWinner } from '~/composables/useTournamentSummary'
import { pluralAssists, pluralGoals, pluralSaves } from '~/utils/tournamentSummaryPlurals'

defineProps<{
  topScorers: AwardWinner[]
  topAssisters: AwardWinner[]
  topGoalkeepers: AwardWinner[]
}>()
</script>
