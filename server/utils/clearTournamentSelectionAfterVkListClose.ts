import { queryWithRetry } from './db'

const TOURNAMENT_KEY = 'tournament'

/**
 * После закрытия списка в ВК выбор игроков для «листа на сайте» должен быть пустым,
 * иначе при следующем link-event бот подтянет старый состав из selectedIds.
 */
export async function clearTournamentSelectedIdsAfterVkListClose() {
  const rows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [TOURNAMENT_KEY],
  )
  if (rows.length === 0 || !rows[0]?.value) return

  let state: Record<string, unknown>
  try {
    state = JSON.parse(rows[0].value) as Record<string, unknown>
  } catch {
    state = {}
  }

  state.selectedIds = []

  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [TOURNAMENT_KEY, JSON.stringify(state)],
  )
}
