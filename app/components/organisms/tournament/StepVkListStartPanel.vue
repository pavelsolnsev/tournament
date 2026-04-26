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
          @click="() => void refreshVkStatus()"
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

      <div v-else class="mt-3 flex flex-wrap items-center gap-2">
        <template v-if="vkStatus?.linked && vkStatus?.vkListClosePending">
          <div class="flex w-full min-w-0 flex-wrap items-center justify-between gap-2">
            <span
              class="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/25"
              role="status"
            >
              <svg
                class="h-3.5 w-3.5 shrink-0 animate-spin text-amber-600 dark:text-amber-400"
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
              Закрытие в боте (e!)
            </span>
            <MoleculesTournamentVkPeerEnvironmentChip
              :environment="vkPeerEnvironment"
              :label="vkDefaultPeerLabel"
            />
          </div>
        </template>
        <template v-else>
          <template v-if="!vkStatus?.linked">
            <div class="flex w-full min-w-0 flex-wrap items-center justify-between gap-2">
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200/90 dark:bg-slate-800/80 dark:text-slate-400 dark:ring-slate-600/50"
              >
                <svg
                  class="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                Список не создан
              </span>
              <MoleculesTournamentVkPeerEnvironmentChip
                :environment="vkPeerEnvironment"
                :label="vkDefaultPeerLabel"
              />
            </div>
          </template>
          <template v-else>
            <div class="flex w-full min-w-0 flex-wrap items-center justify-between gap-2">
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20"
              >
                <svg
                  class="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Матч создан
              </span>
              <MoleculesTournamentVkPeerEnvironmentChip
                :environment="vkPeerEnvironment"
                :label="vkDefaultPeerLabel"
              />
            </div>
          </template>
        </template>
        <span
          v-if="vkStatus?.pendingVkStart"
          class="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full bg-amber-500/12 px-3 py-1.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-500/20 motion-safe:animate-pulse dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/25"
          role="status"
          aria-busy="true"
          :aria-label="`Команда в очереди бота: ${vkStatus.pendingVkStart.commandText}`"
          :title="vkStatus.pendingVkStart.commandText"
        >
          <svg
            class="h-3.5 w-3.5 shrink-0 animate-spin text-amber-600 dark:text-amber-400"
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
          <span class="shrink-0">В очереди</span>
          <span class="min-w-0 truncate font-mono text-[10px] font-normal opacity-90">{{ vkStatus.pendingVkStart.commandText }}</span>
        </span>
      </div>

      <p
        v-if="vkStatus?.linked && vkStatus?.vkListClosePending && !vkStatusError"
        class="mt-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400"
      >
        Нужен запущенный vk-bot; привязка пропадёт после ответа бота.
      </p>

      <div
        v-if="vkStatus?.pendingVkStart && !vkStatusError"
        class="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400"
      >
        Ожидайте сообщение в чате или проверьте логи бота.
      </div>

      <div
        v-if="vkStatus?.linked && !vkStatus?.vkListClosePending"
        class="mt-4 border-t border-slate-200/90 pt-3 dark:border-slate-700/50"
      >
        <button
          v-if="!vkCancelConfirmOpen"
          type="button"
          class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50/95 px-3 py-2 text-xs font-semibold text-red-800 shadow-sm transition-colors hover:border-red-300 hover:bg-red-100/90 active:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/45 dark:text-red-200 dark:hover:border-red-800/60 dark:hover:bg-red-950/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/35 sm:w-auto"
          :disabled="clearTournamentBusy || vkBusy"
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

      <div
        v-else-if="!vkStatus?.linked && !vkStatus?.pendingVkStart"
        class="mt-4 border-t border-slate-200/90 pt-3 dark:border-slate-700/50"
      >
        <p class="mb-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
          Создать матч
        </p>
        <div class="flex min-w-0 flex-wrap gap-2">
        <button
          v-for="item in presetButtons"
          :key="item.preset"
          type="button"
          class="inline-flex items-center rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50"
          :class="presetChipClass(item.preset)"
          :disabled="vkBusy"
          @click="selectPreset(item.preset)"
        >
          {{ item.label }}
        </button>
      </div>

      <!-- Дата и время — те же обёртки и иконки, что «Дата проведения» в StepPlayersVenueFormat -->
      <div
        v-if="selectedPreset === 'prof' || selectedPreset === 'tr'"
        class="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap"
      >
      <div class="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-[11rem]">
        <label
          :for="vkEventDateId"
          class="text-xs font-medium text-slate-600 dark:text-slate-400"
        >
          Дата матча
        </label>
        <div
          data-app-date
          class="relative min-w-0 w-full max-w-full overflow-hidden rounded-lg border border-slate-300 bg-white transition-colors hover:border-slate-400 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-slate-700/60 dark:bg-slate-800/40 dark:hover:border-slate-600 dark:focus-within:border-emerald-500/50 dark:focus-within:ring-emerald-500/25"
        >
          <input
            :id="vkEventDateId"
            v-model="vkEventDate"
            type="date"
            class="box-border flex min-h-[2.75rem] w-full min-w-0 max-w-full cursor-pointer items-center border-0 bg-transparent py-2 pl-3 pr-11 text-left text-sm font-medium tabular-nums leading-normal text-slate-800 shadow-none outline-none ring-0 focus:border-transparent focus:outline-none focus:ring-0 dark:text-slate-100 dark:scheme-dark scheme-light
                   [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-11 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
          >
          <span
            class="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 text-slate-500 dark:text-slate-400"
            aria-hidden="true"
          >
            <svg
              class="h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </span>
        </div>
      </div>
      <div class="flex min-w-0 flex-col gap-1.5 sm:w-44">
        <label
          :for="vkEventTimeId"
          class="text-xs font-medium text-slate-600 dark:text-slate-400"
        >
          Время (МСК)
        </label>
        <div
          class="relative min-w-0 w-full max-w-full overflow-hidden rounded-lg border border-slate-300 bg-white transition-colors hover:border-slate-400 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-slate-700/60 dark:bg-slate-800/40 dark:hover:border-slate-600 dark:focus-within:border-emerald-500/50 dark:focus-within:ring-emerald-500/25"
        >
          <input
            :id="vkEventTimeId"
            v-model="vkEventTime"
            type="time"
            class="box-border flex min-h-[2.75rem] w-full min-w-0 max-w-full cursor-pointer items-center border-0 bg-transparent py-2 pl-3 pr-11 text-left text-sm font-medium tabular-nums leading-normal text-slate-800 shadow-none outline-none ring-0 focus:border-transparent focus:outline-none focus:ring-0 dark:text-slate-100 dark:scheme-dark scheme-light
                   [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-11 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
          >
          <span
            class="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 text-slate-500 dark:text-slate-400"
            aria-hidden="true"
          >
            <svg
              class="h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
        </div>
      </div>
      </div>

      <!-- Только режим турнира (s tr) — слоты команд для кнопок в чате -->
      <div
        v-if="selectedPreset === 'tr'"
        class="mt-3 flex min-w-0 flex-col gap-1.5"
      >
      <label
        :for="trSlotsId"
        class="text-xs font-medium text-slate-600 dark:text-slate-400"
      >
        Команды (через запятую)
      </label>
      <input
        :id="trSlotsId"
        :value="trTeamSlotsInput"
        type="text"
        placeholder="Красные, Синие"
        :aria-invalid="trTeamSlotsFormatInvalid"
        autocomplete="off"
        class="box-border block w-full max-w-full min-w-0 rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 dark:bg-slate-800/40 dark:text-slate-100 dark:placeholder-slate-600"
        :class="trTeamSlotsFormatInvalid
          ? 'border-red-400 focus:border-red-500/80 focus:ring-red-500/20 dark:border-red-500/50 dark:focus:border-red-400/60 dark:focus:ring-red-500/25'
          : 'border-slate-300 focus:border-emerald-500/60 focus:ring-emerald-500/20 dark:border-slate-700/60 dark:focus:border-emerald-500/50 dark:focus:ring-emerald-500/25'"
        @input="(e) => { onTrTeamSlotsInput((e.target as HTMLInputElement).value) }"
      >
      <p
        v-if="trTeamSlotsFormatInvalid"
        class="text-xs text-red-600 dark:text-red-400"
        role="alert"
      >
        Несколько команд — только через запятую (например: Красные, Синие). Длинное название одной команды пишите без лишнего раздела или с дефисом.
      </p>
      </div>

      <div v-if="selectedPreset" class="mt-4">
        <button
          type="button"
          class="inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-xl border border-emerald-500/55 bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600 active:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-950 dark:hover:bg-emerald-400 dark:active:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/45 sm:w-auto"
          :disabled="!canSubmitCreateMatch"
          @click="submitCreateMatch"
        >
          <svg
            class="h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Создать матч
        </button>
      </div>
      </div>

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
  refreshVkStatus,
  vkStatusPending,
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
const vkCancelSecondsLeft = ref(0)
const vkCancelIntervalId = ref<ReturnType<typeof setInterval> | null>(null)

function closeVkCancelConfirm() {
  vkCancelConfirmOpen.value = false
  vkCancelSecondsLeft.value = 0
  if (vkCancelIntervalId.value) {
    clearInterval(vkCancelIntervalId.value)
    vkCancelIntervalId.value = null
  }
}

function openVkCancelConfirm() {
  if (props.clearTournamentBusy || vkBusy.value) return
  closeVkCancelConfirm()
  vkCancelConfirmOpen.value = true
  vkCancelSecondsLeft.value = 3
  vkCancelIntervalId.value = setInterval(() => {
    vkCancelSecondsLeft.value = Math.max(0, vkCancelSecondsLeft.value - 1)
    if (vkCancelSecondsLeft.value === 0 && vkCancelIntervalId.value) {
      clearInterval(vkCancelIntervalId.value)
      vkCancelIntervalId.value = null
    }
  }, 1000)
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

onUnmounted(() => {
  if (vkCancelIntervalId.value) {
    clearInterval(vkCancelIntervalId.value)
    vkCancelIntervalId.value = null
  }
})
</script>
