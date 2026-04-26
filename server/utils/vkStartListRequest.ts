import { createError } from 'h3'
import { queryWithRetry } from './db'

/** Запрос «создать список в ВК» с сайта — бот читает в roster-snapshot, сбрасывает после ack. */
export const VK_START_LIST_REQUEST_KEY = 'tournament_vk_start_requested'

export type VkStartListRequestStored = {
  commandText: string
  peerId: number
  requestedAt: string
}

export async function setVkStartListRequested(payload: {
  commandText: string
  peerId: number
}): Promise<void> {
  const trimmed = String(payload.commandText || '').trim()
  const peerId = Math.trunc(Number(payload.peerId))
  if (!trimmed || !Number.isFinite(peerId) || peerId === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid start-list payload' })
  }

  const body: VkStartListRequestStored = {
    commandText: trimmed,
    peerId,
    requestedAt: new Date().toISOString(),
  }
  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [VK_START_LIST_REQUEST_KEY, JSON.stringify(body)],
  )
}

export async function readVkStartListPending(): Promise<VkStartListRequestStored | null> {
  const rows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [VK_START_LIST_REQUEST_KEY],
  )
  if (rows.length === 0 || !rows[0]?.value) return null
  try {
    const v = JSON.parse(rows[0].value) as Partial<VkStartListRequestStored>
    const commandText = typeof v.commandText === 'string' ? v.commandText.trim() : ''
    if (!commandText) return null
    const peerRaw = v.peerId
    const peerId =
      typeof peerRaw === 'number' && Number.isFinite(peerRaw) ? Math.trunc(peerRaw) : 0
    if (!peerId) return null
    return {
      commandText,
      peerId,
      requestedAt: typeof v.requestedAt === 'string' ? v.requestedAt : '',
    }
  } catch {
    return null
  }
}

export async function clearVkStartListRequest(): Promise<void> {
  await queryWithRetry('DELETE FROM app_state WHERE key_name = ?', [VK_START_LIST_REQUEST_KEY])
}
