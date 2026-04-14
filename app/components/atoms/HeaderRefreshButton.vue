<template>
  <!-- Кнопка «Обновить данные» в шапке: одна и та же для зрителя и администратора. -->
  <button
    type="button"
    class="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100/60 hover:text-slate-700 active:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 sm:h-11 sm:w-11 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 dark:active:bg-slate-800"
    :class="busy && 'pointer-events-none'"
    aria-label="Обновить"
    @click="emit('click')"
  >
    <!-- Иконка крутится, пока родитель держит busy — так видно, что запрос идёт. -->
    <svg
      class="h-5 w-5 transition-transform duration-500"
      :class="busy && 'animate-spin'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  /** true — крутим стрелку и блокируем повторные нажатия, пока идёт обновление. */
  busy?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()
</script>
