import { queryWithRetry } from './db'
import { filterPaidToSelected, parsePaidIds } from './tournamentPaidPlayers'

const TOURNAMENT_KEY = 'tournament'

/** Строка в app_state: был unlink после закрытия списка в ВК (сохраняем вне JSON турнира, чтобы не потерялось от PUT /api/tournament/state). */
export const VK_UNLINKED_EVENT_MARKER_KEY = 'tournament_vk_unlinked_event_id'

/**
 * Помнить, что привязка к событию ВК снята — id события нужен только для логов/отладки;
 * важно: маркер говорит «следующий link = новая игра, надо убрать старые selectedIds».
 * Simple10: пишем в отдельный key, иначе админ с мастером перезаписал бы JSON и потерял бы смысл.
 */
export async function setMarkerAfterVkListUnlink(gameEventId: string) {
  const v = gameEventId.trim()
  if (!v) return
  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [VK_UNLINKED_EVENT_MARKER_KEY, v],
  )
}

/**
 * При новом link-event: если ранее был unlink, сбрасываем selectedIds (как раньше на unlink), иначе бот
 * подтянет старый состав в новый чат-лист. Если unlink не было — не трогаем (админ мог набрать список до первого ВК).
 * Simple10: маркер снимаем вместе с очисткой, чтобы сценарий сработал один раз.
 */
export async function clearSelectedIdsOnVkLinkIfAfterUnlink() {
  const mRows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [VK_UNLINKED_EVENT_MARKER_KEY],
  )
  if (mRows.length === 0 || !mRows[0]?.value?.trim()) return

  await queryWithRetry('DELETE FROM app_state WHERE key_name = ?', [VK_UNLINKED_EVENT_MARKER_KEY])

  const tRows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [TOURNAMENT_KEY],
  )
  if (tRows.length === 0 || !tRows[0]?.value) return

  let state: Record<string, unknown>
  try {
    state = JSON.parse(tRows[0].value) as Record<string, unknown>
  } catch {
    state = {}
  }
  // Simple10: состав и оплаты только по текущему списку — как в state.put при пустом selected.
  state.selectedIds = []
  const paid = parsePaidIds(state.paidPlayerIds)
  state.paidPlayerIds = filterPaidToSelected(paid, [])

  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [TOURNAMENT_KEY, JSON.stringify(state)],
  )
}
