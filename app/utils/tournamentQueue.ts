// Расчёт «очереди» на сайте — кто из выбранных не помещается в основу по лимитам.
// Повторяет логику бота (splitRosterByTeams): с командами — пер-командные лимиты,
// без команд — общий лимит списка. Очередные игроки прячутся с сайта.
import { normalizeTeamName } from '~/utils/teamNames'

/** Дефолтный лимит команды — совпадает с DEFAULT_TEAM_LIMIT в боте. */
export const DEFAULT_TEAM_LIMIT = 8

/** Каноничный слот по «сырой» метке (совпадение без регистра/лишних пробелов). */
function matchSlot(slots: string[], raw: string | undefined): string | null {
  const t = normalizeTeamName(String(raw ?? ''))
  if (!t) return null
  const low = t.toLowerCase()
  for (const s of slots) {
    if (normalizeTeamName(s).toLowerCase() === low) return s
  }
  return null
}

/** Лимит команды из карты (ключ — нормализованное имя в нижнем регистре), иначе дефолт. */
function teamLimitFor(teamLimits: Record<string, number> | undefined, slot: string): number {
  const key = normalizeTeamName(slot).toLowerCase()
  const v = teamLimits?.[key]
  return typeof v === 'number' && Number.isFinite(v) && v >= 1 ? Math.floor(v) : DEFAULT_TEAM_LIMIT
}

/**
 * Возвращает id игроков, которые сейчас в очереди (вне основы).
 * orderedIds — порядок записи (как в selectedIds). Очередь активна, только если
 * есть команды (teamSlots) или задан общий лимит (listLimit); иначе пустое множество.
 */
export function computeQueuedPlayerIds(input: {
  orderedIds: number[]
  teamLabelByPlayerId: Record<number, string>
  teamSlots: string[]
  teamLimits: Record<string, number>
  listLimit: number | null | undefined
}): Set<number> {
  const { orderedIds, teamLabelByPlayerId, teamSlots, teamLimits, listLimit } = input
  const slots = Array.isArray(teamSlots) ? teamSlots.filter(Boolean) : []

  // Командный режим: на каждую команду первые limit — основа, остальные — очередь; «без команды» — всегда основа.
  if (slots.length > 0) {
    const counts = new Map<string, number>()
    const queued = new Set<number>()
    for (const id of orderedIds) {
      const canon = matchSlot(slots, teamLabelByPlayerId[id])
      if (!canon) continue
      const used = counts.get(canon) ?? 0
      if (used >= teamLimitFor(teamLimits, canon)) {
        queued.add(id)
      } else {
        counts.set(canon, used + 1)
      }
    }
    return queued
  }

  // Без команд: общий лимит списка (первые listLimit — основа, остальные — очередь).
  const limit = Math.floor(Number(listLimit))
  if (Number.isFinite(limit) && limit >= 1) {
    const queued = new Set<number>()
    let count = 0
    for (const id of orderedIds) {
      if (count >= limit) {
        queued.add(id)
      } else {
        count += 1
      }
    }
    return queued
  }

  return new Set<number>()
}
