import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'

// API: POST /api/vk/leave — вызывается VK-ботом когда пользователь жмёт «Выйти» или «-».
// Убирает игрока из списка выбранных игроков турнира (selectedIds).

// Тип тела запроса от бота.
interface VkLeaveBody {
  vk_user_id: number
}

// Тип строки состояния турнира из базы.
interface TournamentState {
  selectedIds?: number[]
  [key: string]: unknown
}

export default defineEventHandler(async (event) => {
  await ensureTablesExist()

  // Проверяем секретный токен — только бот знает этот токен.
  const authHeader = getHeader(event, 'authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  const expectedToken = process.env.VK_TOKEN ?? ''

  if (!expectedToken || token !== expectedToken) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: invalid token' })
  }

  // Читаем тело запроса от бота.
  const body = await readBody<VkLeaveBody>(event)

  // vk_user_id обязателен — по нему ищем игрока в базе.
  const vkUserId = Number(body?.vk_user_id)
  if (!vkUserId || !Number.isFinite(vkUserId)) {
    throw createError({ statusCode: 400, statusMessage: 'vk_user_id is required' })
  }

  // Ищем игрока по vk_user_id — нужен его внутренний id для удаления из selectedIds.
  const rows = await queryWithRetry<Array<{ id: number }>>(
    'SELECT id FROM players WHERE vk_user_id = ?',
    [vkUserId],
  )

  if (rows.length === 0 || !rows[0]) {
    // Игрок не найден — ничего не делаем, возвращаем ok.
    return { ok: true, removed: false }
  }

  const playerId = rows[0].id

  // Читаем текущее состояние турнира из базы.
  const stateRows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    ['tournament'],
  )

  if (stateRows.length === 0 || !stateRows[0]?.value) {
    // Состояния нет — игрок и так не в списке.
    return { ok: true, removed: false }
  }

  let state: TournamentState
  try {
    state = JSON.parse(stateRows[0].value) as TournamentState
  } catch {
    return { ok: true, removed: false }
  }

  // Убираем игрока из selectedIds.
  const existingIds: number[] = Array.isArray(state.selectedIds) ? state.selectedIds : []
  const newIds = existingIds.filter((id) => id !== playerId)

  // Если игрока и не было в списке — ничего не сохраняем.
  if (newIds.length === existingIds.length) {
    return { ok: true, removed: false }
  }

  state.selectedIds = newIds

  // Сохраняем обновлённое состояние обратно в базу.
  const json = JSON.stringify(state)
  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    ['tournament', json],
  )

  return { ok: true, removed: true, playerId }
})
