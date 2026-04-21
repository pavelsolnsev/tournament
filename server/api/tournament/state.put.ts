import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'
import {
  filterPaidToSelected,
  parsePaidIds,
  parseSelectedIds,
  readTournamentStateRow,
} from '../../utils/tournamentPaidPlayers'

const TOURNAMENT_KEY = 'tournament'

// API: PUT /api/tournament/state — сохраняет состояние турнира в базу данных.
// Только администратор может сохранять состояние.

export default defineEventHandler(async (event) => {
  await ensureTablesExist()

  const session = getCookie(event, 'admin_session')
  // Simple10: Сохранять состояние может любой админ (full или limited).
  if (session !== 'full' && session !== 'limited') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })
  }

  const body = await readBody(event)

  if (!body || typeof body.state === 'undefined') {
    throw createError({ statusCode: 400, statusMessage: 'State is required' })
  }

  const state = body.state as Record<string, unknown>
  // Флаг читает VK-бот (roster-snapshot): при true уведомления по составу/матчу не шлём.
  // Режим судьи (limited) должен вести себя как полный админ — уведомления в ВК включены.
  state.vkMuted = false
  // Оплата (paidPlayerIds) меняется отдельными POST и из ВК — не затираем автосохранением мастера.
  const prev = await readTournamentStateRow()
  const preservedPaid = parsePaidIds(prev?.json.paidPlayerIds)
  const newSelected = parseSelectedIds(state.selectedIds)
  state.paidPlayerIds = filterPaidToSelected(preservedPaid, newSelected)
  const json = JSON.stringify(state)

  await queryWithRetry(
    `INSERT INTO app_state (key_name, value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [TOURNAMENT_KEY, json],
  )

  return { ok: true }
})
