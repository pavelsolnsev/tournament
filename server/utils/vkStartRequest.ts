import { queryWithRetry } from './db'

/** Запрос «создать список в ВК» от сайта к боту. */
export const VK_START_REQUEST_KEY = 'tournament_vk_start_requested'

export type VkStartRequestPayload = {
  /** Текст команды, как если бы админ написал в ВК: "s tr", "s prof", "s 04.04.2026 18:00 Сатурн". */
  commandText: string
  requestedAtIso: string
  /** ID беседы ВК (peer_id). Если задан — бот создаёт список здесь, даже без старой привязки в БД. */
  peerId?: number
}

export async function setVkStartRequested(commandText: string, peerId?: number): Promise<void> {
  const payload: VkStartRequestPayload = {
    commandText: String(commandText || '').trim(),
    requestedAtIso: new Date().toISOString(),
  }
  if (peerId != null && Number.isFinite(peerId) && peerId !== 0) {
    payload.peerId = Math.trunc(peerId)
  }
  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [VK_START_REQUEST_KEY, JSON.stringify(payload)],
  )
}

export async function readVkStartRequested(): Promise<VkStartRequestPayload | null> {
  const rows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [VK_START_REQUEST_KEY],
  )
  if (rows.length === 0 || !rows[0]?.value) return null
  try {
    const parsed = JSON.parse(rows[0].value) as Partial<VkStartRequestPayload>
    const commandText = typeof parsed.commandText === 'string' ? parsed.commandText.trim() : ''
    if (!commandText) return null
    const peerRaw = parsed.peerId
    const peerId =
      typeof peerRaw === 'number' && Number.isFinite(peerRaw) && peerRaw !== 0
        ? Math.trunc(peerRaw)
        : undefined
    return {
      commandText,
      requestedAtIso: typeof parsed.requestedAtIso === 'string' ? parsed.requestedAtIso : '',
      ...(peerId != null ? { peerId } : {}),
    }
  } catch {
    return null
  }
}

export async function clearVkStartRequest(): Promise<void> {
  await queryWithRetry('DELETE FROM app_state WHERE key_name = ?', [VK_START_REQUEST_KEY])
}

