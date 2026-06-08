<template>
  <!-- Тост сверху: заметно, но не закрывает весь экран; исчезает сам или по крестику. -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-1 opacity-0"
    >
      <div
        v-if="timerEndedToastVisible"
        class="pointer-events-auto fixed left-1/2 top-[max(4.5rem,env(safe-area-inset-top)+3.5rem)] z-[46] flex w-[min(calc(100vw-1rem),22rem)] -translate-x-1/2 items-start gap-2 rounded-xl border border-emerald-500/75 bg-emerald-50 px-3 py-2.5 shadow-lg dark:border-emerald-500/50 dark:bg-emerald-950/90"
        role="alert"
        aria-live="assertive"
      >
        <span
          class="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/25 text-emerald-800 dark:text-emerald-200"
          aria-hidden="true"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <div class="min-w-0 flex-1 pt-0.5">
          <p class="text-sm font-semibold text-emerald-950 dark:text-emerald-100">
            Время вышло
          </p>
          <p class="mt-0.5 text-xs text-emerald-900/85 dark:text-emerald-200/90">
            Таймер остановлен. При необходимости нажмите «Сброс» или «Старт», чтобы начать заново.
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-lg p-1 text-emerald-800/80 transition-colors hover:bg-emerald-200/60 hover:text-emerald-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-200 dark:hover:bg-emerald-800/60 dark:hover:text-emerald-50"
          title="Закрыть"
          aria-label="Закрыть уведомление"
          @click="dismissTimerEndedToast"
        >
          <span class="block text-lg leading-none" aria-hidden="true">×</span>
        </button>
      </div>
    </Transition>
  </Teleport>

  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-1 opacity-0"
    >
      <div
        v-if="oneMinuteToastVisible"
        class="pointer-events-auto fixed left-1/2 top-[max(4.5rem,env(safe-area-inset-top)+3.5rem)] z-[45] flex w-[min(calc(100vw-1rem),22rem)] -translate-x-1/2 items-start gap-2 rounded-xl border border-amber-400/80 bg-amber-50 px-3 py-2.5 shadow-lg dark:border-amber-500/50 dark:bg-amber-950/90"
        role="status"
        aria-live="assertive"
      >
        <span
          class="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/25 text-amber-800 dark:text-amber-200"
          aria-hidden="true"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </span>
        <div class="min-w-0 flex-1 pt-0.5">
          <p class="text-sm font-semibold text-amber-950 dark:text-amber-100">
            Осталась 1 минута
          </p>
          <p class="mt-0.5 text-xs text-amber-900/80 dark:text-amber-200/90">
            До конца таймера минута — успейте зафиксировать события.
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-lg p-1 text-amber-800/80 transition-colors hover:bg-amber-200/60 hover:text-amber-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-200 dark:hover:bg-amber-800/60 dark:hover:text-amber-50"
          title="Закрыть"
          aria-label="Закрыть напоминание"
          @click="dismissOneMinuteToast"
        >
          <span class="block text-lg leading-none" aria-hidden="true">×</span>
        </button>
      </div>
    </Transition>
  </Teleport>

  <!-- Панель «прилипает» к низу окна: удобно видеть время при отметке голов. -->
  <Teleport to="body">
    <div
      v-if="!isCollapsed"
      class="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1"
      role="region"
      aria-label="Таймер матча"
    >
      <div
        class="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl border border-slate-200/90 bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur-sm dark:border-slate-600/80 dark:bg-slate-900/95 sm:gap-x-2.5 sm:px-3"
      >
        <!-- Крупное время — главное, что смотрит ведущий. -->
        <span
          class="min-w-[3.25rem] tabular-nums text-sm font-bold text-slate-800 dark:text-slate-100 sm:text-base"
          aria-live="polite"
        >
          {{ displayLabel }}
        </span>

        <!-- Выбор длительности: сколько минут длится таймер после сброса/старта с нуля. -->
        <label class="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">
          <span class="whitespace-nowrap">Мин</span>
          <select
            v-model.number="selectedMinutes"
            class="h-7 max-w-[4.5rem] rounded-lg border border-slate-300 bg-white px-1 text-xs text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            :disabled="isRunning"
            title="Длительность таймера в минутах"
          >
            <option v-for="m in minuteOptions" :key="m" :value="m">
              {{ m }}
            </option>
          </select>
        </label>

        <!-- Старт — запускаем или продолжаем после паузы. -->
        <AtomsPrimaryButton
          variant="solid"
          size="sm"
          class="!h-8 !min-h-0 !px-2.5 !text-[11px] sm:!text-xs"
          :disabled="isRunning"
          title="Запустить или продолжить отсчёт"
          @click="handleStart"
        >
          Старт
        </AtomsPrimaryButton>

        <!-- Стоп — пауза; красный цвет = «остановить», не путать со стартом. -->
        <button
          type="button"
          class="inline-flex h-8 items-center justify-center rounded-xl border border-red-600/90 bg-red-600 px-2.5 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 disabled:cursor-not-allowed disabled:opacity-45 dark:border-red-500 dark:bg-red-600 dark:hover:bg-red-500 sm:px-3 sm:text-xs"
          :disabled="!isRunning"
          title="Приостановить отсчёт"
          @click="handleStop"
        >
          Стоп
        </button>

        <!-- Сброс — вернуться к полным выбранным минутам. -->
        <AtomsPrimaryButton
          variant="muted"
          size="sm"
          class="!h-8 !min-h-0 !px-2.5 !text-[11px] sm:!text-xs"
          title="Сбросить на выбранное число минут"
          @click="handleReset"
        >
          Сброс
        </AtomsPrimaryButton>

        <!-- Звук сигнала вкл/выкл — бип и вибрация на «1 минута» и «время вышло». -->
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          :class="soundOn
            ? 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'"
          :title="soundOn ? 'Сигнал включён — нажмите, чтобы выключить' : 'Сигнал выключен — нажмите, чтобы включить'"
          :aria-label="soundOn ? 'Выключить звук сигнала' : 'Включить звук сигнала'"
          :aria-pressed="soundOn"
          @click="toggleSound"
        >
          <svg v-if="soundOn" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </svg>
          <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <path d="m23 9-6 6" />
            <path d="m17 9 6 6" />
          </svg>
        </button>

        <!-- Свернуть — прячет управление, оставляет только время. -->
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Свернуть таймер"
          aria-label="Свернуть таймер"
          @click="isCollapsed = true"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useMatchCountdownTimer } from '~/composables/useMatchCountdownTimer'
