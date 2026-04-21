import { queryWithRetry } from './db'

const TOURNAMENT_KEY = 'tournament'

type TournamentJson = {
  selectedIds?: unknown
  paidPlayerIds?: unknown
  [key: string]: unknown
}

export function parsePaidIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []
  return raw.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
}

export function parseSelectedIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []
  return raw.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
}

/** Оставить только id из текущего списка турнира (при снятии игрока с оплаты убираем). */
export function filterPaidToSelected(paid: number[], selectedIds: number[]): number[] {
  const set = new Set(selectedIds)
  return paid.filter((id) => set.has(id)).sort((a, b) => a - b)
}

/** Читает JSON турнира из app_state и возвращает распарсенный объект или null. */
export async function readTournamentStateRow(): Promise<{ json: TournamentJson, raw: string } | null> {
  const rows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [TOURNAMENT_KEY],
  )
  const raw = rows[0]?.value
  if (!raw) return null
  try {
    const json = JSON.parse(raw) as TournamentJson
    return { json, raw }
  } catch {
    return null
  }
}

/** Атомарно: playerId должен быть в selectedIds; обновляет paidPlayerIds и пишет обратно в БД. */
export async function setPlayerPaidFlag(opts: {
  playerId: number
  paid: boolean
}): Promise<{ ok: true, paidPlayerIds: number[] } | { ok: false, statusMessage: string }> {
  const row = await readTournamentStateRow()
  if (!row) {
    return { ok: false, statusMessage: 'Tournament state is empty' }
  }
  const { json } = row
  const selectedIds = parseSelectedIds(json.selectedIds)
  const pid = opts.playerId
  if (!selectedIds.includes(pid)) {
    return { ok: false, statusMessage: 'Player is not in the tournament list' }
  }
  const paid = new Set(parsePaidIds(json.paidPlayerIds))
  if (opts.paid) {
    paid.add(pid)
  }
  else {
    paid.delete(pid)
  }
  const paidPlayerIds = [...paid].sort((a, b) => a - b)
  json.paidPlayerIds = paidPlayerIds
  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [TOURNAMENT_KEY, JSON.stringify(json)],
  )
  return { ok: true, paidPlayerIds }
}

async function resolvePlayerIdForVkUserId(
  vkUserId: number,
  selectedIds: number[],
): Promise<{ ok: true, playerId: number } | { ok: false, statusMessage: string }> {
  const playerRows = await queryWithRetry<Array<{ id: number }>>(
    'SELECT id FROM players WHERE vk_user_id = ?',
    [vkUserId],
  )
  const playerId = playerRows[0]?.id
  if (playerId == null || !Number.isFinite(playerId)) {
    return { ok: false, statusMessage: 'Player not found for vk_user_id' }
  }
  const pid = Number(playerId)
  if (!selectedIds.includes(pid)) {
    return { ok: false, statusMessage: 'Player is not in the tournament list' }
  }
  return { ok: true, playerId: pid }
}

/** Явно выставить оплату по vk_user_id (команды p / unp в боте). */
export async function setPlayerPaidByVkUserId(
  vkUserId: number,
  paid: boolean,
): Promise<
  { ok: true, paid: boolean, paidPlayerIds: number[], playerId: number }
  | { ok: false, statusMessage: string }
> {
  const row = await readTournamentStateRow()
  if (!row) {
    return { ok: false, statusMessage: 'Tournament state is empty' }
  }
  const { json } = row
  const selectedIds = parseSelectedIds(json.selectedIds)
  const resolved = await resolvePlayerIdForVkUserId(vkUserId, selectedIds)
  if (!resolved.ok) return resolved
  const pid = resolved.playerId
  const set = new Set(parsePaidIds(json.paidPlayerIds))
  if (paid) {
    set.add(pid)
  }
  else {
    set.delete(pid)
  }
  const paidPlayerIds = [...set].sort((a, b) => a - b)
  json.paidPlayerIds = paidPlayerIds
  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [TOURNAMENT_KEY, JSON.stringify(json)],
  )
  return { ok: true, paid, paidPlayerIds, playerId: pid }
}

/** Переключить оплату по vk_user_id (игрок в текущем списке). */
export async function togglePlayerPaidByVkUserId(vkUserId: number): Promise<
  { ok: true, paid: boolean, paidPlayerIds: number[], playerId: number }
  | { ok: false, statusMessage: string }
> {
  const row = await readTournamentStateRow()
  if (!row) {
    return { ok: false, statusMessage: 'Tournament state is empty' }
  }
  const { json } = row
  const selectedIds = parseSelectedIds(json.selectedIds)
  const resolved = await resolvePlayerIdForVkUserId(vkUserId, selectedIds)
  if (!resolved.ok) return resolved
  const pid = resolved.playerId
  const paid = new Set(parsePaidIds(json.paidPlayerIds))
  const nextPaid = !paid.has(pid)
  if (nextPaid) {
    paid.add(pid)
  }
  else {
    paid.delete(pid)
  }
  const paidPlayerIds = [...paid].sort((a, b) => a - b)
  json.paidPlayerIds = paidPlayerIds
  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [TOURNAMENT_KEY, JSON.stringify(json)],
  )
  return { ok: true, paid: nextPaid, paidPlayerIds, playerId: pid }
}
