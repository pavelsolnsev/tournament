/** Дефолтные слоты даты/времени для пресетов ВК (логика как в vk-bot: Europe/Moscow). */

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function moscowTodayYmd(): { y: number; m: number; d: number } {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const [ys, ms, ds] = s.split('-')
  return { y: Number(ys), m: Number(ms), d: Number(ds) }
}

function addCalendarDays(y: number, m: number, d: number, delta: number) {
  const t = new Date(Date.UTC(y, m - 1, d + delta))
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }
}

function moscowWeekdayJs(y: number, m: number, d: number) {
  return new Date(`${y}-${pad2(m)}-${pad2(d)}T12:00:00+03:00`).getUTCDay()
}

/**
 * Ближайшее будущее: день недели wantJsDay (0=вс … 6=сб), час и минута по Москве.
 * Возвращает date ISO YYYY-MM-DD и время HH:mm для input type=date/time.
 */
export function nextMoscowOccurrenceIso(wantJsDay: number, hour: number, minute: number): {
  dateIso: string
  time: string
} {
  const start = moscowTodayYmd()
  for (let i = 0; i < 14; i += 1) {
    const { y, m, d } = addCalendarDays(start.y, start.m, start.d, i)
    if (moscowWeekdayJs(y, m, d) !== wantJsDay) continue
    const candidate = new Date(`${y}-${pad2(m)}-${pad2(d)}T${pad2(hour)}:${pad2(minute)}:00+03:00`)
    if (candidate.getTime() > Date.now()) {
      return {
        dateIso: `${y}-${pad2(m)}-${pad2(d)}`,
        time: `${pad2(hour)}:${pad2(minute)}`,
      }
    }
  }
  const { y, m, d } = addCalendarDays(start.y, start.m, start.d, 0)
  return {
    dateIso: `${y}-${pad2(m)}-${pad2(d)}`,
    time: `${pad2(hour)}:${pad2(minute)}`,
  }
}

/** Профилакторий: ближайший пн 20:00 МСК. */
export function defaultProfDateTime() {
  return nextMoscowOccurrenceIso(1, 20, 0)
}

/** Турнир: ближайшая пт 20:00 МСК. */
export function defaultTrDateTime() {
  return nextMoscowOccurrenceIso(5, 20, 0)
}
