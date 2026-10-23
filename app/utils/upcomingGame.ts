// Афиша «Ближайшая игра» для гостя на главной: когда, где, формат, цена и кто уже записался.
// Всё берётся из состояния турнира — пока идёт запись, команд на сайте ещё нет, и раньше гость
// видел только «Турнир ещё не начался», хотя в списке уже были люди.
import type { Player } from '~/types/tournament'
import type { SavedTournamentContext } from '~/composables/tournament-wizard/savedContextTypes'
import { computeQueuedPlayerIds, matchSlot, teamLimitFor } from '~/utils/tournamentQueue'

/** Адрес и карта площадки — как в боте (eventListLocations). */
const VENUES: Record<string, { address: string; mapUrl: string }> = {
  'красное знамя': {
    address: 'г. Раменское, ул. Воровского, д. 4А',
    mapUrl: 'https://yandex.ru/maps/-/CLuPMJ3L',
  },
  'профилакторий': {
    address: 'г. Раменское, ул. Махова, д. 18',
    mapUrl: 'https://yandex.ru/maps/-/CHfBZ-mH',
  },
}

export type UpcomingGroup = {
  /** Название команды; null — «Без команды» (или общий список, если команд нет). */
  name: string | null
  players: Player[]
  /** Лимит основы; null — без лимита. */
  limit: number | null
  queue: Player[]
}

export type UpcomingGame = {
  /** «пятница, 24 октября» или пусто. */
  dateLabel: string
  time: string
  venue: string
  address: string | null
  mapUrl: string | null
  format: string
  sum: number | null
  groups: UpcomingGroup[]
  /** Сколько записалось в основу (без очереди). */
  mainCount: number
}

/** «пятница, 24 октября» из ISO-даты ГГГГ-ММ-ДД (по Москве). */
export function formatUpcomingDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? '').trim())
  if (!m) return ''
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00+03:00`)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' }).format(d)
}

/** null — показывать нечего (турнир не объявлен): тогда у гостя прежняя заглушка. */
export function buildUpcomingGame(state: SavedTournamentContext | null, players: Player[]): UpcomingGame | null {
  if (!state) return null
  const ids = (state.selectedIds ?? []).map(Number).filter((id) => Number.isFinite(id))
  const date = String(state.tournamentDate ?? '').trim()
  const venue = String(state.venueLabel ?? '').trim()
  if (ids.length === 0 && !date && !venue) return null

  const byId = new Map(players.map((p) => [p.id, p]))
  const labels: Record<number, string> = {}
  for (const [k, v] of Object.entries(state.vkTeamLabelByPlayerId ?? {})) labels[Number(k)] = String(v ?? '')
  const slots = state.vkListTournament ? (state.vkTeamSlots ?? []).filter(Boolean) : []
  const teamLimits = state.vkTeamLimits ?? {}
  const listLimit = slots.length ? null : (state.vkListLimit ?? null)
  const queued = computeQueuedPlayerIds({ orderedIds: ids, teamLabelByPlayerId: labels, teamSlots: slots, teamLimits, listLimit })

  // Игроки по порядку записи; кого нет в базе игроков (ещё не подгрузился) — пропускаем.
  const ordered = ids.map((id) => byId.get(id)).filter((p): p is Player => !!p)

  const groups: UpcomingGroup[] = []
  if (slots.length) {
    for (const slot of slots) {
      const inTeam = ordered.filter((p) => matchSlot(slots, labels[p.id]) === slot)
      groups.push({
        name: slot,
        players: inTeam.filter((p) => !queued.has(p.id)),
        limit: teamLimitFor(teamLimits, slot),
        queue: inTeam.filter((p) => queued.has(p.id)),
      })
    }
    const noTeam = ordered.filter((p) => !matchSlot(slots, labels[p.id]))
    if (noTeam.length) groups.push({ name: null, players: noTeam, limit: null, queue: [] })
  } else {
    groups.push({
      name: null,
      players: ordered.filter((p) => !queued.has(p.id)),
      limit: listLimit != null && listLimit >= 1 ? Math.floor(listLimit) : null,
      queue: ordered.filter((p) => queued.has(p.id)),
    })
  }

  const info = VENUES[venue.toLowerCase()] ?? null
  const sum = Number(state.tournamentSum)
  return {
    dateLabel: formatUpcomingDate(date),
    time: String(state.tournamentTime ?? '').trim(),
    venue,
    address: info?.address ?? null,
    mapUrl: info?.mapUrl ?? null,
    format: String(state.formatLabel ?? '').trim(),
    sum: Number.isFinite(sum) && sum > 0 ? sum : null,
    groups,
    mainCount: groups.reduce((n, g) => n + g.players.length, 0),
  }
}
