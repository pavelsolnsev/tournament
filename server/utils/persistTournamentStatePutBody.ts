import { queryWithRetry } from './db'
import {
  filterPaidToSelected,
  mergeVkTeamLabelsForPut,
  parsePaidIds,
  parseSelectedIds,
  parseVkTeamLabelMap,
  parseVkTeamLabelMapForPutBody,
  parseVkTeamSlots,
  readTournamentStateRow,
} from './tournamentPaidPlayers'

const TOURNAMENT_KEY = 'tournament'

/**
 * Сохраняет состояние турнира по тем же правилам, что PUT /api/tournament/state (тело body.state).
 * Используется мастером в браузере и, при полном сбросе, ботом (e! / clear-tournament).
 */
export async function persistTournamentStatePutBody(state: Record<string, unknown>) {
  state.vkMuted = false
  const prev = await readTournamentStateRow()
  const preservedPaid = parsePaidIds(prev?.json.paidPlayerIds)
  const newSelected = parseSelectedIds(state.selectedIds)
  const stepRaw = (state as { step?: unknown }).step
  const stepIsInitial = stepRaw === undefined || stepRaw === null || Number(stepRaw) === 0
  const snapshotEmpty = (state as { standingsSnapshot?: unknown }).standingsSnapshot == null
  const isFullTournamentReset = newSelected.length === 0 && snapshotEmpty && stepIsInitial

  state.paidPlayerIds = filterPaidToSelected(preservedPaid, newSelected)
  const prevVk = parseVkTeamLabelMap(prev?.json.vkTeamLabelByPlayerId)
  const clientVk = parseVkTeamLabelMapForPutBody(
    (state as { vkTeamLabelByPlayerId?: unknown }).vkTeamLabelByPlayerId,
  )
  ;(state as { vkTeamLabelByPlayerId: Record<string, string> }).vkTeamLabelByPlayerId = mergeVkTeamLabelsForPut(
    prevVk,
    clientVk,
    newSelected,
  )
  const clientSlots = parseVkTeamSlots((state as { vkTeamSlots?: unknown }).vkTeamSlots)
  const prevSlots = parseVkTeamSlots(prev?.json.vkTeamSlots)
  if (clientSlots.length > 0) {
    ;(state as { vkTeamSlots: string[] }).vkTeamSlots = clientSlots
  } else if (isFullTournamentReset) {
    ;(state as { vkTeamSlots: string[] }).vkTeamSlots = []
  } else {
    ;(state as { vkTeamSlots: string[] }).vkTeamSlots = prevSlots
  }
  const json = JSON.stringify(state)

  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [TOURNAMENT_KEY, json],
  )
}
