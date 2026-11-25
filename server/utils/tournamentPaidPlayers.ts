import { queryWithRetry } from './db'
import { writeTournamentStateCas } from './tournamentStateCas'

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

const VK_TEAM_LABEL_MAX = 64

/** Подписи команд из ВК: ключ — id игрока (строка), как в JSON. */
export function parseVkTeamLabelMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const id = Number(k)
    if (!Number.isFinite(id) || id <= 0) continue
    if (typeof v !== 'string' || !v.trim()) continue
    out[String(id)] = v.trim().slice(0, VK_TEAM_LABEL_MAX)
  }
  return out
}

/**
 * Тело PUT /api/tournament/state: пустая строка по id — снятие команды, ключ должен сохраняться
 * (и не затираться через parseVkTeamLabelMap, который пустые отбрасывает).
 */
export function parseVkTeamLabelMapForPutBody(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const id = Number(k)
    if (!Number.isFinite(id) || id <= 0) continue
    if (typeof v !== 'string') continue
    out[String(id)] = v.replace(/\s+/g, ' ').trim().slice(0, VK_TEAM_LABEL_MAX)
  }
  return out
}

/**
 * PUT /api/tournament/state: по ключу из тела (явно задано админом) — значение с сайта; иначе — как в БД
 * (в т.ч. после /api/vk/join). Пустая строка в client снимает метку.
 */
export function mergeVkTeamLabelsForPut(
  prev: Record<string, string>,
  client: Record<string, string>,
  selectedIds: number[],
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const id of selectedIds) {
    const k = String(id)
    if (Object.prototype.hasOwnProperty.call(client, k)) {
      if (client[k] && String(client[k]).trim()) {
        out[k] = String(client[k]).trim().slice(0, VK_TEAM_LABEL_MAX)
      }
      // Явно передали пусто — out[k] не добавляем (сброс), не падаем в prev.
    } else if (prev[k] && String(prev[k]).trim()) {
      out[k] = String(prev[k]).trim().slice(0, VK_TEAM_LABEL_MAX)
    }
  }
  return out
}

const VK_TEAM_SLOT_MAX = 9

/** Список кнопок команд из бота (как в parseTeamSlotNames). */
export function parseVkTeamSlots(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of raw) {
    if (typeof s !== 'string') continue
    const t = s.replace(/\s+/g, ' ').trim().slice(0, 40)
    if (!t) continue
    const k = t.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(t)
    if (out.length >= VK_TEAM_SLOT_MAX) break
  }
  return out
}

const VK_TEAM_LIMIT_MAX = 99

/**
 * Лимиты команд для турнирного списка ВК: ключ — нормализованное имя команды
 * (один пробел, без краёв, нижний регистр — как в боте), значение — целое 1..99.
 */
export function parseVkTeamLimits(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const key = String(k ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
    if (!key) continue
    const n = Math.floor(Number(v))
    if (!Number.isFinite(n) || n < 1) continue
    out[key] = Math.min(n, VK_TEAM_LIMIT_MAX)
  }
  return out
}

const VK_LIST_LIMIT_MAX = 200

/** Общий лимит ВК-списка (без команд): целое 1..200, иначе undefined (без лимита). */
export function parseVkListLimit(raw: unknown): number | undefined {
  const n = Math.floor(Number(raw))
  if (!Number.isFinite(n) || n < 1) return undefined
  return Math.min(n, VK_LIST_LIMIT_MAX)
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
    return { json: json && typeof json === 'object' && !Array.isArray(json) ? json : {}, raw }
  } catch {
    return { json: {}, raw }
  }
}

/** Атомарно: playerId должен быть в selectedIds; обновляет paidPlayerIds и пишет обратно в БД. */
export async function setPlayerPaidFlag(opts: {
  playerId: number
  paid: boolean
}): Promise<{ ok: true, paidPlayerIds: number[] } | { ok: false, statusMessage: string }> {
  return changePaidFlag(opts.playerId, opts.paid)
}

async function changePaidFlag(playerId: number, explicitPaid?: boolean): Promise<
  { ok: true; paid: boolean; paidPlayerIds: number[]; playerId: number } | { ok: false; statusMessage: string }
> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const row = await readTournamentStateRow()
    if (!row) return { ok: false, statusMessage: 'Tournament state is empty' }
    if (!parseSelectedIds(row.json.selectedIds).includes(playerId)) {
      return { ok: false, statusMessage: 'Player is not in the tournament list' }
    }
    const ids = new Set(parsePaidIds(row.json.paidPlayerIds))
    const paid = explicitPaid ?? !ids.has(playerId)
    if (paid) ids.add(playerId)
    else ids.delete(playerId)
    const paidPlayerIds = [...ids].sort((a, b) => a - b)
    if (await writeTournamentStateCas(row.raw, { ...row.json, paidPlayerIds })) return { ok: true, paid, paidPlayerIds, playerId }
  }
  return { ok: false, statusMessage: 'Concurrent update conflict on tournament state' }
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
  return changePaidFlag(resolved.playerId, paid)
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
  return changePaidFlag(resolved.playerId)
}
