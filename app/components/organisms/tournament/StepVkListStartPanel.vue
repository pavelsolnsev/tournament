<!-- Полный админ: очередь на создание списка в ВК (s prof / s tr / …) — отдельная панель в мастере. -->
<template>
  <AtomsTournamentPanel
    v-if="showPanel"
    as="section"
    root-class="min-w-0 w-full max-w-full overflow-x-hidden"
  >
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="flex min-w-0 items-center gap-1.5">
        <AtomsVkLogoIcon size="sm" />
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">
          Список в ВКонтакте
        </p>
      </div>
      <button
        type="button"
        class="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        aria-label="Обновить статус"
        :disabled="vkStatusPending"
        @click="() => void refreshVkStatus()"
      >
        <svg
          class="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400"
          :class="vkStatusPending && 'animate-spin'"
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
    </div>

    <div
      v-if="vkStatus?.linked"
      class="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 dark:border-slate-700/50 dark:bg-slate-900/30 dark:text-slate-200"
    >
      <span
        class="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
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
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </span>
      <span>
        Чат привязан:
        <span class="font-mono tabular-nums">peer {{ vkStatus.peerId }}</span>
      </span>
    </div>
    <div v-else class="space-y-1.5">
      <p class="flex items-start gap-2 text-xs font-medium text-amber-800 dark:text-amber-200/90">
        <span
          class="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
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
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </span>
        <span>Привязки нет — введите peer_id беседы (число из ссылки чата ВК) или сначала создайте список из бота.</span>
      </p>
      <input
        v-model="peerIdManual"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        :placeholder="`Например ${defaultPeerHint}`"
        class="box-border block w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-100 dark:placeholder-slate-600 dark:focus:border-emerald-500/50 dark:focus:ring-emerald-500/25"
      >
    </div>

    <div
      v-if="vkStatus?.pendingVkStart"
      class="flex items-start gap-2 rounded-lg border border-amber-300/70 bg-amber-50 px-2.5 py-2 text-xs text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/35 dark:text-amber-100"
      role="status"
    >
      <span
        class="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
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
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </span>
      <span class="min-w-0">
        <span class="font-medium">В очереди:</span>
        <span class="ml-1 font-mono text-[11px]">{{ vkStatus.pendingVkStart.commandText }}</span>
        <span class="mt-1 block text-[11px] opacity-90">Ожидайте публикации в чате или проверьте логи бота.</span>
      </span>
    </div>

    <div class="border-t border-slate-200 dark:border-slate-700/40" />

    <p class="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">
      Тип матча
    </p>
    <div class="flex min-w-0 flex-wrap gap-1.5">
      <button
        v-for="item in presetButtons"
        :key="item.preset"
        type="button"
        class="inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50"
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
      class="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap"
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
      class="flex min-w-0 flex-col gap-1.5"
    >
      <label
        :for="trSlotsId"
        class="text-xs font-medium text-slate-600 dark:text-slate-400"
      >
        Команды (через запятую)
      </label>
      <input
        :id="trSlotsId"
        v-model="trTeamSlotsInput"
        type="text"
        placeholder="Красные, Синие"
        class="box-border block w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-100 dark:placeholder-slate-600 dark:focus:border-emerald-500/50 dark:focus:ring-emerald-500/25"
      >
    </div>

    <div v-if="selectedPreset">
      <button
        type="button"
        class="inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-emerald-500/60 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-600/50 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 sm:w-auto"
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

    <div
      v-if="vkStartError"
      class="flex items-start gap-2 rounded-lg border border-red-300/70 bg-red-50 px-2.5 py-2 text-xs text-red-800 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-200"
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
  </AtomsTournamentPanel>
</template>

<script setup lang="ts">
import { useTournamentVkListStart } from '~/composables/useTournamentVkListStart'

const {
  showPanel,
  defaultPeerHint,
  vkStatus,
  refreshVkStatus,
  vkStatusPending,
  peerIdManual,
  selectedPreset,
  vkEventDate,
  vkEventTime,
  trTeamSlotsInput,
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
</script>
