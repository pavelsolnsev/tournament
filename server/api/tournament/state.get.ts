import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'

// API: GET /api/tournament/state — возвращает текущее состояние турнира из базы данных.
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  await ensureTablesExist()

  // Читаем сохранённое состояние турнира из базы (с retry при обрыве соединения).
  const rows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    ['tournament'],
  )

  // Если состояние ещё не сохранялось — возвращаем null.
  if (rows.length === 0) return { state: null }

  try {
    // Парсим JSON-строку обратно в объект.
    const rawValue = rows[0]?.value
    if (!rawValue) return { state: null }
    const state = JSON.parse(rawValue)
    if (getCookie(event, 'admin_session') !== 'full') delete state?.vkReserves
    return { state }
  } catch {
    return { state: null }
  }
})
