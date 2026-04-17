import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'
import { requireVkBotToken } from '../../utils/vkBotAuth'
import { readVkListClosePending } from '../../utils/vkListCloseRequest'

const LINK_KEY = 'tournament_vk_link'
const TOURNAMENT_KEY = 'tournament'

type MatchStatus = 'upcoming' | 'live' | 'finished'

interface TournamentJson {
  selectedIds?: unknown
  matchStatus?: unknown
  liveHomeTeam?: unknown
  liveAwayTeam?: unknown
  vkMuted?: unknown
  [key: string]: unknown
}

interface LinkJson {
  peerId?: number
  gameEventId?: string
}

interface ParsedTournament {
  selectedIds: number[]
  matchStatus: MatchStatus
  liveHomeTeam: string
  liveAwayTeam: string
  vkMuted: boolean
}

function parseTournamentValue(value: string | undefined): ParsedTournament {
  const empty: ParsedTournament = {
    selectedIds: [],
    matchStatus: 'upcoming',
    liveHomeTeam: '',
    liveAwayTeam: '',
    vkMuted: false,
  }
  if (!value) return empty
  try {
    const st = JSON.parse(value) as TournamentJson
    const raw = st.selectedIds
    const selectedIds = Array.isArray(raw)
      ? raw.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
      : []
    const ms = st.matchStatus
    const matchStatus: MatchStatus =
      ms === 'live' || ms === 'finished' || ms === 'upcoming' ? ms : 'upcoming'
    const vkMuted = st.vkMuted === true
    return {
      selectedIds,
      matchStatus,
      liveHomeTeam: typeof st.liveHomeTeam === 'string' ? st.liveHomeTeam : '',
      liveAwayTeam: typeof st.liveAwayTeam === 'string' ? st.liveAwayTeam : '',
      vkMuted,
    }
  } catch {
    return empty
  }
}

// Снимок состава для бота + флаг закрытия списка + статус матча (live → уведомление в ВК).

export default defineEventHandler(async (event) => {
  await ensureTablesExist()
  requireVkBotToken(event)

  const closeVkListRequested = await readVkListClosePending()

  const stateRows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [TOURNAMENT_KEY],
  )
  const parsed = parseTournamentValue(stateRows[0]?.value)

  const linkRows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [LINK_KEY],
  )

  if (linkRows.length === 0 || !linkRows[0]?.value) {
    return { linked: false, closeVkListRequested }
  }

  let link: LinkJson
  try {
    link = JSON.parse(linkRows[0].value) as LinkJson
  } catch {
    return { linked: false, closeVkListRequested }
  }

  const peerId = Number(link.peerId)
  const gameEventId = typeof link.gameEventId === 'string' ? link.gameEventId.trim() : ''
  if (!peerId || !Number.isFinite(peerId) || !gameEventId) {
    return { linked: false, closeVkListRequested }
  }

  const { selectedIds, matchStatus, liveHomeTeam, liveAwayTeam, vkMuted } = parsed

  if (selectedIds.length === 0) {
    return {
      linked: true,
      peerId,
      gameEventId,
      rosterVkUserIds: [] as number[],
      closeVkListRequested,
      matchStatus,
      liveHomeTeam,
      liveAwayTeam,
      vkMuted,
    }
  }

  const placeholders = selectedIds.map(() => '?').join(',')
  const playerRows = await queryWithRetry<Array<{ id: number; vk_user_id: number | null }>>(
    `SELECT id, vk_user_id FROM players WHERE id IN (${placeholders})`,
    selectedIds,
  )

  const byId = new Map<number, number | null>()
  for (const row of playerRows) {
    byId.set(row.id, row.vk_user_id != null ? Number(row.vk_user_id) : null)
  }

  const rosterVkUserIds: number[] = []
  const seenVk = new Set<number>()
  for (const pid of selectedIds) {
    const vkId = byId.get(pid)
    if (vkId == null || !Number.isFinite(vkId) || vkId === 0) continue
    if (seenVk.has(vkId)) continue
    seenVk.add(vkId)
    rosterVkUserIds.push(vkId)
  }

  return {
    linked: true,
    peerId,
    gameEventId,
    rosterVkUserIds,
    closeVkListRequested,
    matchStatus,
    liveHomeTeam,
    liveAwayTeam,
    vkMuted,
  }
})
