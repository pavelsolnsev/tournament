<template>
  <li
    class="min-h-11 rounded-xl border border-slate-200 bg-white dark:border-transparent dark:bg-slate-800/50 px-2 py-1 text-left transition sm:min-h-12 sm:px-3"
    :class="[
      rootClass,
      splitActions
        // На узких экранах переносим кнопки на 2-ю строку, чтобы они никогда не «выпирали» за границы li (в т.ч. в Safari/Firefox).
        ? 'grid min-w-0 grid-cols-[auto,minmax(0,1fr),3.25rem] items-center gap-2 sm:gap-2.5 sm:py-1.5 sm:grid-cols-[auto,minmax(0,1fr),3.75rem,auto]'
        : 'flex items-center gap-2 sm:gap-2.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 md:hover:bg-slate-100 dark:md:hover:bg-slate-700/60 active:scale-[0.99]',
    ]"
    :role="splitActions ? 'listitem' : 'button'"
    :tabindex="splitActions ? undefined : 0"
    :title="splitActions ? undefined : title"
    @click="!splitActions && emit('activate')"
    @keydown.enter.prevent="!splitActions && emit('activate')"
    @keydown.space.prevent="!splitActions && emit('activate')"
  >
    <AtomsPlayerAvatar
      class="shrink-0 self-center"
      :photo="photo"
      :fallback-name="avatarFallbackName ?? label"
      size="sm"
    />
    <!-- В режиме splitActions держим строгие колонки: имя и рейтинг не должны сдвигать кнопки оплаты. -->
    <template v-if="splitActions">
      <span class="min-w-0 self-center truncate text-sm font-medium text-slate-800 dark:text-slate-100">
        {{ label }}
      </span>
      <span
        class="shrink-0 self-center w-[3.25rem] sm:w-[3.75rem] text-right whitespace-nowrap text-sm font-medium leading-tight text-slate-800 dark:text-slate-100 tabular-nums"
        aria-label="Рейтинг"
      >
        {{ rating ?? '' }}
      </span>
    </template>
    <template v-else>
      <span
        v-if="rating == null || rating === ''"
        class="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100"
      >{{ label }}</span>
      <span
        v-else
        class="flex min-w-0 flex-1 items-center gap-1 overflow-hidden"
      >
        <span class="min-w-0 truncate text-sm font-medium text-slate-800 dark:text-slate-100">{{ label }}</span>
        <span class="shrink-0 whitespace-nowrap text-sm font-medium leading-tight text-slate-800 dark:text-slate-100 tabular-nums">{{ rating }}</span>
      </span>
    </template>

    <!-- Выбранные в турнире: отдельные кнопки — не кликать по всей строке. -->
    <div
      v-if="splitActions"
      class="col-span-3 flex min-w-0 items-center justify-end gap-1 pt-1 sm:col-span-1 sm:pt-0 sm:self-stretch sm:border-l sm:border-slate-200/90 sm:pl-2 dark:sm:border-slate-600/70"
    >
      <button
        type="button"
        class="inline-flex min-h-9 min-w-[3.5rem] px-2 touch-manipulation items-center justify-center rounded-lg text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 sm:min-w-[5.25rem]"
        :class="playerPaid
          ? 'bg-emerald-500/20 text-emerald-900 ring-1 ring-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/35'
          : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800'"
        :aria-pressed="playerPaid"
        :aria-label="playerPaid ? 'Оплачено, нажми чтобы снять отметку' : 'Отметить оплату'"
        :title="playerPaid ? 'Снять отметку оплаты' : 'Отметить оплату'"
        @click.stop.prevent="emit('togglePaid')"
      >
        <span class="sm:hidden">{{ playerPaid ? 'Опл.' : '₽' }}</span>
        <span class="hidden sm:inline">{{ playerPaid ? 'Оплачено' : 'Оплата' }}</span>
      </button>
      <button
        type="button"
        class="inline-flex h-9 w-9 touch-manipulation items-center justify-center rounded-lg border border-slate-200 bg-white text-base font-light leading-none text-slate-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:border-red-500/50 dark:hover:bg-red-950/40 dark:hover:text-red-300"
        :title="title"
        :aria-label="title"
        @click.stop.prevent="emit('activate')"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>

    <template v-else>
      <button
        v-if="showPaidToggle"
        type="button"
        class="shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        :class="playerPaid
          ? 'border-emerald-500/70 bg-emerald-500/15 text-emerald-800 dark:border-emerald-400/50 dark:bg-emerald-500/10 dark:text-emerald-300'
          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:border-slate-500'"
        :aria-pressed="playerPaid"
        :title="playerPaid ? 'Оплачено — нажми, чтобы снять' : 'Отметить оплату'"
        @click.stop.prevent="emit('togglePaid')"
      >
        {{ playerPaid ? 'Опл.' : '₽' }}
      </button>
      <span
        v-if="action !== 'none'"
        class="shrink-0 select-none text-xs leading-none"
        :class="action === 'add' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-500'"
        aria-hidden="true"
      >
        {{ action === 'add' ? '+' : '×' }}
      </span>
    </template>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  title: string
  action: 'add' | 'remove' | 'none'
  rootClass?: string
  photo?: string | null
  avatarFallbackName?: string
  rating?: string | null
  showPaidToggle?: boolean
  playerPaid?: boolean
}>()

const splitActions = computed(
  () => props.showPaidToggle === true && props.action === 'remove',
)

const emit = defineEmits<{ activate: [], togglePaid: [] }>()
</script>
