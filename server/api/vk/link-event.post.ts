import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'
import { requireVkBotToken } from '../../utils/vkBotAuth'
import { clearVkListCloseRequest } from '../../utils/vkListCloseRequest'
import { clearSelectedIdsOnVkLinkIfAfterUnlink } from '../../utils/vkUnlinkRelinkPolicy'
import { parseVkTeamSlots, readTournamentStateRow } from '../../utils/tournamentPaidPlayers'

const LINK_KEY = 'tournament_vk_link'
const TOURNAMENT_KEY = 'tournament'

// Бот вызывает после создания списка в чате — привязываем peer + id события к сайту (один глобальный турнир).

interface LinkBody {
  peer_id?: number
  game_event_id?: string
  /** Имена команд с кнопок в чате (s tr A B …) — для выбора на сайте. */
  team_slots?: string[]
}

export default defineEventHandler(async (event) => {
  await ensureTablesExist()
  requireVkBotToken(event)

  const body = await readBody<LinkBody>(event)
  const peerId = Number(body?.peer_id)
  const gameEventId = typeof body?.game_event_id === 'string' ? body.game_event_id.trim() : ''

  if (!peerId || !Number.isFinite(peerId) || !gameEventId) {
    throw createError({ statusCode: 400, statusMessage: 'peer_id and game_event_id are required' })
  }

  const payload = JSON.stringify({ peerId, gameEventId })
  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [LINK_KEY, payload],
  )

  // После старой привязки: убрать «хвост» selectedIds, чтобы в новый лист ВК не уехал прошлый состав.
  await clearSelectedIdsOnVkLinkIfAfterUnlink()

  // Сбрасываем «закрыть список»: иначе после прошлого «Завершить матч» флаг мог остаться в БД, если ack бота не дошёл.
  // Первый тик поллинга тогда делал бы runCloseEvent и сразу гасил только что созданный список (редкий, но реальный баг).
  await clearVkListCloseRequest()

  // team_slots: только если бот явно прислал массив (в т.ч. [] после удаления всех кнопок), иначе не затираем старые слоты на сайте.
  if (
    body &&
    typeof body === 'object' &&
    'team_slots' in body &&
    Array.isArray((body as LinkBody).team_slots)
  ) {
    const normSlots = parseVkTeamSlots((body as LinkBody).team_slots)
    const row = await readTournamentStateRow()
    const base = (row?.json && typeof row.json === 'object' ? (row.json as Record<string, unknown>) : null) ?? {}
    const next = { ...base, vkTeamSlots: normSlots }
    await queryWithRetry(
      `INSERT INTO app_state (key_name, value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`,
      [TOURNAMENT_KEY, JSON.stringify(next)],
    )
  }

  return { ok: true }
})
