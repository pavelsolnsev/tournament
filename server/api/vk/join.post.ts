import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'
import { normalizePlayerUsername } from '../../utils/normalizePlayerUsername'

// API: POST /api/vk/join — вызывается VK-ботом когда пользователь жмёт «Играть» или «+».
// Создаёт нового игрока (если такого имени нет) и добавляет его в список выбранных игроков турнира.

// Тип тела запроса от бота.
interface VkJoinBody {
  vk_user_id: number
  first_name: string
  last_name: string
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
  const body = await readBody<VkJoinBody>(event)

  // vk_user_id обязателен — по нему ищем игрока при выходе.
  const vkUserId = Number(body?.vk_user_id)
  if (!vkUserId || !Number.isFinite(vkUserId)) {
    throw createError({ statusCode: 400, statusMessage: 'vk_user_id is required' })
  }

  // Собираем имя игрока из first_name + last_name, убираем лишние пробелы.
  const name = `${(body?.first_name ?? '').trim()} ${(body?.last_name ?? '').trim()}`.trim()

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }

  // Проверяем — есть ли уже игрок с таким vk_user_id в базе.
  // Если есть — не создаём дубль, просто берём его id.
  const existing = await queryWithRetry<Array<{ id: number }>>(
    'SELECT id FROM players WHERE vk_user_id = ?',
    [vkUserId],
  )

  let playerId: number

  if (existing.length > 0 && existing[0]) {
    // Игрок уже есть — используем его существующий id.
    playerId = existing[0].id
  } else {
    // Новый игрок — создаём запись в таблице.
    // username не передаётся — ставим @unknown как плейсхолдер (можно вручную поменять позже).
    // Передаём строку 'unknown' — normalizePlayerUsername превратит её в '@unknown'.
    const username = normalizePlayerUsername('unknown')
    playerId = Date.now()

    try {
      await queryWithRetry(
        `INSERT INTO players (id, name, username, vk_user_id, goals, assists, saves, gamesPlayed, wins, draws, losses, rating, mvp, yellow_cards)
         VALUES (?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`,
        [playerId, name, username, vkUserId],
      )
    } catch (err) {
      // Выводим детальную ошибку MySQL в лог сервера — поможет понять причину сбоя.
      const mysqlErr = err as { code?: string; sqlMessage?: string; message?: string }
      console.error('[vk/join] Failed to create player:', mysqlErr?.code, mysqlErr?.sqlMessage ?? mysqlErr?.message)
      throw createError({ statusCode: 500, statusMessage: `Failed to create player: ${mysqlErr?.sqlMessage ?? mysqlErr?.message ?? 'unknown'}` })
    }
  }

  // Читаем текущее состояние турнира из базы.
  const rows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    ['tournament'],
  )

  // Если состояния ещё нет — создаём минимальное с одним игроком.
  let state: TournamentState = { selectedIds: [] }

  if (rows.length > 0 && rows[0]?.value) {
    try {
      state = JSON.parse(rows[0].value) as TournamentState
    } catch {
      // Если JSON битый — начинаем с чистого состояния.
      state = { selectedIds: [] }
    }
  }

  // Добавляем нового игрока в список выбранных (selectedIds), без дублей.
  const existingIds: number[] = Array.isArray(state.selectedIds) ? state.selectedIds : []
  if (!existingIds.includes(playerId)) {
    state.selectedIds = [...existingIds, playerId]
  }

  // Сохраняем обновлённое состояние обратно в базу.
  const json = JSON.stringify(state)
  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    ['tournament', json],
  )

  // Возвращаем данные игрока боту — бот может использовать их для ответа пользователю в ВК.
  return { ok: true, player: { id: playerId, name } }
})
