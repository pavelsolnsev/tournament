<!-- Содержимое раскрывающейся панели «Управление» — вынесено из StepStandingsMatchManagement.vue. -->
<template>
  <div
    :id="mgmtPanelId"
    role="region"
    :aria-labelledby="mgmtToggleId"
    class="border-t border-slate-200/90 px-2 py-2 dark:border-slate-700/60 sm:px-3"
  >
    <div
      class="divide-y divide-slate-200/90 overflow-hidden rounded-xl border border-slate-200/90 bg-white/80 dark:divide-slate-700/60 dark:border-slate-700/50 dark:bg-slate-900/40"
    >
      <!-- Матч: только пока выбрана пара — после «Показать итоги» команды сбрасываются, кнопки скрыты (не нажать повторно). -->
      <div
        v-if="(canFinishMatchShowResults || canFinishMatchSilent) && canFinishMatch"
        class="flex flex-col gap-1.5 p-2"
        aria-label="Матч"
      >
        <button
          v-if="canFinishMatchShowResults"
          type="button"
          class="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-white transition-colors
                 hover:bg-emerald-400 active:bg-emerald-600 dark:text-slate-900
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          @click="openActionConfirm('finish')"
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
            <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Показать итоги
        </button>
        <div v-if="canFinishMatchShowResults">
          <MoleculesDangerConfirmInline
            :open="isActionConfirmOpen && pendingAction === 'finish'"
            :seconds-left="finishMatchSecondsLeft"
            :busy="false"
            tone="success"
            aria-label="Подтверждение показа итогов матча зрителю"
            title="Показать итоги зрителям? Матч будет записан в историю, на сайте откроется экран итогов."
            cancel-text="Отмена"
            confirm-text="Да, показать"
            @cancel="closeActionConfirm"
            @confirm="confirmPendingAction"
          />
        </div>
        <button
          v-if="canFinishMatchSilent"
          type="button"
          class="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white transition-colors
                 hover:bg-emerald-500 active:bg-emerald-700 dark:text-slate-950
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          @click="openActionConfirm('finishSilent')"
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
            <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Завершить матч
        </button>
        <div v-if="canFinishMatchSilent">
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
      </div>

      <!-- Турнир -->
      <div
        v-if="canFinishTournament"
        class="space-y-1.5 bg-amber-50/50 p-2 dark:bg-amber-950/20"
        aria-label="Турнир"
      >
        <div
          v-if="finishTournamentStatus === 'success'"
          class="flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-1 text-[11px] text-emerald-800 dark:text-emerald-300"
        >
          <span aria-hidden="true">✅</span>
          <span>Сохранено</span>
        </div>
        <div
          v-else-if="finishTournamentStatus === 'error' && finishTournamentError"
          class="rounded-md bg-red-500/10 px-2 py-1 text-[11px] leading-snug text-red-700 dark:text-red-300"
        >
          {{ finishTournamentError }}
        </div>
        <button
          type="button"
          class="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-all
                 disabled:cursor-not-allowed disabled:opacity-40
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
          :class="finishTournamentStatus === 'success'
            ? 'border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
            : finishTournamentStatus === 'loading'
              ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              : 'border-amber-400/60 bg-white/90 text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/50 dark:text-amber-200'"
          :disabled="!canFinishTournament || !hasPlayedMatches || finishTournamentStatus === 'loading' || finishTournamentStatus === 'success' || showFinishTournamentConfirm"
          @click="openFinishTournamentConfirm"
        >
          <span
            v-if="finishTournamentStatus === 'loading'"
            class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 dark:border-slate-500 border-t-slate-700 dark:border-t-slate-200"
            aria-hidden="true"
          />
          <svg
            v-else-if="finishTournamentStatus === 'success'"
            class="h-3.5 w-3.5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg
            v-else
            class="h-3.5 w-3.5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.874a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          <span>{{
            finishTournamentStatus === 'loading' ? 'Сохранение...'
            : finishTournamentStatus === 'success' ? 'Турнир завершён'
            : 'Завершить турнир'
          }}</span>
        </button>
        <div>
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
        <button
          v-if="isMatchFinished"
          type="button"
          class="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300/80 bg-white/90 px-3 text-sm font-semibold text-slate-700 transition-colors
                 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          @click="onGoToResults"
        >
          <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Перейти к итогам
        </button>
        <NuxtLink
          to="/tournaments"
          class="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300/80 bg-white/90 px-3 text-sm font-semibold text-slate-700 transition-colors
                 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        >
          <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 7h18M3 12h18M3 17h18" />
          </svg>
          Архив турниров
        </NuxtLink>
      </div>

      <!-- Таймер — кнопка показывается только когда таймер скрыт. -->
      <div
        v-if="canFinishTournament && isTimerCollapsed"
        class="p-2"
      >
        <button
          type="button"
          class="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300/80 bg-white/90 px-3 text-sm font-semibold text-slate-700 transition-colors
                 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          @click="isTimerCollapsed = false"
        >
          <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          Открыть таймер
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import type { StepStandingsMatchManagementProps } from '~/composables/useStepStandingsMatchManagement'

const isTimerCollapsed = useState<boolean>('match-timer-bar-collapsed', () => false)

type Pending = 'next' | 'finish' | 'finishSilent' | null

defineProps<{
  mgmtPanelId: string
  mgmtToggleId: string
  canFinishMatchShowResults: boolean
  canFinishMatchSilent: boolean
  canFinishMatch: boolean
  canFinishTournament: boolean
  isLimitedAdmin: boolean
  hasPlayedMatches: boolean
  finishTournamentStatus: StepStandingsMatchManagementProps['finishTournamentStatus']
  finishTournamentError: StepStandingsMatchManagementProps['finishTournamentError']
  isActionConfirmOpen: boolean
  pendingAction: Pending
  finishMatchSecondsLeft: number
  showFinishTournamentConfirm: boolean
  finishTournamentConfirmSecondsLeft: number
  openActionConfirm: (a: 'next' | 'finish' | 'finishSilent') => void
  closeActionConfirm: () => void
  confirmPendingAction: () => void
  openFinishTournamentConfirm: () => void
  closeFinishTournamentConfirm: () => void
  confirmFinishTournament: () => void
  isMatchFinished: boolean
  onGoToResults: () => void
}>()
</script>
