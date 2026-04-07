// Этот файл: логика завершения турнира — сборка данных и отправка на сервер.
// Аналог команды e! из телеграм-бота: собирает игроков и команды, пишет всё в БД за одну транзакцию.
import type { Player } from '~/types/tournament'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'
import type { PlayerMatchStats, PlayedMatch } from '~/composables/tournament-standings/types'
import type { SavedStandingsSnapshot } from '~/composables/useTournamentWizard'
import { selectMvp, type MvpCandidate, type MvpTeamStat } from '~/composables/tournament-standings/mvp'
import { round1 } from '~/composables/tournament-standings/ratingCalc'

type FinishTournamentParams = {
  // Все игроки турнира с их базовыми данными.
  players: Player[]
  // Назначение: playerId → teamName.
  assignmentByPlayerId: Record<number, string>
  // Итоговая таблица с местами и статистикой команд.
  standingsRows: Ref<StandingsRow[]>
  // Суммарная статистика каждого игрока за весь турнир.
  aggregatePlayerStats: Ref<Record<number, PlayerMatchStats>>
  // Накопленные дельты рейтинга за турнир.
  playerRatingDeltas: Ref<Record<number, number>>
  // Список сыгранных матчей — нужен для подсчёта gamesPlayed/wins/draws/losses по игроку.
  playedMatchesList: Ref<PlayedMatch[]>
  // Данные для архива — нужны чтобы сохранить итоги в tournament_archives.
  tournamentName: Ref<string>
  tournamentDate: Ref<string>
  venueLabel: Ref<string>
  formatLabel: Ref<string>
  standingsSnapshot: Ref<SavedStandingsSnapshot | null>
  teamColors: Ref<Record<string, number>>
}

// Статус завершения — нужен для UI (кнопка, спиннер, сообщение).
export type FinishStatus = 'idle' | 'loading' | 'success' | 'error'

