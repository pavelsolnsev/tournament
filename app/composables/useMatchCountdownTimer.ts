import { computed, watch } from 'vue'

/** Доступные длительности таймера матча (в минутах). */
export const MATCH_TIMER_MINUTE_OPTIONS = [2, 5, 6, 7, 8, 9, 10, 30, 45, 60] as const

const ALLOWED_MINUTES = new Set<number>(MATCH_TIMER_MINUTE_OPTIONS)

// Singleton-интервал на уровне модуля: живёт независимо от монтирования компонента,
// поэтому таймер не сбрасывается при смене вкладок/переходе по крошкам и идёт до нуля.
let tickId: ReturnType<typeof setInterval> | null = null

/**
 * Обратный отсчёт для матча: выбор минут, старт/пауза/сброс.
 * Состояние в useState (общее и переживает навигацию), отсчёт привязан к реальному времени
 * (endsAt), а тикающий интервал — singleton модуля. Сбросить/остановить можно только кнопками.
 */
export function useMatchCountdownTimer() {
  // Минуты, остаток, флаг хода и момент окончания — в useState: при уходе со шага и возврате не сбрасываются.
  const selectedMinutes = useState<number>('match-timer-selected-minutes', () => 6)
  if (!ALLOWED_MINUTES.has(selectedMinutes.value)) {
    selectedMinutes.value = 6
  }

  // Сколько секунд осталось до нуля (показываем на экране).
  const remainingSeconds = useState<number>('match-timer-remaining', () => selectedMinutes.value * 60)
  // Идёт ли отсчёт прямо сейчас (кнопка «Стоп» это выключает).
  const isRunning = useState<boolean>('match-timer-is-running', () => false)
  // Epoch-время (мс), когда таймер дойдёт до нуля. Источник истины пока isRunning=true.
  const endsAt = useState<number>('match-timer-ends-at', () => 0)
  // Счётчик «пульса»: растёт в момент пересечения отметки «осталась минута».
  const oneMinuteCue = useState<number>('match-timer-one-minute-cue', () => 0)
  // Счётчик окончания: таймер дошёл до нуля — показываем финальное уведомление.
  const timerEndedCue = useState<number>('match-timer-ended-cue', () => 0)

  // Остаток по часам: пока идёт — считаем от endsAt; на паузе/стопе — замороженное значение.
  function computeRemaining() {
    if (isRunning.value && endsAt.value > 0) {
      return Math.max(0, Math.round((endsAt.value - Date.now()) / 1000))
    }
    return Math.max(0, remainingSeconds.value)
  }

  // Убираем интервал (после стопа/сброса/окончания).
  function clearTick() {
    if (tickId !== null) {
      clearInterval(tickId)
      tickId = null
    }
  }

  // Один «тик»: пересчитываем остаток от реального времени и ловим отметки минуты/конца.
  function onTick() {
    const before = remainingSeconds.value
    const left = computeRemaining()
    remainingSeconds.value = left
    // Пересекли «осталась минута» — устойчиво к пропуску секунд в фоновой вкладке.
    if (before > 60 && left <= 60 && left > 0) {
      oneMinuteCue.value += 1
    }
    if (left <= 0) {
      remainingSeconds.value = 0
      isRunning.value = false
      endsAt.value = 0
      clearTick()
      timerEndedCue.value += 1
    }
  }

  // Поднять интервал, если таймер идёт (только на клиенте; singleton — без дублей).
  function ensureTick() {
    if (!import.meta.client) return
    if (!isRunning.value) return
    if (tickId !== null) return
    tickId = setInterval(onTick, 250)
  }

  // Ставит остаток ровно на выбранные минуты — «полный» таймер после сброса.
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

  // Запуск: если время вышло — начинаем с выбранных минут; иначе продолжаем с паузы.
  function start() {
    let base = computeRemaining()
    if (base <= 0) {
      base = selectedMinutes.value * 60
    }
    endsAt.value = Date.now() + base * 1000
    remainingSeconds.value = base
    isRunning.value = true
    clearTick()
    ensureTick()
  }

  // Пауза: замораживаем текущий остаток, останавливаем интервал.
  function stop() {
    remainingSeconds.value = computeRemaining()
    isRunning.value = false
    endsAt.value = 0
    clearTick()
  }

  // Сброс: стоп + вернуть полное время по текущему выбору минут.
  function reset() {
    isRunning.value = false
    endsAt.value = 0
    clearTick()
    syncRemainingToSelection()
  }

  // При (повторном) монтировании компонента — догоняем остаток по часам и поднимаем тик, если идёт.
  // Интервал НЕ глушим в onUnmounted: таймер должен продолжать идти при навигации по сайту.
  if (import.meta.client) {
    remainingSeconds.value = computeRemaining()
    ensureTick()
  }

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