import { useMatchTimerAlert } from '~/composables/useMatchTimerAlert'

// Состояние свёрнутости: useState сохраняет значение при навигации между шагами.
const isCollapsed = useState<boolean>('match-timer-bar-collapsed', () => false)

// Звук+вибрация сигналов вкл/выкл — useState сохраняет выбор между шагами.
const soundOn = useState<boolean>('match-timer-sound-on', () => true)

// Сигналы (бип + вибрация) для «осталась минута» и «время вышло».
const timerAlert = useMatchTimerAlert()

// Вся логика секунд и интервала вынесена в composable — здесь только разметка.
const {
  minuteOptions,
  selectedMinutes,
  isRunning,
  displayLabel,
  oneMinuteCue,
  timerEndedCue,
  start,
  stop,
  reset,
} = useMatchCountdownTimer()

// Старт по кнопке: глушим прошлый сигнал, разблокируем звук (жест нужен для iOS), запускаем.
function handleStart() {
  timerAlert.stop()
  timerAlert.unlock()
  start()
}

// Стоп/Сброс — заодно глушим звуковой сигнал, если он сейчас звучит.
function handleStop() {
  timerAlert.stop()
  stop()
}

function handleReset() {
  timerAlert.stop()
  reset()
}

// Переключатель звука: включаем — бип-подтверждение; выключаем — глушим текущий сигнал.
function toggleSound() {
  soundOn.value = !soundOn.value
  if (soundOn.value) {
    timerAlert.unlock()
    timerAlert.signalOneMinute()
  } else {
    timerAlert.stop()
  }
}

// Показываем тост при сигнале из composable (рост oneMinuteCue).
const oneMinuteToastVisible = ref(false)
let oneMinuteToastTimer: ReturnType<typeof setTimeout> | null = null

// Тост «время вышло» — выше по z-index, при показе убираем жёлтый тост, чтобы не дублировать.
const timerEndedToastVisible = ref(false)
let timerEndedToastTimer: ReturnType<typeof setTimeout> | null = null

function dismissOneMinuteToast() {
  oneMinuteToastVisible.value = false
  if (oneMinuteToastTimer !== null) {
    clearTimeout(oneMinuteToastTimer)
    oneMinuteToastTimer = null
  }
}

function dismissTimerEndedToast() {
  timerEndedToastVisible.value = false
  // Закрытие тоста «время вышло» глушит и повторяющийся звук.
  timerAlert.stop()
  if (timerEndedToastTimer !== null) {
    clearTimeout(timerEndedToastTimer)
    timerEndedToastTimer = null
  }
}

watch(oneMinuteCue, () => {
  if (oneMinuteCue.value < 1) {
    return
  }
  // Бип + вибрация (если сигналы включены) — предупреждаем о последней минуте.
  if (soundOn.value) {
    timerAlert.signalOneMinute()
  }
  oneMinuteToastVisible.value = true
  if (oneMinuteToastTimer !== null) {
    clearTimeout(oneMinuteToastTimer)
  }
  // Прячем напоминание через 8 с, если ведущий не закрыл сам.
  oneMinuteToastTimer = setTimeout(() => {
    oneMinuteToastVisible.value = false
    oneMinuteToastTimer = null
  }, 8000)
})

watch(timerEndedCue, () => {
  if (timerEndedCue.value < 1) {
    return
  }
  // Финальный сигнал — бип + длинная вибрация (если включено).
  if (soundOn.value) {
    timerAlert.signalTimerEnded()
  }
  dismissOneMinuteToast()
  timerEndedToastVisible.value = true
  if (timerEndedToastTimer !== null) {
    clearTimeout(timerEndedToastTimer)
  }
  timerEndedToastTimer = setTimeout(() => {
    timerEndedToastVisible.value = false
    timerEndedToastTimer = null
  }, 10000)
})

onBeforeUnmount(() => {
  timerAlert.stop()
  if (oneMinuteToastTimer !== null) {
    clearTimeout(oneMinuteToastTimer)
  }
  if (timerEndedToastTimer !== null) {
    clearTimeout(timerEndedToastTimer)
  }
})
</script>
