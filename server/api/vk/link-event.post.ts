import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'
import { requireVkBotToken } from '../../utils/vkBotAuth'
import { clearVkListCloseRequest } from '../../utils/vkListCloseRequest'
import { clearSelectedIdsOnVkLinkIfAfterUnlink } from '../../utils/vkUnlinkRelinkPolicy'
import { parseVkListLimit, parseVkTeamSlots, readTournamentStateRow } from '../../utils/tournamentPaidPlayers'
import { bumpRosterRev } from '../../utils/tournamentRosterRev'
import { writeTournamentStateCas } from '../../utils/tournamentStateCas'
import { reserveFitsTeamSlots } from '../../utils/tournamentReservePolicy'
import { readTournamentReserves } from '../../../app/utils/tournamentReserves'

const LINK_KEY = 'tournament_vk_link'

// Бот вызывает после создания списка в чате — привязываем peer + id события к сайту (один глобальный турнир).

interface LinkBody {
  peer_id?: number
  game_event_id?: string
  /** Имена команд с кнопок в чате (s tr A B …) — для выбора на сайте. */
  team_slots?: string[]
  /** true только для s tr — на сайте показываются команды ВК; false очищает слоты и подписи. */
  vk_list_tournament?: boolean
  max_players?: number
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

  const patchTournament =
    body &&
    typeof body === 'object' &&
    (('team_slots' in body && Array.isArray((body as LinkBody).team_slots)) ||
      'vk_list_tournament' in body)

  if (!patchTournament) return { ok: true }
  for (let attempt = 0; attempt < 8; attempt++) {
    const row = await readTournamentStateRow()
    const base = (row?.json && typeof row.json === 'object' ? (row.json as Record<string, unknown>) : null) ?? {}
    const next = { ...base } as Record<string, unknown>
    const defaultLimit = parseVkListLimit(body.max_players)
    if (defaultLimit) next.vkListDefaultLimit = defaultLimit

    if (body && typeof body === 'object' && 'vk_list_tournament' in body) {
      const vkList = (body as LinkBody).vk_list_tournament === true
      next.vkListTournament = vkList
      if (!vkList) {
        next.vkTeamSlots = []
        next.vkTeamLabelByPlayerId = {}
        next.vkTeamLimits = {}
      }
    }

    if (body && typeof body === 'object' && 'team_slots' in body && Array.isArray((body as LinkBody).team_slots)) {
      next.vkTeamSlots = parseVkTeamSlots((body as LinkBody).team_slots)
    }

    // Старый бот без vk_list_tournament: непустые слоты ⇒ режим турнира.
    if (
      body &&
      typeof body === 'object' &&
      !('vk_list_tournament' in body) &&
      'team_slots' in body &&
      Array.isArray((body as LinkBody).team_slots) &&
      parseVkTeamSlots((body as LinkBody).team_slots).length > 0
    ) {
      next.vkListTournament = true
    }

    const reserves = readTournamentReserves(base.vkReserves)
    if (reserves.some(reserve => !reserveFitsTeamSlots(reserve, parseVkTeamSlots(next.vkTeamSlots)))) {
      next.vkListTournament = base.vkListTournament
      next.vkTeamSlots = base.vkTeamSlots
      next.vkTeamLabelByPlayerId = base.vkTeamLabelByPlayerId
      next.vkTeamLimits = base.vkTeamLimits
    }
    bumpRosterRev(next)
    if (await writeTournamentStateCas(row?.raw ?? null, next)) return { ok: true }
  }

  throw createError({ statusCode: 409, statusMessage: 'Concurrent update conflict on tournament state' })
})
