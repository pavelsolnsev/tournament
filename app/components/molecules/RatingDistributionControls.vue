<!-- Молекула: панель «Распределить по рейтингу» с двухшаговым флоу. -->
<!-- Шаг 1: список свободных игроков + кнопка-триггер.                -->
<!-- Шаг 2: выбор количества команд + подтверждение.                   -->
<template>
  <div
    class="rounded-xl border border-slate-200/90 bg-slate-100 p-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/50 dark:shadow-none sm:px-4 sm:py-3.5"
    :class="
      open || freePlayers.length === 0
        ? 'ring-1 ring-emerald-500/15 dark:ring-emerald-500/10'
        : ''
    "
  >

    <!-- ─── Шаг 1: список свободных игроков ─── -->
    <template v-if="!open">

      <!-- Есть свободные — заголовок + чипы -->
      <template v-if="freePlayers.length > 0">
        <span class="text-sm font-medium text-slate-600 dark:text-slate-300">
          Свободные игроки
          <span class="ml-1 rounded bg-slate-200 dark:bg-slate-700/80 px-1.5 py-0.5 text-xs tabular-nums text-slate-600 dark:text-slate-400">
            {{ freePlayers.length }}
          </span>
        </span>
      </template>

      <!-- Никого свободно — компактный статус + кнопка -->
      <div
        v-else
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      >
        <div class="flex min-w-0 items-center gap-3">
          <span
            class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
            aria-hidden="true"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-tight text-slate-800 dark:text-slate-100">
              Все игроки распределены
            </p>
            <p class="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">
              Появятся свободные игроки — снова можно будет распределить по рейтингу.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled
          title="Нет свободных игроков для распределения"
          class="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors
                 border-slate-300/90 bg-white text-slate-400 shadow-none
                 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-500
                 sm:w-auto sm:min-w-[10.5rem]"
          aria-disabled="true"
        >
          <span aria-hidden="true" class="text-base leading-none opacity-60">⚡</span>
          По рейтингу
        </button>
      </div>

      <!-- Чипы свободных игроков -->
      <ul
        v-if="freePlayers.length > 0"
        class="mt-2 mb-3 flex flex-wrap gap-1.5"
        aria-label="Свободные игроки"
      >
        <li
          v-for="p in freePlayers"
          :key="p.id"
          class="flex min-w-0 items-center gap-1 rounded-lg bg-slate-200/80 dark:bg-slate-700/50 px-2 py-1"
        >
          <span class="max-w-[7rem] truncate text-xs text-slate-700 dark:text-slate-200 sm:max-w-[10rem]">
            {{ displayName(p) }}
          </span>
          <span
            v-if="p.rating != null"
            class="shrink-0 text-[11px] tabular-nums text-slate-600 dark:text-slate-500"
          >
            {{ ratingTierEmoji(Math.round(p.rating)) }} {{ formatPlayerRatingDisplay(Number(p.rating)) }}
          </span>
          <!-- Кнопка «убрать из турнира» — только для свободных; возвращает игрока на шаг выбора (в базовый список). -->
          <button
            type="button"
            class="shrink-0 rounded-md px-1 text-xs font-semibold leading-none text-slate-500 transition-colors md:hover:bg-slate-300/70 md:hover:text-red-600 dark:text-slate-400 dark:md:hover:bg-slate-600/60 dark:md:hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
            :aria-label="`Убрать из турнира: ${displayName(p)}`"
            :title="`Убрать из турнира: ${displayName(p)}`"
            @click.stop="emit('removeFreePlayer', p.id)"
          >
            ×
          </button>
        </li>
      </ul>

      <!-- Кнопка-триггер — только если есть свободные (без них — отдельный блок выше). -->
      <button
        v-if="freePlayers.length > 0"
        type="button"
        title="Автоматически распределить по рейтингу"
        class="flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold
               transition-colors
               border-emerald-600/50 bg-emerald-50 text-emerald-700
               hover:border-emerald-600 hover:bg-emerald-100 hover:text-emerald-800
               active:bg-emerald-200
               dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-300
               dark:hover:border-emerald-500 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-200
               dark:active:bg-emerald-500/30
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        @click="open = true"
      >
        <span aria-hidden="true" class="text-base leading-none">⚡</span>
        По рейтингу
      </button>
    </template>

    <!-- ─── Шаг 2: выбор количества команд ─── -->
    <template v-else>
      <div class="flex flex-col gap-4">
        <div class="flex gap-3">
          <span
            class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
            aria-hidden="true"
          >
            <span class="text-lg leading-none">⚡</span>
          </span>
          <div class="min-w-0">
            <h3 class="text-base font-semibold leading-tight text-slate-800 dark:text-slate-100">
              На сколько команд делим?
            </h3>
            <p class="mt-1 text-xs leading-snug text-slate-500 dark:text-slate-400">
              В распределении {{ freePlayers.length }} чел. — в карточках примерно игр на команду.
            </p>
          </div>
        </div>

        <div
          class="grid grid-cols-3 gap-2.5 sm:gap-3"
          role="group"
          aria-label="Количество команд"
        >
          <button
            v-for="n in [2, 3, 4]"
            :key="n"
            type="button"
            class="flex min-h-[4.75rem] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-3 transition-colors
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-800"
            :class="
              modelValue === n
                ? 'border-emerald-500/70 bg-emerald-500/15 shadow-sm ring-1 ring-emerald-500/30 dark:bg-emerald-500/20 dark:ring-emerald-500/25'
                : 'border-slate-200/90 bg-white/90 dark:border-slate-600/70 dark:bg-slate-900/50 md:hover:border-slate-300 dark:md:hover:border-slate-500 md:hover:bg-slate-50/90 dark:md:hover:bg-slate-800/70'
            "
            :aria-pressed="modelValue === n"
            @click="emit('update:modelValue', n)"
          >
            <span
              class="text-2xl font-bold tabular-nums leading-none"
              :class="modelValue === n ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'"
            >
              {{ n }}
            </span>
            <span
              class="text-[11px] font-medium leading-tight text-slate-500 dark:text-slate-400"
              :class="modelValue === n && 'text-emerald-700/90 dark:text-emerald-400/90'"
            >
              ~{{ Math.ceil(freePlayers.length / n) }}&nbsp;игр/к
            </span>
          </button>
        </div>

        <div
          class="flex flex-col gap-2.5 border-t border-slate-200/80 pt-4 dark:border-slate-600/60 sm:flex-row sm:items-stretch sm:gap-3"
        >
          <button
            type="button"
            class="order-2 min-h-[2.75rem] flex-1 rounded-xl border border-slate-300/90 bg-white/80 px-4 text-sm font-medium text-slate-600 transition-colors
                   dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300
                   md:hover:border-slate-400 dark:md:hover:border-slate-500 md:hover:bg-slate-50 dark:md:hover:bg-slate-800/80 md:hover:text-slate-800 dark:md:hover:text-slate-100
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40 sm:order-1"
            @click="open = false"
          >
            Отмена
          </button>

          <button
            type="button"
            class="order-1 min-h-[2.75rem] flex-[2] rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm transition-colors
                   dark:text-slate-900 dark:shadow-emerald-950/20
                   md:hover:bg-emerald-400 active:bg-emerald-600 dark:md:hover:bg-emerald-400
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-800 sm:order-2"
            @click="onConfirm"
          >
            <span class="sm:hidden">Распределить ({{ modelValue }})</span>
            <span class="hidden sm:inline">Распределить на {{ modelValue }}</span>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Player } from '~/types/tournament'
import {
  ratingTierEmoji,
  displayPlayerLabelWithoutRating,
  formatPlayerRatingDisplay,
} from '~/composables/usePlayerDisplay'

defineProps<{
  modelValue: number
  freePlayers: Player[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
  distribute: []
  /** Убрать игрока из выбранных на турнир (с шага «Команды», из блока свободных). */
  removeFreePlayer: [playerId: number]
}>()

// Флаг: открыт ли шаг выбора количества команд.
const open = ref(false)

function onConfirm() {
  // Закрываем панель и запускаем распределение.
  open.value = false
  emit('distribute')
}

// Имя игрока без рейтинга — username без @ или displayName.
function displayName(p: Player): string {
  return displayPlayerLabelWithoutRating(p)
}
</script>
