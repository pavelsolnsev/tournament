<!-- Сворачиваемый блок таблицы/составов/результатов — одинаковая разметка в StepStandings. -->
<template>
  <div
    class="overflow-hidden rounded-2xl border bg-slate-50 dark:bg-slate-900/60 transition-colors"
    :class="open ? 'border-slate-300 dark:border-slate-700/60' : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/50'"
  >
    <button
      :id="toggleId"
      type="button"
      class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors
             focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
      :class="open ? 'bg-slate-50 dark:bg-slate-800/80' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'"
      :aria-expanded="open"
      :aria-controls="panelId"
      @click="open = !open"
    >
      <div class="min-w-0 flex-1">
        <span class="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          {{ title }}
          <span
            class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            :class="open ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'"
          >
            {{ open ? 'Открыт' : 'Скрыт' }}
          </span>
        </span>
        <span
          v-if="subtitle"
          class="mt-0.5 block truncate text-xs text-slate-600 dark:text-slate-500"
        >
          {{ subtitle }}
        </span>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <span
          v-if="countBadge != null && countBadge > 0"
          class="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-400"
        >
          {{ countBadge }}
        </span>
        <svg
          class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 dark:text-slate-400"
          :class="open && 'rotate-180'"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
    </button>

    <Transition
      enter-active-class="transition-all duration-200 ease-out overflow-hidden"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-[120rem] opacity-100"
      leave-active-class="transition-all duration-150 ease-in overflow-hidden"
      leave-from-class="max-h-[120rem] opacity-100"
      leave-to-class="max-h-0 opacity-0"
      @after-enter="scrollExpandedPanelIntoView"
    >
      <div
        v-if="open"
        :id="panelId"
        role="region"
        :aria-labelledby="toggleId"
        :class="panelContentClass"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { scrollExpandedPanelIntoView } from '~/utils/scrollExpandedPanelIntoView'

defineProps<{
  title: string
  subtitle?: string
  toggleId: string
  panelId: string
  /** Число в круге (например количество матчей) — только для блока «Результаты». */
  countBadge?: number
  /** Доп. класс на контейнер панели (отступ сверху у таблицы и составов). */
  panelContentClass?: string
}>()

const open = defineModel<boolean>({ required: true })
</script>
