import { queryWithRetry } from './db'

/** Флаг «закрыть список в ВК как e!» — читает бот в roster-snapshot, сбрасывает после ack. */
export const VK_LIST_CLOSE_REQUEST_KEY = 'tournament_vk_close_requested'

export async function setVkListCloseRequested(): Promise<void> {
  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, '1')
     ON DUPLICATE KEY UPDATE value = '1'`,
    [VK_LIST_CLOSE_REQUEST_KEY],
  )
}

export async function readVkListClosePending(): Promise<boolean> {
  const rows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [VK_LIST_CLOSE_REQUEST_KEY],
  )
  if (rows.length === 0 || !rows[0]?.value) return false
  const v = String(rows[0].value).trim()
  return v === '1' || v.toLowerCase() === 'true'
}

export async function clearVkListCloseRequest(): Promise<void> {
  await queryWithRetry('DELETE FROM app_state WHERE key_name = ?', [VK_LIST_CLOSE_REQUEST_KEY])
}
