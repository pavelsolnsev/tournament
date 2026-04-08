<!-- Молекула: панель «Распределить по рейтингу» с двухшаговым флоу. -->
<!-- Шаг 1: список свободных игроков + кнопка-триггер.                -->
<!-- Шаг 2: выбор количества команд + подтверждение.                   -->
<template>
  <div class="rounded-xl bg-slate-100 dark:bg-slate-800/50 p-3 sm:px-4 sm:py-3">

    <!-- ─── Шаг 1: список свободных игроков ─── -->
    <template v-if="!open">

      <!-- Заголовок -->
      <span class="text-sm font-medium text-slate-600 dark:text-slate-300">
        <template v-if="freePlayers.length > 0">
          Свободные игроки
          <span class="ml-1 rounded bg-slate-200 dark:bg-slate-700/80 px-1.5 py-0.5 text-xs tabular-nums text-slate-600 dark:text-slate-400">
            {{ freePlayers.length }}
          </span>
        </template>
        <template v-else>
          <span class="text-slate-600 dark:text-slate-500">Все игроки распределены</span>
        </template>
      </span>

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

      <!-- Кнопка-триггер — под игроками, во всю ширину.
           В светлой теме: насыщенный зелёный текст на слабом зелёном фоне — контраст достаточный.
           В тёмной теме: text-emerald-300 как раньше. -->
      <button
        type="button"
        :disabled="freePlayers.length === 0"
        title="Автоматически распределить по рейтингу"
        class="flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold
               transition-colors
               border-emerald-600/50 bg-emerald-50 text-emerald-700
               hover:border-emerald-600 hover:bg-emerald-100 hover:text-emerald-800
               active:bg-emerald-200
               dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-300
               dark:hover:border-emerald-500 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-200
               dark:active:bg-emerald-500/30
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50
               disabled:cursor-not-allowed disabled:opacity-40"
        @click="open = true"
      >
        <span aria-hidden="true" class="text-base leading-none">⚡</span>
        По рейтингу
      </button>
    </template>

    <!-- ─── Шаг 2: выбор количества команд ─── -->
    <template v-else>
      <p class="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">На сколько команд делим?</p>

      <!-- Три карточки 2 / 3 / 4 — всегда 3 колонки, на мобиле чуть меньше паддинг -->
      <div class="mb-3 grid grid-cols-3 gap-2" role="group" aria-label="Количество команд">
        <button
          v-for="n in [2, 3, 4]"
          :key="n"
          type="button"
          class="flex flex-col items-center gap-0.5 rounded-xl border py-3 transition-colors
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          :class="
            modelValue === n
              ? 'border-emerald-500/60 bg-emerald-500/10'
              : 'border-slate-300 dark:border-slate-700/60 bg-white dark:bg-slate-900/40 md:hover:border-slate-400 dark:md:hover:border-slate-600 md:hover:bg-slate-50 dark:md:hover:bg-slate-800/60'
          "
          :aria-pressed="modelValue === n"
          @click="emit('update:modelValue', n)"
        >
          <!-- Цифра -->
          <span
            class="text-2xl font-bold leading-none"
            :class="modelValue === n ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'"
          >
            {{ n }}
          </span>
          <!-- ~N игр/к — не переносится, уменьшается вместе с экраном -->
          <span class="mt-0.5 text-[11px] font-normal text-slate-600 dark:text-slate-400">
            ~{{ Math.ceil(freePlayers.length / n) }}&nbsp;игр/к
          </span>
        </button>
      </div>

      <!-- Кнопки: Отмена + Распределить — во всю ширину, стек на очень узких -->
      <div class="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          class="min-h-[2.75rem] flex-1 rounded-xl border border-slate-300 dark:border-slate-700/60 px-4 text-sm font-medium text-slate-600 dark:text-slate-400
                 transition-colors md:hover:border-slate-400 dark:md:hover:border-slate-600 md:hover:text-slate-700 dark:md:hover:text-slate-200
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40"
          @click="open = false"
        >
          Отмена
        </button>

        <button
          type="button"
          class="min-h-[2.75rem] flex-[2] rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white dark:text-slate-900
                 transition-colors md:hover:bg-emerald-400 active:bg-emerald-600
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          @click="onConfirm"
        >
          <!-- На узком экране текст короче -->
          <span class="sm:hidden">Распределить ({{ modelValue }})</span>
          <span class="hidden sm:inline">Распределить на {{ modelValue }}</span>
        </button>
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
