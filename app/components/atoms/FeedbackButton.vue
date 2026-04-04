<template>
  <!-- Кнопка открытия формы пожеланий — иконка сообщения с пузырьком. -->
  <button
    type="button"
    aria-label="Оставить пожелание"
    title="Пожелания и идеи"
    class="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100/60 hover:text-slate-700 active:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 dark:active:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
    @click="openModal"
  >
    <!-- Иконка «чат-пузырёк» — намекает, что здесь можно что-то написать. -->
    <svg
      class="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { useFeedbackModal } from '~/composables/useFeedback'

// Берём метод открытия модального окна из composable.
const { openModal } = useFeedbackModal()
</script>
