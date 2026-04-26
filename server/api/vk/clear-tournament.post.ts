import { ensureTablesExist } from '../../utils/initDb'
import { persistTournamentStatePutBody } from '../../utils/persistTournamentStatePutBody'
import { requireVkBotToken } from '../../utils/vkBotAuth'

// POST /api/vk/clear-tournament — полный сброс состояния турнира в БД (как «Очистить данные» в мастере). Вызывается ботом при e!.

export default defineEventHandler(async (event) => {
  await ensureTablesExist()
  requireVkBotToken(event)

  const state: Record<string, unknown> = {
    step: 0,
    tournamentName: '',
    tournamentDate: '',
    venueLabel: '',
    formatLabel: '',
    selectedIds: [],
    paidPlayerIds: [],
    vkTeamLabelByPlayerId: {},
    vkTeamSlots: [],
    vkListTournament: false,
    assignmentByPlayerId: {},
    confirmedTeamNames: [],
    teamColors: {},
    standingsSnapshot: null,
    matchStatus: 'upcoming',
    liveHomeTeam: '',
    liveAwayTeam: '',
    __fullReset: true,
  }
  await persistTournamentStatePutBody(state)
  return { ok: true }
})
