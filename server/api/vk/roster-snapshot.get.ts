import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'
import { requireVkBotToken } from '../../utils/vkBotAuth'

const LINK_KEY = 'tournament_vk_link'
const TOURNAMENT_KEY = 'tournament'

interface TournamentJson {
  selectedIds?: number[]
  [key: string]: unknown
}

interface LinkJson {
  peerId?: number
  gameEventId?: string
}

// Снимок состава для бота: только если есть связь из бота (link-event).

export default defineEventHandler(async (event) => {
  await ensureTablesExist()
  requireVkBotToken(event)

  const linkRows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [LINK_KEY],
  )

  if (linkRows.length === 0 || !linkRows[0]?.value) {
    return { linked: false }
  }

  let link: LinkJson
  try {
    link = JSON.parse(linkRows[0].value) as LinkJson
  } catch {
    return { linked: false }
  }

  const peerId = Number(link.peerId)
  const gameEventId = typeof link.gameEventId === 'string' ? link.gameEventId.trim() : ''
  if (!peerId || !Number.isFinite(peerId) || !gameEventId) {
    return { linked: false }
  }

  const stateRows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [TOURNAMENT_KEY],
  )

  let selectedIds: number[] = []
  if (stateRows.length > 0 && stateRows[0]?.value) {
    try {
      const st = JSON.parse(stateRows[0].value) as TournamentJson
      const raw = st.selectedIds
      if (Array.isArray(raw)) {
        selectedIds = raw.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
      }
    } catch {
      selectedIds = []
    }
  }

  if (selectedIds.length === 0) {
    return { linked: true, peerId, gameEventId, rosterVkUserIds: [] as number[] }
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
    // Ноль пропускаем; отрицательные — синтетические id (+add / админка), их тоже отдаём в бот.
    if (vkId == null || !Number.isFinite(vkId) || vkId === 0) continue
    if (seenVk.has(vkId)) continue
    seenVk.add(vkId)
    rosterVkUserIds.push(vkId)
  }

  return { linked: true, peerId, gameEventId, rosterVkUserIds }
})
