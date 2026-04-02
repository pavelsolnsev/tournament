<template>
  <!-- Кнопка переключения темы — иконка солнца для светлой, луны для тёмной. -->
  <button
    type="button"
    :aria-label="isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'"
    :title="isDark ? 'Светлая тема' : 'Тёмная тема'"
    class="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100/60 hover:text-slate-700 active:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 dark:active:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
    @click="toggleTheme"
  >
    <!-- Иконка луны — показывается в тёмной теме (предлагает переключиться на светлую) -->
    <svg
      v-if="isDark"
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>

    <!-- Иконка солнца — показывается в светлой теме (предлагает переключиться на тёмную) -->
    <svg
      v-else
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'

// Берём состояние и метод переключения из composable.
const { isDark, toggleTheme } = useTheme()
</script>
