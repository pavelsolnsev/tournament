<!-- Полный админ: очередь на создание списка в ВК (s prof / s tr / …) — отдельная панель в мастере. -->
<template>
  <AtomsTournamentPanel
    v-if="showPanel"
    as="section"
    root-class="min-w-0 w-full max-w-full overflow-x-hidden"
  >
    <!-- Один блок: статус ВК + либо «Отменить матч», либо форма «Создать матч». -->
    <div
      class="rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 px-3 py-3 shadow-sm ring-1 ring-slate-200/40 dark:border-slate-600/50 dark:from-slate-800/80 dark:to-slate-900/40 dark:ring-slate-700/30 sm:px-4 sm:py-4"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-start gap-2.5">
          <span
            class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/50"
            aria-hidden="true"
          >
            <AtomsVkLogoIcon size="sm" />
          </span>
          <div class="min-w-0 self-center">
            <p class="text-xs font-semibold leading-tight text-slate-800 dark:text-slate-100">
              Список в ВКонтакте
            </p>
          </div>
        </div>
        <button
          type="button"
          class="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-200/90 active:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700/60 dark:text-slate-200 dark:hover:bg-slate-700 dark:active:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
          :disabled="vkStatusPending"
          @click="() => void manualRefreshVkStatus()"
        >
          <svg
            v-if="!vkStatusPending"
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
          <svg
            v-else
            class="h-3.5 w-3.5 shrink-0 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          {{ vkStatusPending ? 'Обновляем…' : 'Обновить' }}
        </button>
      </div>

      <p v-if="vkStatusError" class="mt-3 rounded-lg bg-red-500/10 px-2.5 py-2 text-[11px] leading-snug text-red-700 dark:text-red-300">
        {{ vkStatusError }}
      </p>

      <template v-else>
        <div
          v-if="awaitingVkStatusFollowup"
          class="relative mt-3 flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-slate-200/80 bg-slate-50/90 px-3 py-2.5 text-[11px] font-medium text-slate-600 shadow-sm dark:border-slate-600/50 dark:bg-slate-800/50 dark:text-slate-300"
          :class="[
            vkStatusPending
              ? 'ring-2 ring-emerald-500/25 motion-safe:animate-[pulse_1.6s_cubic-bezier(0.4,0,0.6,1)_infinite]'
              : 'motion-safe:animate-[pulse_2.5s_cubic-bezier(0.4,0,0.6,1)_infinite]',
          ]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div
            v-if="!vkStatusPending"
            class="pointer-events-none absolute inset-y-0 left-0 w-2/5 motion-safe:animate-vkStatusSheen motion-reduce:animate-none"
            aria-hidden="true"
          >
            <div
              class="h-full w-full skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/[0.12]"
            />
          </div>
          <div class="relative z-10 flex min-w-0 items-center gap-2">
            <span
              v-if="!vkStatusPending"
              class="relative flex h-2 w-2 shrink-0"
              aria-hidden="true"
            >
              <span
                class="absolute inline-flex h-full w-full rounded-full bg-emerald-500/45 motion-safe:animate-ping"
              />
              <span
                class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400"
              />
            </span>
            <svg
              v-if="vkStatusPending"
              class="h-3.5 w-3.5 shrink-0 motion-safe:animate-spin text-emerald-600 dark:text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <svg
              v-else
              class="h-3.5 w-3.5 shrink-0 text-slate-500 motion-safe:animate-pulse dark:text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span class="min-w-0 leading-snug motion-safe:transition-opacity motion-safe:duration-500">{{ vkStatusFollowupMessage }}</span>
          </div>
        </div>

      <OrganismsTournamentVkListStartStatusBadges
        :vk-status="vkStatus"
        :vk-status-error="vkStatusError"
        :vk-peer-environment="vkPeerEnvironment"
        :vk-default-peer-label="vkDefaultPeerLabel"
        :awaiting-vk-status-followup="awaitingVkStatusFollowup"
      />

      <div
        v-if="vkStatus?.linked && !vkStatus?.vkListClosePending"
        class="mt-4 border-t border-slate-200/90 pt-3 dark:border-slate-700/50"
      >
        <button
          v-if="!vkCancelConfirmOpen"
          type="button"
          class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50/95 px-3 py-2 text-xs font-semibold text-red-800 shadow-sm transition-colors hover:border-red-300 hover:bg-red-100/90 active:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/45 dark:text-red-200 dark:hover:border-red-800/60 dark:hover:bg-red-950/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/35 sm:w-auto"
          :disabled="clearTournamentBusy || vkBusy || awaitingVkStatusFollowup"
          title="Запросить закрытие списка в ВК и сбросить турнир на сайте (как e! в боте)"
          @click="openVkCancelConfirm"
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
          :seconds-left="vkCancelSecondsLeft"
          :busy="clearTournamentBusy"
          title="Отменить матч? Бот закроет список в чате (как e!), на сайте сбросится мастер турнира. Пока бот не ответит, привязка в статусе может оставаться."
          cancel-text="Отмена"
          confirm-text="Отменить матч"
          busy-text="Отменяем…"
          aria-label="Подтверждение отмены матча и сброса турнира"
          @cancel="closeVkCancelConfirm"
          @confirm="confirmVkCancelTournament"
        />
      </div>

      <OrganismsTournamentVkListStartCreateMatchForm
        v-else-if="!vkStatus?.linked && !vkStatus?.pendingVkStart"
        v-model:event-date="vkEventDate"
        v-model:event-time="vkEventTime"
        :selected-preset="selectedPreset"
        :preset-buttons="presetButtons"
        :preset-chip-class="presetChipClass"
        :select-preset="selectPreset"
        :submit-create-match="submitCreateMatch"
        :can-submit-create-match="canSubmitCreateMatch"
        :vk-busy="vkBusy"
        :awaiting-vk-status-followup="awaitingVkStatusFollowup"
        :tr-team-slots-input="trTeamSlotsInput"
        :tr-team-slots-format-invalid="trTeamSlotsFormatInvalid"
        :on-tr-team-slots-input="onTrTeamSlotsInput"
        :tr-slots-id="trSlotsId"
        :vk-event-date-id="vkEventDateId"
        :vk-event-time-id="vkEventTimeId"
      />

      </template>

      <div
        v-if="vkStartError"
        class="mt-3 flex items-start gap-2 rounded-xl border border-red-300/70 bg-red-50 px-3 py-2.5 text-xs text-red-800 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-200"
        role="alert"
      >
        <span
          class="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
          aria-hidden="true"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </span>
        <span class="min-w-0">{{ vkStartError }}</span>
      </div>
    </div>
  </AtomsTournamentPanel>
