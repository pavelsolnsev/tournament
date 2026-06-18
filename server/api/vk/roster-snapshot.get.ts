import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'
import { requireVkBotToken } from '../../utils/vkBotAuth'
import { readVkListClosePending } from '../../utils/vkListCloseRequest'
import { readVkStartListPending } from '../../utils/vkStartListRequest'
import { parseVkTeamLabelMap, parseVkTeamSlots, parseVkTeamLimits, parseVkListLimit } from '../../utils/tournamentPaidPlayers'

const LINK_KEY = 'tournament_vk_link'
const TOURNAMENT_KEY = 'tournament'

type MatchStatus = 'upcoming' | 'live' | 'finished'

interface TournamentJson {
  selectedIds?: unknown
  paidPlayerIds?: unknown
  vkTeamLabelByPlayerId?: unknown
  vkTeamSlots?: unknown
  vkTeamLimits?: unknown
  vkListLimit?: unknown
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
  paidPlayerIds: number[]
  vkTeamLabelByPlayerId: Record<string, string>
  vkTeamSlots: string[]
  vkTeamLimits: Record<string, number>
  vkListLimit: number | undefined
  matchStatus: MatchStatus
  liveHomeTeam: string
  liveAwayTeam: string
  vkMuted: boolean
}

function parseTournamentValue(value: string | undefined): ParsedTournament {
  const empty: ParsedTournament = {
    selectedIds: [],
    paidPlayerIds: [],
    vkTeamLabelByPlayerId: {},
    vkTeamSlots: [],
    vkTeamLimits: {},
    vkListLimit: undefined,
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
    const rawPaid = st.paidPlayerIds
    const paidPlayerIds = Array.isArray(rawPaid)
      ? rawPaid.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
      : []
    const ms = st.matchStatus
    const matchStatus: MatchStatus =
      ms === 'live' || ms === 'finished' || ms === 'upcoming' ? ms : 'upcoming'
    const vkMuted = st.vkMuted === true
    return {
      selectedIds,
      paidPlayerIds,
      vkTeamLabelByPlayerId: parseVkTeamLabelMap(st.vkTeamLabelByPlayerId),
      vkTeamSlots: parseVkTeamSlots(st.vkTeamSlots),
      vkTeamLimits: parseVkTeamLimits(st.vkTeamLimits),
      vkListLimit: parseVkListLimit(st.vkListLimit),
      matchStatus,
      liveHomeTeam: typeof st.liveHomeTeam === 'string' ? st.liveHomeTeam : '',
      liveAwayTeam: typeof st.liveAwayTeam === 'string' ? st.liveAwayTeam : '',
      vkMuted,
    }
  } catch {
    return empty
  }
}

type RosterBlock = {
  rosterVkUserIds: number[]
  paidVkUserIds: number[]
  /** Метка команды с сайта по vk id (для списка в боте). */
  rosterTeamLabelByVkUserId: Record<string, string>
  /** Слоты команд из link-event. */
  vkTeamSlots: string[]
  /** Лимиты команд (ключ — нормализованное имя в нижнем регистре). */
  vkTeamLimits: Record<string, number>
  /** Общий лимит списка (без команд). */
  vkListLimit: number | undefined
  matchStatus: MatchStatus
  liveHomeTeam: string
  liveAwayTeam: string
  vkMuted: boolean
}

async function computeRosterBlock(parsed: ParsedTournament): Promise<RosterBlock> {
  const { selectedIds, paidPlayerIds, matchStatus, liveHomeTeam, liveAwayTeam, vkMuted } = parsed
  const paidSet = new Set(paidPlayerIds)
  const labelByPlayerId = parsed.vkTeamLabelByPlayerId
  const teamSlots = parsed.vkTeamSlots
  const teamLimits = parsed.vkTeamLimits
  const listLimit = parsed.vkListLimit

  if (selectedIds.length === 0) {
    return {
      rosterVkUserIds: [],
      paidVkUserIds: [],
      rosterTeamLabelByVkUserId: {},
      vkTeamSlots: teamSlots,
      vkTeamLimits: teamLimits,
      vkListLimit: listLimit,
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
  const paidVkUserIds: number[] = []
  const seenVk = new Set<number>()
  const seenPaidVk = new Set<number>()
  const rosterTeamLabelByVkUserId: Record<string, string> = {}

  for (const pid of selectedIds) {
    const vkId = byId.get(pid)
    if (vkId == null || !Number.isFinite(vkId) || vkId === 0) continue
    const lbl = labelByPlayerId[String(pid)]
    // Всегда передаём ключ (в т.ч. ''): иначе бот не поймёт сброс «Без команды» и оставит prevTeams.
    rosterTeamLabelByVkUserId[String(vkId)] = lbl && String(lbl).trim() ? String(lbl).trim() : ''
    if (seenVk.has(vkId)) continue
    seenVk.add(vkId)
    rosterVkUserIds.push(vkId)
    if (paidSet.has(pid)) {
      if (!seenPaidVk.has(vkId)) {
        seenPaidVk.add(vkId)
        paidVkUserIds.push(vkId)
      }
    }
  }

  return {
    rosterVkUserIds,
    paidVkUserIds,
    rosterTeamLabelByVkUserId,
    vkTeamSlots: teamSlots,
    vkTeamLimits: teamLimits,
    vkListLimit: listLimit,
    matchStatus,
    liveHomeTeam,
    liveAwayTeam,
    vkMuted,
  }
}

// Снимок состава для бота + флаг закрытия списка + статус матча (live → уведомление в ВК).

export default defineEventHandler(async (event) => {
  await ensureTablesExist()
  requireVkBotToken(event)

  const [closeVkListRequested, startRow] = await Promise.all([
    readVkListClosePending(),
    readVkStartListPending(),
  ])
  const startVkRequested = startRow
    ? { commandText: startRow.commandText, peerId: startRow.peerId }
    : null

  const stateRows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [TOURNAMENT_KEY],
  )
  const parsed = parseTournamentValue(stateRows[0]?.value)
  const rosterBlock = await computeRosterBlock(parsed)

  const linkRows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [LINK_KEY],
  )

  const tail = {
    closeVkListRequested,
    startVkRequested,
    ...rosterBlock,
  }

  if (linkRows.length === 0 || !linkRows[0]?.value) {
    return {
      linked: false,
      peerId: null as number | null,
      gameEventId: null as string | null,
      ...tail,
    }
  }

  let link: LinkJson
  try {
    link = JSON.parse(linkRows[0].value) as LinkJson
  } catch {
    return {
      linked: false,
      peerId: null as number | null,
      gameEventId: null as string | null,
      ...tail,
    }
  }

  const peerId = Number(link.peerId)
  const gameEventId = typeof link.gameEventId === 'string' ? link.gameEventId.trim() : ''
  if (!peerId || !Number.isFinite(peerId) || !gameEventId) {
    return {
      linked: false,
      peerId: null as number | null,
      gameEventId: null as string | null,
      ...tail,
    }
  }

  return {
    linked: true,
    peerId,
    gameEventId,
    ...tail,
  }
})
