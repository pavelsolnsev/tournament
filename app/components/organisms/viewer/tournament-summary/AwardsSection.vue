<template>
  <!-- Simple10: Четыре карточки наград (бомбардир, ассистент, вратарь, гол + пас) или заглушки, если статистики не было. -->
  <div id="summary-awards" class="scroll-mt-24 pt-5 pb-5 sm:px-6">
    <p class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">🎖️ Индивидуальные награды</p>

    <div class="flex flex-col gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-4">
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

      <!-- Гол + пас: кто больше всех участвовал в голах — забил сам или отдал передачу. -->
      <AtomsAwardCard
        v-if="topGoalPlusAssist.length > 0"
        icon="⚡"
        label="Гол + пас"
        :value-label="goalPlusAssistLabel"
        color="amber"
        :winners="topGoalPlusAssist"
      />
      <MoleculesViewerTournamentSummaryEmptyAward v-else icon="⚡" text="Голов и передач не было" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AwardWinner } from '~/composables/useTournamentSummary'
import { pluralAssists, pluralGoals, pluralSaves } from '~/utils/tournamentSummaryPlurals'

const props = defineProps<{
  topScorers: AwardWinner[]
  topAssisters: AwardWinner[]
  topGoalkeepers: AwardWinner[]
  topGoalPlusAssist: AwardWinner[]
}>()

// «7 (4 + 3)»: сумма и из чего она сложилась. При ничьей у лидеров одна сумма — расклад берём у первого.
const goalPlusAssistLabel = computed(() => {
  const w = props.topGoalPlusAssist[0]
  if (!w) return ''
  const g = w.tournamentStats?.goals ?? 0
  const a = w.tournamentStats?.assists ?? 0
  return props.topGoalPlusAssist.length === 1 ? `${w.value} (${g} + ${a})` : String(w.value)
})
</script>
