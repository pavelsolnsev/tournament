import { ensureTablesExist } from '../../utils/initDb'
import { queryWithRetry } from '../../utils/db'

const LINK_KEY = 'tournament_vk_link'

type VkLinkJson = {
  peerId?: number
  gameEventId?: string
}

// API: GET /api/tournament/vk-status — привязка турнира к событию ВК (только админ).
export default defineEventHandler(async (event) => {
  await ensureTablesExist()

  const session = getCookie(event, 'admin_session')
  if (session !== 'full' && session !== 'limited') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })
  }

  const linkRows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [LINK_KEY],
  )

  if (linkRows.length === 0 || !linkRows[0]?.value) {
    return {
      ok: true,
      linked: false,
      peerId: null as number | null,
      gameEventId: null as string | null,
    }
  }

  let link: VkLinkJson = {}
  try {
    link = JSON.parse(linkRows[0].value) as VkLinkJson
  } catch {
    return {
      ok: true,
      linked: false,
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
      peerId: null as number | null,
      gameEventId: null as string | null,
    }
  }

  return {
    ok: true,
    linked: true,
    peerId,
    gameEventId,
  }
})
