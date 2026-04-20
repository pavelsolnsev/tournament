import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'
import { setVkStartRequested } from '../../utils/vkStartRequest'

const LINK_KEY = 'tournament_vk_link'

type Body = {
  commandText?: unknown
  /** peer_id беседы ВК. Обязателен, если в БД ещё нет привязки tournament_vk_link. */
  peerId?: unknown
}

async function readLinkedPeerId(): Promise<number | null> {
  const linkRows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [LINK_KEY],
  )
  if (linkRows.length === 0 || !linkRows[0]?.value) return null
  try {
    const link = JSON.parse(linkRows[0].value) as { peerId?: number }
    const n = Number(link.peerId)
    return Number.isFinite(n) && n !== 0 ? n : null
  } catch {
    return null
  }
}

// API: POST /api/tournament/request-vk-start — админ просит бота создать список в ВК (аналог "s tr", "s prof"...).
export default defineEventHandler(async (event) => {
  await ensureTablesExist()

  const session = getCookie(event, 'admin_session')
  // Опасное действие — только полный админ.
  if (session !== 'full') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: full admin only' })
  }

  const body = await readBody<Body>(event)
  const commandText = typeof body?.commandText === 'string' ? body.commandText.trim() : ''
  if (!commandText) {
    throw createError({ statusCode: 400, statusMessage: 'commandText is required' })
  }

  // Разрешаем только start-команды, чтобы не превратить эндпоинт в «выполни что угодно».
  if (!/^(s|start)\b/iu.test(commandText)) {
    throw createError({ statusCode: 400, statusMessage: 'commandText must start with s/start' })
  }

  const fromBody = Number(body?.peerId)
  const peerFromBody = Number.isFinite(fromBody) && fromBody !== 0 ? Math.trunc(fromBody) : null
  const linkedPeer = await readLinkedPeerId()

  if (peerFromBody != null) {
    await setVkStartRequested(commandText, peerFromBody)
  } else if (linkedPeer != null) {
    await setVkStartRequested(commandText)
  } else {
    throw createError({
      statusCode: 400,
      statusMessage:
        'peerId is required when VK chat is not linked yet — enter conversation peer_id (same chat where the bot is added)',
    })
  }

  return { ok: true }
})

