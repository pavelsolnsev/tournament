// Время начала и сумма участия ближайшей игры — для афиши на главной у гостя.
// Их знает только форма «Создать матч» (бот хранит у себя), мастер турнира на сайте их не ведёт.
// Поэтому пишем их прямо в состояние турнира при создании матча, а обычные сохранения мастера
// (PUT без этих полей) их не стирают — см. keepUpcomingGameMeta.
import { queryWithRetry } from './db'

const TOURNAMENT_KEY = 'tournament'
const META_KEYS = ['tournamentTime', 'tournamentSum'] as const

/** Записать время (ЧЧ:ММ) и сумму в состояние турнира. Ошибка не должна мешать созданию матча. */
export async function saveUpcomingGameMeta(meta: { time: string | null; sum: number | null }): Promise<void> {
  const rows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [TOURNAMENT_KEY],
  )
  let state: Record<string, unknown> = {}
  try {
    const parsed = rows[0]?.value ? JSON.parse(rows[0].value) : {}
    if (parsed && typeof parsed === 'object') state = parsed as Record<string, unknown>
  } catch {
    state = {}
  }
  if (meta.time) state.tournamentTime = meta.time
  else Reflect.deleteProperty(state, 'tournamentTime')
  if (meta.sum != null) state.tournamentSum = meta.sum
  else Reflect.deleteProperty(state, 'tournamentSum')

  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [TOURNAMENT_KEY, JSON.stringify(state)],
  )
}

/** Мутирует next: если в теле PUT нет времени/суммы — берём их из БД (мастер их не присылает). */
export function keepUpcomingGameMeta(prev: Record<string, unknown>, next: Record<string, unknown>): void {
  for (const key of META_KEYS) {
    if (next[key] === undefined && prev[key] !== undefined) next[key] = prev[key]
  }
}
