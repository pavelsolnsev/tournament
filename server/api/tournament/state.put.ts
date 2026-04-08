import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'

const TOURNAMENT_KEY = 'tournament'

// API: PUT /api/tournament/state — сохраняет состояние турнира в базу данных.
// Только администратор может сохранять состояние.

function normalizeSelectedIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []
  return raw.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
}

function parsePrevSelectedIds(jsonStr: string | undefined): number[] {
  if (!jsonStr) return []
  try {
    const s = JSON.parse(jsonStr) as { selectedIds?: unknown }
    return normalizeSelectedIds(s.selectedIds)
  } catch {
    return []
  }
}

export default defineEventHandler(async (event) => {
  await ensureTablesExist()

  const session = getCookie(event, 'admin_session')
  if (session !== 'true') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })
  }

  const body = await readBody(event)

  if (!body || typeof body.state === 'undefined') {
    throw createError({ statusCode: 400, statusMessage: 'State is required' })
  }

  const state = body.state as Record<string, unknown>

  const rows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [TOURNAMENT_KEY],
  )
  const prevIds = parsePrevSelectedIds(rows[0]?.value)
  const nextIds = normalizeSelectedIds(state.selectedIds)
  const nextSet = new Set(nextIds)

  // Сравниваем с прошлым снимком из БД: пропавшие id не ошибка — это нормальное удаление в админке.
  // Раньше опционально «дописывали хвост» из БД (TOURNAMENT_MERGE_SELECTED_IDS), но тогда снятие игрока на сайте откатывалось обратно.
  const lost = prevIds.filter((id) => !nextSet.has(id))
  if (lost.length > 0) {
    console.warn(
      '[tournament/state.put] В сохранении нет id, которые были в БД (устаревшая вкладка или удаление в UI). Пропадают с сервера:',
      lost,
    )
  }

  const json = JSON.stringify(state)

  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [TOURNAMENT_KEY, json],
  )

  return { ok: true }
})
