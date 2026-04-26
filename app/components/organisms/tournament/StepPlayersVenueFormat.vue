<template>
  <AtomsTournamentPanel
    as="section"
    root-class="min-w-0 w-full max-w-full overflow-x-hidden"
  >
    <p class="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">
      Дата, место и формат
    </p>

    <!-- Поле «Дата проведения» — по умолчанию сегодня -->
    <div class="flex min-w-0 w-full flex-col gap-1.5">
      <label
        :for="dateInputId"
        class="text-xs font-medium text-slate-600 dark:text-slate-400"
      >
        Дата проведения
      </label>
      <!--
        iOS не рисует системную иконку календаря как десктоп — ставим свою SVG справа.
        Индикатор WebKit делаем прозрачным на всю высоту справа, клики по «иконке» всё равно попадают в него где он есть.
        Рамку вешаем на обёртку + overflow-hidden — иначе нативная отрисовка даты на iPhone может вылезать за 100% ширины.
      -->
      <div
        data-app-date
        class="relative min-w-0 w-full max-w-full overflow-hidden rounded-lg border border-slate-300 bg-white transition-colors hover:border-slate-400 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-slate-700/60 dark:bg-slate-800/40 dark:hover:border-slate-600 dark:focus-within:border-emerald-500/50 dark:focus-within:ring-emerald-500/25"
      >
        <input
          :id="dateInputId"
          type="date"
          :value="tournamentDate"
          class="box-border flex min-h-[2.75rem] w-full min-w-0 max-w-full cursor-pointer items-center border-0 bg-transparent py-2 pl-3 pr-11 text-left text-sm font-medium tabular-nums leading-normal text-slate-800 shadow-none outline-none ring-0 focus:border-transparent focus:outline-none focus:ring-0 dark:text-slate-100 dark:scheme-dark scheme-light
                 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-11 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
          @input="emit('update:tournamentDate', ($event.target as HTMLInputElement).value)"
        />
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

    <div class="border-t border-slate-200 dark:border-slate-700/40" />

    <!-- Поле «Место проведения» -->
    <div class="flex min-w-0 w-full flex-col gap-1.5">
      <label
        :for="venueInputId"
        class="text-xs font-medium text-slate-600 dark:text-slate-400"
      >
        Место проведения
      </label>

      <!-- Список готовых вариантов — кнопки-чипы -->
      <div class="flex min-w-0 flex-wrap gap-1.5">
        <button
          v-for="option in VENUE_OPTIONS"
          :key="option"
          type="button"
          class="inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          :class="venueLabel === option
            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
            : 'border-slate-300 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600'"
          @click="selectVenue(option)"
        >
          {{ option }}
        </button>
      </div>

      <!-- Своё значение — ввод вручную -->
      <input
        :id="venueInputId"
        type="text"
        :value="venueLabel"
        placeholder="Или введите своё…"
        class="box-border block w-full max-w-full min-w-0 rounded-lg border border-slate-300 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 transition-colors focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        @input="emit('update:venueLabel', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="border-t border-slate-200 dark:border-slate-700/40" />

    <!-- Поле «Формат» -->
    <div class="flex min-w-0 w-full flex-col gap-1.5">
      <label
        :for="formatInputId"
        class="text-xs font-medium text-slate-600 dark:text-slate-400"
      >
        Формат
      </label>

      <!-- Список готовых вариантов -->
      <div class="flex min-w-0 flex-wrap gap-1.5">
        <button
          v-for="option in FORMAT_OPTIONS"
          :key="option"
          type="button"
          class="inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          :class="formatLabel === option
            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
            : 'border-slate-300 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600'"
          @click="selectFormat(option)"
        >
          {{ option }}
        </button>
      </div>

      <!-- Своё значение — ввод вручную -->
      <input
        :id="formatInputId"
        type="text"
        :value="formatLabel"
        placeholder="Или введите своё…"
        class="box-border block w-full max-w-full min-w-0 rounded-lg border border-slate-300 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 transition-colors focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        @input="emit('update:formatLabel', ($event.target as HTMLInputElement).value)"
      />
    </div>
  </AtomsTournamentPanel>
</template>

<script setup lang="ts">
// Готовые варианты мест проведения — можно выбрать или ввести своё.
const VENUE_OPTIONS = ['Красное Знамя', 'Профилакторий'] as const

// Готовые варианты форматов — можно выбрать или ввести своё.
const FORMAT_OPTIONS = ['Рейтинговая игра 5x5', 'Турнир 8x8'] as const

const props = defineProps<{
  venueLabel: string
  formatLabel: string
  tournamentDate: string
}>()

const emit = defineEmits<{
  'update:venueLabel': [value: string]
  'update:formatLabel': [value: string]
  'update:tournamentDate': [value: string]
}>()

const uid = useId?.() ?? Math.random().toString(36).slice(2)
const venueInputId = `venue-input-${uid}`
const formatInputId = `format-input-${uid}`
const dateInputId = `date-input-${uid}`

// Если дата не передана — подставляем сегодняшнюю дату при монтировании.
onMounted(() => {
  if (!props.tournamentDate) {
    emit('update:tournamentDate', new Date().toISOString().slice(0, 10))
  }
})

// Клик на чип — если уже выбран, снимаем выбор; иначе выбираем.
function selectVenue(option: string) {
  emit('update:venueLabel', props.venueLabel === option ? '' : option)
}

function selectFormat(option: string) {
  emit('update:formatLabel', props.formatLabel === option ? '' : option)
}
</script>
