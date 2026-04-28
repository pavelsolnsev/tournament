<template>
  <div
    class="mt-4 border-t border-slate-200/90 pt-3 dark:border-slate-700/50"
  >
    <button
      v-if="!cancelUi.vkCancelConfirmOpen.value"
      type="button"
      class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50/95 px-3 py-2 text-xs font-semibold text-red-800 shadow-sm transition-colors hover:border-red-300 hover:bg-red-100/90 active:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/45 dark:text-red-200 dark:hover:border-red-800/60 dark:hover:bg-red-950/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/35 sm:w-auto"
      :disabled="cancelUi.clearTournamentBusy.value || cancelUi.vkBusy.value || awaitingVkStatusFollowup"
      title="Запросить закрытие списка в ВК и сбросить турнир на сайте (как e! в боте)"
      @click="cancelUi.openVkCancelConfirm"
    >
      <svg
        class="h-3.5 w-3.5 shrink-0 opacity-90"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
      Отменить матч
    </button>
    <MoleculesDangerConfirmInline
      v-else
      :open="true"
      :seconds-left="cancelUi.vkCancelSecondsLeft.value"
      :busy="cancelUi.clearTournamentBusy.value"
      title="Отменить матч? Бот закроет список в чате (как e!), на сайте сбросится мастер турнира. Пока бот не ответит, привязка в статусе может оставаться."
      cancel-text="Отмена"
      confirm-text="Отменить матч"
      busy-text="Отменяем…"
      aria-label="Подтверждение отмены матча и сброса турнира"
      @cancel="cancelUi.closeVkCancelConfirm"
      @confirm="cancelUi.confirmVkCancelTournament"
    />
  </div>
</template>

<script setup lang="ts">
import { STEP_VK_LIST_START_CANCEL_UI } from '~/components/organisms/tournament/stepVkListStartInject'
import type { StepVkListStartCancelUi } from '~/components/organisms/tournament/stepVkListStartInject'

/** Кнопка «Отменить матч» + подтверждение — родитель показывает блок через v-if. */
defineProps<{
  awaitingVkStatusFollowup: boolean
}>()

const cancelUi = inject(STEP_VK_LIST_START_CANCEL_UI) as StepVkListStartCancelUi
</script>
