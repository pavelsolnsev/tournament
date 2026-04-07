<template>
  <AtomsTournamentPanel as="section">
    <p class="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">
      Дата, место и формат
    </p>

    <!-- Поле «Дата проведения» — по умолчанию сегодня -->
    <div class="flex flex-col gap-1.5">
      <label
        :for="dateInputId"
        class="text-xs font-medium text-slate-600 dark:text-slate-400"
      >
        Дата проведения
      </label>
      <input
        :id="dateInputId"
        type="date"
        :value="tournamentDate"
        class="rounded-lg border border-slate-300 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 transition-colors focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        @input="emit('update:tournamentDate', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="border-t border-slate-200 dark:border-slate-700/40" />

    <!-- Поле «Место проведения» -->
    <div class="flex flex-col gap-1.5">
      <label
        :for="venueInputId"
        class="text-xs font-medium text-slate-600 dark:text-slate-400"
      >
        Место проведения
      </label>

      <!-- Список готовых вариантов — кнопки-чипы -->
      <div class="flex flex-wrap gap-1.5">
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
        class="rounded-lg border border-slate-300 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 transition-colors focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        @input="emit('update:venueLabel', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="border-t border-slate-200 dark:border-slate-700/40" />

    <!-- Поле «Формат» -->
    <div class="flex flex-col gap-1.5">
      <label
        :for="formatInputId"
        class="text-xs font-medium text-slate-600 dark:text-slate-400"
      >
        Формат
      </label>

      <!-- Список готовых вариантов -->
      <div class="flex flex-wrap gap-1.5">
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
        class="rounded-lg border border-slate-300 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 transition-colors focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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

// Уникальные id для label/input — нужны для доступности.
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
