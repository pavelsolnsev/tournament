<!-- Форма создания матча: пресеты (s prof / s tr), дата/время, слоты команд (для tr), кнопка «Создать». -->
<template>
  <div class="mt-4 border-t border-slate-200/90 pt-3 dark:border-slate-700/50">
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
        :disabled="vkBusy || awaitingVkStatusFollowup"
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
            v-model="eventDate"
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
            v-model="eventTime"
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
        :disabled="!canSubmitCreateMatch || awaitingVkStatusFollowup"
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
</template>

<script setup lang="ts">
import type { VkListPreset } from '~/composables/useTournamentVkListStart'

defineProps<{
  selectedPreset: VkListPreset | null
  presetButtons: ReadonlyArray<{ preset: VkListPreset; label: string }>
  presetChipClass: (preset: VkListPreset) => string
  selectPreset: (preset: VkListPreset) => void
  submitCreateMatch: () => void
  canSubmitCreateMatch: boolean
  vkBusy: boolean
  awaitingVkStatusFollowup: boolean
  trTeamSlotsInput: string
  trTeamSlotsFormatInvalid: boolean
  onTrTeamSlotsInput: (value: string) => void
  trSlotsId: string
  vkEventDateId: string
  vkEventTimeId: string
}>()

const eventDate = defineModel<string>('eventDate', { required: true })
const eventTime = defineModel<string>('eventTime', { required: true })
</script>