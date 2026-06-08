// Звуковой бип + вибрация для таймера матча, с повтором в течение нескольких секунд.
// Звук работает и на iPhone, и на Android; вибрация — только Android (iOS Safari её не поддерживает).
// iOS разрешает звук только после жеста пользователя — поэтому unlock() вызываем по тапу «Старт».
export function useMatchTimerAlert() {
  let audioCtx: AudioContext | null = null
  // Таймеры повтора и авто-остановки — храним, чтобы можно было прервать сигнал.
  let repeatTimer: ReturnType<typeof setInterval> | null = null
  let stopTimer: ReturnType<typeof setTimeout> | null = null

  // Создаём AudioContext лениво и только на клиенте (на сервере window нет).
  function getCtx(): AudioContext | null {
    if (!import.meta.client) return null
    if (!audioCtx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      audioCtx = new AC()
    }
    return audioCtx
  }

  // Разблокировка звука по жесту: без этого iOS не даст играть бип позже (по таймеру).
  function unlock() {
    const c = getCtx()
    if (c && c.state === 'suspended') void c.resume()
  }

  // Один короткий бип частоты freq, начинается через offsetSec секунд от текущего момента.
  function beep(freq: number, durationMs: number, offsetSec: number, volume: number) {
    const c = getCtx()
    if (!c) return
    const t0 = c.currentTime + offsetSec
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    // Плавный вход/выход громкости — иначе слышен щелчок на старте и в конце бипа.
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durationMs / 1000)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t0)
    osc.stop(t0 + durationMs / 1000 + 0.02)
  }

  // Вибрация: на iPhone API нет — тихо игнорируем, на Android сработает. vibrate(0) — отмена.
  function vibrate(pattern: number | number[]) {
    if (!import.meta.client) return
    const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }
    if (typeof nav.vibrate === 'function') {
      try {
        nav.vibrate(pattern)
      } catch {
        // Неподдерживаемая платформа — не критично.
      }
    }
  }

  // Останавливает текущий повторяющийся сигнал: гасит повтор, авто-стоп и вибрацию.
  function stop() {
    if (repeatTimer !== null) {
      clearInterval(repeatTimer)
      repeatTimer = null
    }
    if (stopTimer !== null) {
      clearTimeout(stopTimer)
      stopTimer = null
    }
    vibrate(0)
  }

  // Повторяет один «такт» сигнала каждые intervalMs в течение durationMs, затем сам останавливается.
  function repeatFor(playOnce: () => void, intervalMs: number, durationMs: number) {
    stop()
    const c = getCtx()
    if (c && c.state === 'suspended') void c.resume()
    playOnce()
    repeatTimer = setInterval(playOnce, intervalMs)
    stopTimer = setTimeout(stop, durationMs)
  }

  // Один такт «осталась минута»: два высоких бипа + короткая двойная вибрация.
  function oneMinuteTick() {
    beep(880, 180, 0, 0.8)
    beep(880, 180, 0.28, 0.8)
    vibrate([200, 120, 200])
  }

  // Один такт «время вышло»: три бипа с понижением тона + длинная вибрация.
  function endedTick() {
    beep(680, 260, 0, 0.9)
    beep(680, 260, 0.32, 0.9)
    beep(523, 500, 0.64, 0.9)
    vibrate([400, 150, 400, 150, 500])
  }

  // Сигнал «осталась 1 минута»: повтор каждые 1.5 с в течение ~5 с — успеть услышать.
  function signalOneMinute() {
    repeatFor(oneMinuteTick, 1500, 5000)
  }

  // Сигнал «время вышло»: повтор каждые 1.5 с в течение ~5 с — успеть услышать.
  function signalTimerEnded() {
    repeatFor(endedTick, 1500, 5000)
  }

  return { unlock, stop, signalOneMinute, signalTimerEnded }
}
