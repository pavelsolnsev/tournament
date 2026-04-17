import { ensureTablesExist } from '../../utils/initDb'
import { queryWithRetry } from '../../utils/db'
import { readVkListClosePending } from '../../utils/vkListCloseRequest'

const LINK_KEY = 'tournament_vk_link'

type VkLinkJson = {
  peerId?: number
  gameEventId?: string
}

// API: GET /api/tournament/vk-status — статус VK-хвостов (только админ).
export default defineEventHandler(async (event) => {
  await ensureTablesExist()

  // Проверяем админскую сессию — этот эндпоинт не нужен зрителям.
  const session = getCookie(event, 'admin_session')
  // Simple10: VK статус можно смотреть любому админу (full или limited).
  if (session !== 'full' && session !== 'limited') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })
  }

  // Флаг «бот должен закрыть список» — ставится после «Завершить турнир».
  const closeVkListRequested = await readVkListClosePending()

  // Читаем привязку сайта к беседе/событию ВК, чтобы понять — есть ли активная связь.
  const linkRows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [LINK_KEY],
  )

  if (linkRows.length === 0 || !linkRows[0]?.value) {
    return {
      ok: true,
      linked: false,
      closeVkListRequested,
      peerId: null as number | null,
      gameEventId: null as string | null,
    }
  }

  let link: VkLinkJson = {}
  try {
    link = JSON.parse(linkRows[0].value) as VkLinkJson
  } catch {
    // Если битый JSON — считаем что привязки нет, чтобы UI не завис.
    return {
      ok: true,
      linked: false,
      closeVkListRequested,
      peerId: null as number | null,
      gameEventId: null as string | null,
    }
  }

  const peerId = typeof link.peerId === 'number' && Number.isFinite(link.peerId) ? link.peerId : null
  const gameEventId = typeof link.gameEventId === 'string' ? link.gameEventId.trim() : ''

  if (!peerId || !gameEventId) {
    return {
      ok: true,
      linked: false,
      closeVkListRequested,
      peerId: null as number | null,
      gameEventId: null as string | null,
    }
  }

  return {
    ok: true,
    linked: true,
    closeVkListRequested,
    peerId,
    gameEventId,
  }
})

