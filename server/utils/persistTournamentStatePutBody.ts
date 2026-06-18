import { createError } from 'h3'
import { queryWithRetry } from './db'
import {
  filterPaidToSelected,
  mergeVkTeamLabelsForPut,
  parsePaidIds,
  parseSelectedIds,
  parseVkTeamLabelMap,
  parseVkTeamLabelMapForPutBody,
  parseVkTeamSlots,
  parseVkTeamLimits,
  parseVkListLimit,
  readTournamentStateRow,
} from './tournamentPaidPlayers'
import { mergeLiveCurrentMatchStatsIntoNextState } from './mergeLiveCurrentMatchStatsForPersist'

const TOURNAMENT_KEY = 'tournament'

function tournamentMetaPresent(s: Record<string, unknown>): boolean {
  return (
    String(s.tournamentName ?? '').trim() !== '' ||
    String(s.tournamentDate ?? '').trim() !== '' ||
    String(s.venueLabel ?? '').trim() !== '' ||
    String(s.formatLabel ?? '').trim() !== ''
  )
}

/**
 * Сохраняет состояние турнира по тем же правилам, что PUT /api/tournament/state (тело body.state).
 * Используется мастером в браузере и, при полном сбросе, ботом (e! / clear-tournament).
 */
export async function persistTournamentStatePutBody(state: Record<string, unknown>) {
  // __fullReset: только в теле PUT — явное разрешение полного сброса (сайт: emptyResetState; бот: clear-tournament).
  const withFlag = state as { __fullReset?: boolean }
  const fullResetAuthorized = withFlag.__fullReset === true
  delete withFlag.__fullReset

  state.vkMuted = false
  const prev = await readTournamentStateRow()
  const prevJson = (prev?.json && typeof prev.json === 'object' ? prev.json : {}) as Record<string, unknown>
  const preservedPaid = parsePaidIds(prevJson.paidPlayerIds)
  const newSelected = parseSelectedIds(state.selectedIds)

  const stepRaw = (state as { step?: unknown }).step
  const stepIsInitial = stepRaw === undefined || stepRaw === null || Number(stepRaw) === 0
  const snapshotEmpty = (state as { standingsSnapshot?: unknown }).standingsSnapshot == null
  const looksLikeFullWipe =
    newSelected.length === 0 && snapshotEmpty && stepIsInitial && !tournamentMetaPresent(state)

  const prevStepNum = Number(prevJson.step)
  const prevHadStructuredTournament =
    tournamentMetaPresent(prevJson) ||
    prevJson.standingsSnapshot != null ||
    (Number.isFinite(prevStepNum) && prevStepNum > 0)

  if (looksLikeFullWipe && prevHadStructuredTournament && !fullResetAuthorized) {
    throw createError({
      statusCode: 409,
      statusMessage:
        'Refusing full tournament clear: missing __fullReset (use «Очистить данные», «Завершить турнир», or bot e!)',
    })
  }

  const isFullTournamentReset = newSelected.length === 0 && snapshotEmpty && stepIsInitial

  // Режим списка ВК (турнир с командами vs обычный с общим лимитом) — серверный, его задают
  // отдельные потоки: link-event (бот: s tr → true, s prof → false), clear-tournament / vk-unlink
  // и полный сброс. Рядовой PUT состояния НЕ должен менять уже установленный режим: иначе
  // устаревшая вкладка (создали турнир, не обновили список, добавили игрока) пришлёт свой
  // флаг и «разжалует» турнир в обычный список (или наоборот). Клиентский флаг — лишь зеркало
  // сервера, поэтому prevFlag авторитетнее; клиент/эвристика нужны только когда режим ещё не задан.
  const clientVkListFlag = (state as { vkListTournament?: unknown }).vkListTournament
  const prevFlag = prevJson.vkListTournament
  let vkListTournament: boolean
  if (isFullTournamentReset) {
    vkListTournament = false
  } else if (typeof prevFlag === 'boolean') {
    vkListTournament = prevFlag
  } else if (typeof clientVkListFlag === 'boolean') {
    vkListTournament = clientVkListFlag
  } else {
    const prevSlotsHint = parseVkTeamSlots(prevJson.vkTeamSlots)
    if (prevSlotsHint.length > 0) {
      vkListTournament = true
    } else {
      const prevLab = parseVkTeamLabelMap(prevJson.vkTeamLabelByPlayerId)
      vkListTournament = Object.keys(prevLab).length > 0
    }
  }
  ;(state as { vkListTournament: boolean }).vkListTournament = vkListTournament

  state.paidPlayerIds = filterPaidToSelected(preservedPaid, newSelected)

  if (!vkListTournament) {
    ;(state as { vkTeamLabelByPlayerId: Record<string, string> }).vkTeamLabelByPlayerId = {}
    ;(state as { vkTeamSlots: string[] }).vkTeamSlots = []
    ;(state as { vkTeamLimits: Record<string, number> }).vkTeamLimits = {}
  } else {
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
    // Лимиты команд: клиент задаёт значения по ключу, но не теряем заданные в чате (tl) — мерджим prev←client.
    if (isFullTournamentReset) {
      ;(state as { vkTeamLimits: Record<string, number> }).vkTeamLimits = {}
    } else {
      const prevLimits = parseVkTeamLimits(prev?.json.vkTeamLimits)
      const clientLimits = parseVkTeamLimits((state as { vkTeamLimits?: unknown }).vkTeamLimits)
      ;(state as { vkTeamLimits: Record<string, number> }).vkTeamLimits = { ...prevLimits, ...clientLimits }
    }
  }

  // Общий лимит списка — авторитетно с сайта (число задаёт лимит, пусто снимает); не зависит от режима команд.
  ;(state as { vkListLimit?: number }).vkListLimit = isFullTournamentReset
    ? undefined
    : parseVkListLimit((state as { vkListLimit?: unknown }).vkListLimit)

  // Два устройства в live: не теряем отметки по текущему матчу при конкурирующих PUT.
  mergeLiveCurrentMatchStatsIntoNextState(prevJson, state)

  const json = JSON.stringify(state)

  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [TOURNAMENT_KEY, json],
  )
}
