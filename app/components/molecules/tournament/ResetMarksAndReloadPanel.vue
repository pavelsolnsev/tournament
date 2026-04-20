<!-- Сброс отметок и кнопка обновления страницы — низ панели управления матчем. -->
<template>
  <div>
    <button
      v-if="!showResetMarksConfirm"
      type="button"
      class="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-300/70 bg-slate-100/70
             px-4 text-sm font-semibold text-slate-700 transition-colors
             hover:bg-slate-200/70 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800
             focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40"
      @click="$emit('open-reset-marks')"
    >
      Сбросить отметки
    </button>
    <div v-else>
      <MoleculesDangerConfirmInline
        :open="true"
        :seconds-left="isLimitedAdmin ? 0 : resetMarksSecondsLeft"
        :busy="false"
        aria-label="Подтверждение сброса отметок"
        title="Сбросить отметки и результаты?"
        subtitle="Сыгранные матчи, счёт и отметки игроков будут обнулены. Команды и игроки останутся."
        cancel-text="Отмена"
        :confirm-text="(isLimitedAdmin ? 0 : resetMarksSecondsLeft) > 0 ? `Сбросить через ${(isLimitedAdmin ? 0 : resetMarksSecondsLeft)}с` : 'Сбросить'"
        @cancel="$emit('cancel-reset-marks')"
        @confirm="$emit('confirm-reset-marks')"
      />
    </div>

    <div class="border-t border-slate-200 dark:border-slate-700/60" />

    <button
      type="button"
      class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-300/70 bg-white/70 px-4 text-sm font-semibold text-slate-700 transition-colors
             hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-900/70
             focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      aria-label="Обновить страницу"
      @click="$emit('reload-page')"
    >
      <svg
        class="h-4 w-4"
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
      Обновить страницу
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  showResetMarksConfirm: boolean
  resetMarksSecondsLeft: number
  isLimitedAdmin: boolean
}>()

defineEmits<{
  'open-reset-marks': []
  'cancel-reset-marks': []
  'confirm-reset-marks': []
  'reload-page': []
}>()
</script>
