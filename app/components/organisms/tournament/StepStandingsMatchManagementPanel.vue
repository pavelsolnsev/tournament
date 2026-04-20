<!-- Содержимое раскрывающейся панели «Управление» — вынесено из StepStandingsMatchManagement.vue. -->
<template>
  <div
    :id="mgmtPanelId"
    role="region"
    :aria-labelledby="mgmtToggleId"
    class="flex flex-col gap-2 border-t border-slate-200 dark:border-slate-700/60 px-3 py-3"
  >
    <button
      v-if="canFinishMatchShowResults"
      type="button"
      class="inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white dark:text-slate-900
             transition-colors md:hover:bg-emerald-400 active:bg-emerald-600
             disabled:cursor-not-allowed disabled:opacity-40
             focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
      :disabled="!canFinishMatch"
      @click="openActionConfirm('finish')"
    >
      Показать итоги
    </button>

    <div v-if="canFinishMatchShowResults" :ref="anchors.finishConfirmAnchor">
      <MoleculesDangerConfirmInline
        :open="isActionConfirmOpen && pendingAction === 'finish'"
        :seconds-left="finishMatchSecondsLeft"
        :busy="false"
        aria-label="Подтверждение показа итогов матча зрителю"
        title="Показать итоги зрителям? Матч будет записан в историю, на сайте откроется экран итогов."
        cancel-text="Отмена"
        confirm-text="Показать итоги"
        @cancel="closeActionConfirm"
        @confirm="confirmPendingAction"
      />
    </div>

    <button
      v-if="canFinishMatchSilent"
      type="button"
      class="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/80 px-4 text-sm font-semibold text-slate-800 dark:text-slate-100
             transition-colors md:hover:bg-slate-50 dark:md:hover:bg-slate-800
             disabled:cursor-not-allowed disabled:opacity-40
             focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
      :disabled="!canFinishMatch"
      @click="openActionConfirm('finishSilent')"
    >
      Завершить матч
    </button>

    <div v-if="canFinishMatchSilent" :ref="anchors.finishSilentConfirmAnchor">
      <MoleculesConfirmInline
        class="mt-0"
        :open="isActionConfirmOpen && pendingAction === 'finishSilent'"
        :busy="false"
        tone="neutral"
        aria-label="Подтверждение фиксации матча без показа итогов"
        title="Зафиксировать матч в истории? Отметки сохранятся, зрителю не покажем экран итогов этого матча."
        cancel-text="Отмена"
        confirm-text="Зафиксировать"
        @cancel="closeActionConfirm"
        @confirm="confirmPendingAction"
      />
    </div>

    <div class="border-t border-slate-200 dark:border-slate-700/60" />

    <div
      v-if="finishTournamentStatus === 'success'"
      class="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300"
    >
      <span aria-hidden="true">✅</span>
      <span>Данные сохранены в базу!</span>
    </div>
    <div
      v-else-if="finishTournamentStatus === 'error' && finishTournamentError"
      class="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300"
    >
      <span aria-hidden="true" class="mt-0.5 shrink-0">⚠️</span>
      <span>{{ finishTournamentError }}</span>
    </div>

    <button
      v-if="canFinishTournament"
      type="button"
      class="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border px-4
             text-sm font-semibold transition-all
             disabled:cursor-not-allowed disabled:opacity-40
             focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
      :class="finishTournamentStatus === 'success'
        ? 'border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
        : finishTournamentStatus === 'loading'
          ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 md:hover:bg-amber-500/20 md:hover:border-amber-500/50'"
      :disabled="!canFinishTournament || !hasPlayedMatches || finishTournamentStatus === 'loading' || finishTournamentStatus === 'success' || showFinishTournamentConfirm"
      @click="openFinishTournamentConfirm"
    >
      <span
        v-if="finishTournamentStatus === 'loading'"
        class="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 dark:border-slate-500 border-t-slate-700 dark:border-t-slate-200"
        aria-hidden="true"
      />
      <span v-else class="text-base leading-none" aria-hidden="true">
        {{ finishTournamentStatus === 'success' ? '✅' : '🏆' }}
      </span>
      <span>{{
        finishTournamentStatus === 'loading' ? 'Сохранение...'
        : finishTournamentStatus === 'success' ? 'Турнир завершён'
        : 'Завершить турнир'
      }}</span>
    </button>

    <div :ref="anchors.finishTournamentConfirmAnchor">
      <MoleculesDangerConfirmInline
        :open="showFinishTournamentConfirm && canFinishTournament"
        :seconds-left="finishTournamentConfirmSecondsLeft"
        :busy="finishTournamentStatus === 'loading'"
        aria-label="Подтверждение завершения турнира"
        title="Завершить турнир? Статистика игроков и команд будет сохранена в базу."
        cancel-text="Отмена"
        confirm-text="Сохранить и завершить"
        busy-text="Сохранение…"
        @cancel="closeFinishTournamentConfirm"
        @confirm="confirmFinishTournament"
      />
    </div>

    <div class="border-t border-slate-200 dark:border-slate-700/60" />

    <button
      v-if="canClearTournament && !showClearTournamentConfirm"
      type="button"
      class="inline-flex h-10 w-full items-center justify-center rounded-xl border border-red-300/70 bg-red-50
             px-4 text-sm font-semibold text-red-700 transition-colors
             hover:bg-red-100 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50
             focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
      @click="$emit('clear-tournament')"
    >
      Очистить данные
    </button>
    <div v-else-if="canClearTournament" :ref="anchors.clearDataConfirmAnchor">
      <MoleculesDangerConfirmInline
        :open="true"
        :seconds-left="clearTournamentSecondsLeft"
        :busy="clearTournamentBusy"
        title="Сбросить турнир? Игроки в турнире, команды, таблица и статус матча обнулятся. Список игроков в базе не трогаем."
        cancel-text="Отмена"
        confirm-text="Очистить всё"
        busy-text="Очищаем…"
        aria-label="Подтверждение полного сброса турнира"
        @cancel="$emit('cancel-clear-tournament')"
        @confirm="$emit('confirm-clear-tournament')"
      />
    </div>

    <MoleculesTournamentVkLinkStatusPanel
      :can-view-vk-status="canViewVkStatus"
      :vk-status-pending="vkStatusPending"
      :vk-status-error="vkStatusError"
      :vk-status-linked="vkStatusLinked"
      :vk-peer-id="vkPeerId"
      @refresh="refreshVkStatus"
    />

    <MoleculesTournamentResetMarksAndReloadPanel
      :show-reset-marks-confirm="showResetMarksConfirm"
      :reset-marks-seconds-left="resetMarksSecondsLeft"
      :is-limited-admin="isLimitedAdmin"
      @open-reset-marks="openResetMarksConfirm"
      @cancel-reset-marks="closeResetMarksConfirm"
      @confirm-reset-marks="confirmResetMarks"
      @reload-page="reloadPage"
    />
  </div>
