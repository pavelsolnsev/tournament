import { computed, onUnmounted, ref, watch } from 'vue'

/** Доступные длительности таймера матча (в минутах). */
export const MATCH_TIMER_MINUTE_OPTIONS = [2, 5, 6, 7, 8, 9, 10, 30, 45, 60] as const

const ALLOWED_MINUTES = new Set<number>(MATCH_TIMER_MINUTE_OPTIONS)

/**
 * Обратный отсчёт для матча: выбор минут, старт/пауза/сброс.
 * Без async — только refs, setInterval и методы (удобно вызывать из компонента).
 */
export function useMatchCountdownTimer() {
  // Минуты живут в useState — при уходе со шага и возврате прежнее значение не сбрасывается на 10.
  const selectedMinutes = useState<number>('match-timer-selected-minutes', () => 6)
  if (!ALLOWED_MINUTES.has(selectedMinutes.value)) {
    selectedMinutes.value = 6
  }

  // Сколько секунд осталось до нуля (показываем на экране).
  const remainingSeconds = ref(selectedMinutes.value * 60)
  // Идёт ли отсчёт прямо сейчас (кнопка «Стоп» это выключает).
  const isRunning = ref(false)
  // Счётчик «пульса»: увеличиваем ровно в момент перехода 61 с → 60 с (осталась1 минута).
  const oneMinuteCue = ref(0)
  // Счётчик окончания: таймер дошёл до нуля — показываем финальное уведомление.
  const timerEndedCue = ref(0)

  let tickId: ReturnType<typeof setInterval> | null = null

  // Убираем интервал, чтобы не крутился фоном после стопа или размонтирования.
  function clearTick() {
    if (tickId !== null) {
      clearInterval(tickId)
      tickId = null
    }
  }

  // Ставим остаток ровно на выбранные минуты — это «полный» таймер после сброса.
  function syncRemainingToSelection() {
    remainingSeconds.value = selectedMinutes.value * 60
  }

  // Если меняем минуты в паузе — сразу пересчитываем остаток, чтобы цифры совпадали с выбором.
  watch(selectedMinutes, () => {
    if (!isRunning.value) {
      syncRemainingToSelection()
    }
  })

  // Текст вида 09:59 для экрана и скринридеров.
  const displayLabel = computed(() => {
    const total = Math.max(0, remainingSeconds.value)
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })

  // Запуск: если время вышло — начинаем снова с выбранных минут; иначе продолжаем с паузы.
  function start() {
    if (remainingSeconds.value <= 0) {
      syncRemainingToSelection()
    }
    if (tickId !== null) {
      return
    }
    isRunning.value = true
    tickId = setInterval(() => {
      if (remainingSeconds.value <= 1) {
        remainingSeconds.value = 0
        clearTick()
        isRunning.value = false
        timerEndedCue.value += 1
        return
      }
      // Запоминаем значение до тика — нужно пойти ровно с 61 на 60 секунд.
      const beforeTick = remainingSeconds.value
      remainingSeconds.value -= 1
      if (beforeTick === 61 && remainingSeconds.value === 60) {
        oneMinuteCue.value += 1
      }
    }, 1000)
  }

  // Пауза: секунды не трогаем, только останавливаем интервал.
  function stop() {
    clearTick()
    isRunning.value = false
  }

  // Сброс: стоп + вернуть полное время по текущему выбору минут.
  function reset() {
    clearTick()
    isRunning.value = false
    syncRemainingToSelection()
  }

  onUnmounted(() => {
    clearTick()
  })

  return {
    minuteOptions: MATCH_TIMER_MINUTE_OPTIONS,
    selectedMinutes,
    remainingSeconds,
    isRunning,
    displayLabel,
    oneMinuteCue,
    timerEndedCue,
    start,
    stop,
    reset,
  }
}
