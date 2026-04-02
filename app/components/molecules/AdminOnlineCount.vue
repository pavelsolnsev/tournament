<template>
  <!-- Иконка «глаз» + число — компактный счётчик вкладок на сайте. -->
  <span
    class="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold tabular-nums text-slate-600 dark:text-slate-300"
    role="status"
    :title="'Сколько вкладок недавно открывало сайт'"
    :aria-label="`Сейчас на сайте, вкладок: ${displayValue}`"
  >
    <svg
      class="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
    <span class="min-w-[1ch] text-slate-800 dark:text-slate-100">{{ displayValue }}</span>
  </span>
</template>

<script setup lang="ts">
import { usePresenceAdminCount } from '~/composables/usePresenceAdminCount'

const { count, query } = usePresenceAdminCount()

// Пока первая загрузка — многоточие, потом число (или 0 при пустом ответе).
const displayValue = computed(() => {
  if (query.isPending.value && query.data.value === undefined) return '…'
  return String(count.value)
})
</script>