</template>

<script setup lang="ts">
import { matchManagementConfirmAnchorsKey } from '~/composables/stepStandingsMatchManagementAnchors'
import type { StepStandingsMatchManagementProps } from '~/composables/useStepStandingsMatchManagement'

type Pending = 'next' | 'finish' | 'finishSilent' | null

defineProps<{
  mgmtPanelId: string
  mgmtToggleId: string
  canFinishMatchShowResults: boolean
  canFinishMatchSilent: boolean
  canFinishMatch: boolean
  canFinishTournament: boolean
  canClearTournament: boolean
  canViewVkStatus: boolean
  isLimitedAdmin: boolean
  hasPlayedMatches: boolean
  finishTournamentStatus: StepStandingsMatchManagementProps['finishTournamentStatus']
  finishTournamentError: StepStandingsMatchManagementProps['finishTournamentError']
  showClearTournamentConfirm: boolean
  clearTournamentSecondsLeft: number
  clearTournamentBusy: boolean
  isActionConfirmOpen: boolean
  pendingAction: Pending
  finishMatchSecondsLeft: number
  showFinishTournamentConfirm: boolean
  finishTournamentConfirmSecondsLeft: number
  showResetMarksConfirm: boolean
  resetMarksSecondsLeft: number
  vkStatusPending: boolean
  vkStatusError: string | null
  vkStatusLinked: boolean
  vkPeerId: number | null
  openActionConfirm: (a: 'next' | 'finish' | 'finishSilent') => void
  closeActionConfirm: () => void
  confirmPendingAction: () => void
  openFinishTournamentConfirm: () => void
  closeFinishTournamentConfirm: () => void
  confirmFinishTournament: () => void
  openResetMarksConfirm: () => void
  closeResetMarksConfirm: () => void
  confirmResetMarks: () => void
  refreshVkStatus: () => void
  reloadPage: () => void
}>()

defineEmits<{
  'clear-tournament': []
  'cancel-clear-tournament': []
  'confirm-clear-tournament': []
}>()

const anchors = inject(matchManagementConfirmAnchorsKey)!
</script>
