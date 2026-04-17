import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'

const TOURNAMENT_KEY = 'tournament'

// API: PUT /api/tournament/state — сохраняет состояние турнира в базу данных.
// Только администратор может сохранять состояние.

export default defineEventHandler(async (event) => {
  await ensureTablesExist()

  const session = getCookie(event, 'admin_session')
  // Simple10: Сохранять состояние может любой админ (full или limited).
  if (session !== 'full' && session !== 'limited') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })
  }

  const body = await readBody(event)

  if (!body || typeof body.state === 'undefined') {
    throw createError({ statusCode: 400, statusMessage: 'State is required' })
  }

  const state = body.state as Record<string, unknown>
  // Simple10: Если состояние сохраняет ограниченный админ, помечаем это флагом vkMuted.
  // Simple10: VK-бот будет читать этот флаг и не отправлять уведомления при выборе команд (переход matchStatus в live).
  // Simple10: Для полного админа флаг всегда false — так включается обычное поведение.
  state.vkMuted = session === 'limited'
  const json = JSON.stringify(state)

  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [TOURNAMENT_KEY, json],
  )

  return { ok: true }
})
