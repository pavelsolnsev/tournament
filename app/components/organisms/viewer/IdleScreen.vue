<!-- Экран гостя до начала турнира: заглушка с кнопкой «Прошлые турниры» и топ-10 рейтинга под ней. -->
<template>
  <div class="flex flex-1 flex-col items-center justify-center gap-4">
    <div
      class="flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-dashed border-slate-700 dark:border-slate-400 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm px-6 py-10 text-center"
    >
      <span class="text-5xl" aria-hidden="true">⚽</span>
      <p class="text-base font-semibold text-slate-700 dark:text-slate-300">
        Турнир ещё не начался
      </p>
      <NuxtLink
        to="/tournaments"
        class="inline-flex items-center gap-2.5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-900/20 transition-all hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-900/25 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 dark:bg-emerald-700 dark:hover:bg-emerald-600"
      >
        <span aria-hidden="true">🏆</span>
        Прошлые турниры
      </NuxtLink>
    </div>

    <!-- Топ-10 рейтинга игроков -->
    <OrganismsViewerTopRatingCard :players="players" />
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'

defineProps<{
  players: Player[]
}>()
</script>