</template>

<script setup lang="ts">
import { useConfirmCountdown } from '~/composables/useConfirmCountdown'
import { useTournamentVkListStart } from '~/composables/useTournamentVkListStart'

const props = withDefaults(
  defineProps<{
    clearTournamentBusy?: boolean
  }>(),
  { clearTournamentBusy: false },
)

const emit = defineEmits<{
  'cancel-tournament': []
}>()

const {
  showPanel,
  vkPeerEnvironment,
  vkDefaultPeerLabel,
  vkStatus,
  manualRefreshVkStatus,
  vkStatusPending,
  awaitingVkStatusFollowup,
  vkStatusFollowupMessage,
  vkStatusError,
  selectedPreset,
  vkEventDate,
  vkEventTime,
  trTeamSlotsInput,
  trTeamSlotsFormatInvalid,
  onTrTeamSlotsInput,
  vkBusy,
  vkStartError,
  trSlotsId,
  vkEventDateId,
  vkEventTimeId,
  presetButtons,
  canSubmitCreateMatch,
  presetChipClass,
  selectPreset,
  submitCreateMatch,
} = useTournamentVkListStart()

const vkCancelConfirmOpen = ref(false)
const { secondsLeft: vkCancelSecondsLeft, start: startVkCancelCountdown, stop: stopVkCancelCountdown } = useConfirmCountdown()

function closeVkCancelConfirm() {
  vkCancelConfirmOpen.value = false
  stopVkCancelCountdown()
}

function openVkCancelConfirm() {
  if (props.clearTournamentBusy || vkBusy.value) return
  vkCancelConfirmOpen.value = true
  startVkCancelCountdown()
}

function confirmVkCancelTournament() {
  emit('cancel-tournament')
}

watch(
  () => props.clearTournamentBusy,
  (busy, wasBusy) => {
    if (wasBusy === true && busy === false && vkCancelConfirmOpen.value) {
      closeVkCancelConfirm()
    }
  },
)
</script>
