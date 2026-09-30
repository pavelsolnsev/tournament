<!-- Подсказка: номер текущего матча из общего числа (в последнем матче и после плана не показываем). -->
<template>
  <div v-if="progress">
    <!-- Обычный матч: просто счётчик, чтобы было видно, сколько осталось. -->
    <p
      v-if="progress.phase === 'regular'"
      class="text-xs text-slate-600 dark:text-slate-400"
    >
      Матч {{ progress.current }} из {{ progress.total }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getMatchProgress } from '~/composables/tournament-standings/plannedMatches'

const props = defineProps<{
  teamCount: number
  playedCount: number
}>()

// Считаем прогресс из числа команд и сыгранных матчей; для необычного состава — null и блок скрыт.
const progress = computed(() => getMatchProgress(props.teamCount, props.playedCount))
</script>
