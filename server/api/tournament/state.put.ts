import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'

// API: PUT /api/tournament/state — сохраняет состояние турнира в базу данных.
// Только администратор может сохранять состояние.
export default defineEventHandler(async (event) => {
  await ensureTablesExist()

  // Проверяем сессию администратора.
  const session = getCookie(event, 'admin_session')
  if (session !== 'true') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })
  }

  const body = await readBody(event)

  if (!body || typeof body.state === 'undefined') {
    throw createError({ statusCode: 400, statusMessage: 'State is required' })
  }

  // Сериализуем состояние в JSON и сохраняем в базе (upsert — обновляем если уже есть).
  const json = JSON.stringify(body.state)

  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    ['tournament', json],
  )

  return { ok: true }
})
