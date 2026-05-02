import { onUnmounted, ref } from 'vue'

/**
 * Обратный отсчёт для confirm-кнопок: после start() секунды убывают до 0,
 * затем интервал автоматически очищается. На размонтировании таймер всегда снимается.
 * Используется в панелях подтверждения (Удалить / Reset / Завершить турнир / …).
 */
export function useConfirmCountdown(initialSeconds = 3) {
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