<!-- Сброс отметок и обновление страницы — компактный ряд в панели управления. -->
<template>
  <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
    <template v-if="!showResetMarksConfirm">
      <button
        type="button"
        class="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-300/80 bg-slate-100/90 px-2 text-sm font-semibold text-slate-800 transition-colors
               hover:bg-slate-200/80 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-800
               focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40"
        @click="$emit('open-reset-marks')"
      >
        <svg
          class="h-3.5 w-3.5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
        </svg>
        Сбросить отметки
      </button>
      <button
        type="button"
        class="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-700 transition-colors
               hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:bg-slate-800/80
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        aria-label="Обновить страницу"
        @click="$emit('reload-page')"
      >
        <svg
          class="h-3.5 w-3.5 shrink-0"
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
        Обновить
      </button>
    </template>
    <div v-else class="sm:col-span-2">
      <MoleculesDangerConfirmInline
        :open="true"
        :seconds-left="isLimitedAdmin ? 0 : resetMarksSecondsLeft"
        :busy="false"
        aria-label="Подтверждение сброса отметок"
        title="Сбросить отметки и результаты?"
        cancel-text="Отмена"
        :confirm-text="(isLimitedAdmin ? 0 : resetMarksSecondsLeft) > 0 ? `Сбросить через ${(isLimitedAdmin ? 0 : resetMarksSecondsLeft)}с` : 'Сбросить'"
        @cancel="$emit('cancel-reset-marks')"
        @confirm="$emit('confirm-reset-marks')"
      />
    </div>
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