export function useFinishTournament(params: FinishTournamentParams) {
  const status = ref<FinishStatus>('idle')
  const errorMessage = ref<string | null>(null)

  function normalizeUsername(text: string | null | undefined): string | null {
    const cleaned = (text ?? '').replace(/^@+/, '').trim()
    if (!cleaned) return null
    if (cleaned.toLowerCase() === 'unknown') return '@unknown'
    return cleaned
  }
  // Пустое → null; плейсхолдер без ника — @unknown, как в БД после normalizePlayerUsername на сервере.

  // Собираем данные игроков для отправки на сервер.
  // Статистика берётся из aggregatePlayerStats, wins/draws/losses — из списка матчей.
  function buildPlayersPayload() {
    // Считаем для каждого игрока: в каких матчах он участвовал и каков был результат.
    // Игрок «участвовал», если у него есть запись в homeStats или awayStats матча.
    const playerWDL: Record<number, { wins: number; draws: number; losses: number; games: number }> = {}

    for (const match of params.playedMatchesList.value) {
      const homeWin = match.homeGoals > match.awayGoals
      const draw = match.homeGoals === match.awayGoals

      // Обрабатываем игроков домашней команды.
      for (const playerId of Object.keys(match.homeStats).map(Number)) {
        if (!playerWDL[playerId]) playerWDL[playerId] = { wins: 0, draws: 0, losses: 0, games: 0 }
        playerWDL[playerId].games += 1
        if (homeWin) playerWDL[playerId].wins += 1
        else if (draw) playerWDL[playerId].draws += 1
        else playerWDL[playerId].losses += 1
      }

      // Обрабатываем игроков гостевой команды.
      for (const playerId of Object.keys(match.awayStats).map(Number)) {
        if (!playerWDL[playerId]) playerWDL[playerId] = { wins: 0, draws: 0, losses: 0, games: 0 }
        playerWDL[playerId].games += 1
        if (!homeWin && !draw) playerWDL[playerId].wins += 1
        else if (draw) playerWDL[playerId].draws += 1
        else playerWDL[playerId].losses += 1
      }
    }

    // Собираем базовый payload без MVP-бонусов — один объект на игрока.
    const base = params.players.map((p) => {
      const stats = params.aggregatePlayerStats.value[p.id] ?? {
        goals: 0, assists: 0, saves: 0, yellows: 0,
      }
      const wdl = playerWDL[p.id] ?? { wins: 0, draws: 0, losses: 0, games: 0 }
      const ratingDelta = params.playerRatingDeltas.value[p.id] ?? 0

      return {
        id: p.id,
        name: p.name,
        username: normalizeUsername(p.username),
        goals: stats.goals,
        assists: stats.assists,
        saves: stats.saves,
        gamesPlayed: wdl.games,
        wins: wdl.wins,
        draws: wdl.draws,
        losses: wdl.losses,
        ratingDelta,
        mvp: 0,
        yellowCards: stats.yellows,
        // baseRating нужен selectMvp для разрешения ничьих — берём из исходного объекта игрока.
        baseRating: Number(p.rating ?? 0),
      }
    })

    // Строим список кандидатов MVP из base-данных.
    const mvpCandidates: MvpCandidate[] = base.map((bp) => ({
      id: bp.id,
      goals: bp.goals,
      assists: bp.assists,
      saves: bp.saves,
      wins: bp.wins,
      yellows: bp.yellowCards,
      ratingDelta: bp.ratingDelta,
      baseRating: bp.baseRating,
    }))

    // Статистика команд для критерия «очки команды» при выборе MVP.
    const teamStats: MvpTeamStat[] = params.standingsRows.value.map((row) => ({
      teamName: row.teamName,
      wins: row.wins,
      draws: row.draws,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
    }))

    // Определяем MVP всего турнира (учитываем очки команды через teamStats).
    const tournamentMvp = selectMvp(mvpCandidates, {
      assignmentByPlayerId: params.assignmentByPlayerId,
      teamStats,
    })
    const tournamentMvpId = tournamentMvp?.id ?? null

    // Определяем MVP каждой команды отдельно (без командных очков — только личная стата).
    // Игрок, уже получивший звание MVP турнира, не может быть ещё и MVP команды.
    const teamMvpIds = new Set<number>()
    const uniqueTeamNames = [...new Set(Object.values(params.assignmentByPlayerId))]
    for (const teamName of uniqueTeamNames) {
      const teamCandidates = mvpCandidates.filter(
        (c) => params.assignmentByPlayerId[c.id] === teamName,
      )
      const teamMvp = selectMvp(teamCandidates)
      // MVP команды засчитываем только если он не является MVP турнира.
      if (teamMvp && teamMvp.id !== tournamentMvpId) {
        teamMvpIds.add(teamMvp.id)
      }
    }

    // Применяем MVP-бонусы к ratingDelta и mvp-полю.
    // +1.0 рейтинга за MVP турнира (mvp = 1 в базе).
    // +0.5 рейтинга за MVP команды (если не MVP турнира; mvp остаётся 0).
    return base.map(({ baseRating: _baseRating, ...bp }) => {
      const isTournamentMvp = bp.id === tournamentMvpId
      const isTeamMvp = !isTournamentMvp && teamMvpIds.has(bp.id)
      const mvpBonus = isTournamentMvp ? 1.0 : isTeamMvp ? 0.5 : 0

      return {
        ...bp,
        mvp: isTournamentMvp ? 1 : 0,
        ratingDelta: round1(bp.ratingDelta + mvpBonus),
      }
    })
  }

  // Собираем данные команд для отправки на сервер.
  // Берём итоговую таблицу с местами и маппим игроков по командам.
  function buildTeamsPayload() {
    return params.standingsRows.value.map((row) => {
      // Находим всех игроков этой команды через assignment.
      const teamPlayers = params.players
        .filter((p) => params.assignmentByPlayerId[p.id] === row.teamName)
        .map((p) => ({ id: p.id, name: p.name, username: normalizeUsername(p.username) }))

      return {
        name: row.teamName,
        wins: row.wins,
        draws: row.draws,
        losses: row.losses,
        goalsScored: row.goalsFor,
        goalsConceded: row.goalsAgainst,
        place: row.place,
        // Передаём реальные очки за турнир (3 за победу, 1 за ничью) а не 3/2/1/0 за место.
        tournamentPoints: row.points,
        players: teamPlayers,
      }
    })
  }

  // Основная функция — завершить турнир.
  // Отправляет данные в /api/tournament/finish POST.
  async function finishTournament() {
    if (status.value === 'loading') return

    // Проверяем что есть хотя бы один сыгранный матч.
    if (params.players.length === 0) {
      errorMessage.value = 'Нет участников для сохранения.'
      status.value = 'error'
      return
    }

    const hasAnyStats = Object.keys(params.aggregatePlayerStats.value).length > 0
    if (!hasAnyStats) {
      errorMessage.value = 'Ни один матч ещё не сыгран. Сыграйте хотя бы один матч перед завершением.'
      status.value = 'error'
      return
    }

    status.value = 'loading'
    errorMessage.value = null

    try {
      await $fetch('/api/tournament/finish', {
        method: 'POST',
        body: {
          players: buildPlayersPayload(),
          teams: buildTeamsPayload(),
          // Данные для архива — передаём вместе с основными данными в одной транзакции.
          tournamentName: params.tournamentName.value,
          tournamentDate: params.tournamentDate.value,
          venueLabel: params.venueLabel.value,
          formatLabel: params.formatLabel.value,
          snapshot: params.standingsSnapshot.value,
          allPlayers: params.players,
          assignmentByPlayerId: params.assignmentByPlayerId,
          teamColors: params.teamColors.value,
        },
      })
      status.value = 'success'
    } catch (err: unknown) {
      status.value = 'error'
      // Показываем понятное сообщение в зависимости от типа ошибки.
      if (err && typeof err === 'object' && 'statusMessage' in err) {
        errorMessage.value = String((err as { statusMessage: string }).statusMessage)
      } else {
        errorMessage.value = 'Ошибка соединения с сервером. Попробуйте ещё раз.'
      }
    }
  }

  // Сбрасываем статус — например после закрытия диалога.
  function resetStatus() {
    status.value = 'idle'
    errorMessage.value = null
  }

  return {
    finishTournament,
    resetStatus,
    status,
    errorMessage,
  }
}
