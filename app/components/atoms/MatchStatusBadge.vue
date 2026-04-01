<template>
  <!-- Бейдж статуса матча: upcoming / live / finished.
       Live — красный пульсирующий индикатор (как на топовых спортивных платформах).
       Upcoming — нейтральный серый. Finished — зелёный. -->
  <span
    class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
    :class="badgeClasses"
    v-bind="$attrs"
  >
    <!-- Мигающая точка — только для Live -->
    <span
      v-if="status === 'live'"
      class="relative flex h-2 w-2 shrink-0"
      aria-hidden="true"
    >
      <!-- Внешний круг — пульсирует -->
      <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
      <!-- Внутренний круг — стабильный -->
      <span class="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
    </span>

    <!-- Иконка для upcoming -->
    <svg
      v-else-if="status === 'upcoming'"
      class="h-3 w-3 shrink-0"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <!-- Простые часы — показывает ожидание -->
      <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z" />
      <path d="M7.5 3.5a.5.5 0 0 1 .5.5V8l2.5 1.5a.5.5 0 0 1-.5.866L7 8.5a.5.5 0 0 1-.25-.433V4a.5.5 0 0 1 .5-.5z" />
    </svg>

    <!-- Иконка-галочка для finished -->
    <svg
      v-else-if="status === 'finished'"
      class="h-3 w-3 shrink-0"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z" />
    </svg>

    <!-- Текст статуса -->
    <span>{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import type { MatchStatus } from '~/types/tournament'

// Получаем статус снаружи — компонент только отображает, не управляет состоянием.
const props = defineProps<{
  status: MatchStatus
}>()

// Текст для каждого статуса — понятен зрителю без пояснений.
const label = computed(() => {
  if (props.status === 'live') return 'Live'
  if (props.status === 'finished') return 'Завершён'
  return 'Ожидается'
})

// Цветовые классы по статусу — Live красный, finished зелёный, upcoming серый.
const badgeClasses = computed(() => {
  if (props.status === 'live') {
    return 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30'
  }
  if (props.status === 'finished') {
    return 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
  }
  // upcoming
  return 'bg-slate-700/60 text-slate-400 ring-1 ring-slate-600/40'
})
</script>
