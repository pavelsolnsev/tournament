import { createError } from 'h3'
import { ensureTablesExist } from '../../utils/initDb'
import { persistTournamentStatePutBody } from '../../utils/persistTournamentStatePutBody'
import { clearVkStartListRequest } from '../../utils/vkStartListRequest'
import { setVkListCloseRequested } from '../../utils/vkListCloseRequest'

// POST /api/tournament/vk-unlink-and-reset — полный админ: запросить у бота закрытие списка в ВК (как e!), сбросить турнир на сайте.
// Привязку tournament_vk_link не трогаем здесь: бот должен увидеть closeVkListRequested + linked в roster-snapshot, закрыть список и вызвать unlink-event.
export default defineEventHandler(async (event) => {
  await ensureTablesExist()

  const session = getCookie(event, 'admin_session')
  if (session !== 'full') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: full admin only' })
  }

  await setVkListCloseRequested()
  await clearVkStartListRequest()

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
