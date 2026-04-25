import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'
import { requireVkBotToken } from '../../utils/vkBotAuth'
import { setMarkerAfterVkListUnlink } from '../../utils/vkUnlinkRelinkPolicy'

const LINK_KEY = 'tournament_vk_link'

// Бот вызывает при закрытии события — без связи сайт не толкает состав в ВК.
// Simple10: selectedIds больше не чистим здесь (список на сайте остаётся); маркер + очистка при следующем link-event.

interface LinkJson {
  gameEventId?: string
}

export default defineEventHandler(async (event) => {
  await ensureTablesExist()
  requireVkBotToken(event)

  const linkRows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [LINK_KEY],
  )
  let gameEventId = ''
  if (linkRows.length > 0 && linkRows[0]?.value) {
    try {
      const j = JSON.parse(linkRows[0].value) as LinkJson
      gameEventId = typeof j.gameEventId === 'string' ? j.gameEventId.trim() : ''
    } catch {
      gameEventId = ''
    }
  }

  await queryWithRetry('DELETE FROM app_state WHERE key_name = ?', [LINK_KEY])
  if (gameEventId) {
    await setMarkerAfterVkListUnlink(gameEventId)
  }

  return { ok: true }
})
