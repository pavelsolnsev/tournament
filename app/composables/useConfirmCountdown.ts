import { onUnmounted, ref } from 'vue'

/**
 * Обратный отсчёт для confirm-кнопок: после start() секунды убывают до 0,
 * затем интервал автоматически очищается. На размонтировании таймер всегда снимается.
 * Используется в панелях подтверждения (Удалить / Reset / Завершить турнир / …).
 *
 * По умолчанию задержки нет (initialSeconds = 0): кнопка подтверждения доступна сразу.
 * Двухшаговое подтверждение остаётся, но без ожидания 3 секунд.
 */
export function useConfirmCountdown(initialSeconds = 0) {
  const secondsLeft = ref(0)
  let intervalId: ReturnType<typeof setInterval> | null = null

  function clear() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function start() {
    clear()
    // Нет задержки — сразу 0, интервал не запускаем (кнопка подтверждения активна мгновенно).
    if (initialSeconds <= 0) {
      secondsLeft.value = 0
      return
    }
    secondsLeft.value = initialSeconds
    intervalId = setInterval(() => {
      secondsLeft.value = Math.max(0, secondsLeft.value - 1)
      if (secondsLeft.value === 0) clear()
    }, 1000)
  }

  function stop() {
    clear()
    secondsLeft.value = 0
  }

  onUnmounted(clear)

  return { secondsLeft, start, stop }
}