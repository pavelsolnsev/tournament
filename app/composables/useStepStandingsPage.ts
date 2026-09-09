import type { Ref } from 'vue'
import type { Player, MatchStatus } from '~/types/tournament'
import type { SavedStandingsSnapshot } from '~/composables/useTournamentWizard'
import { computed, ref, toRef, watch } from 'vue'
import { useTournamentStandings } from '~/composables/useTournamentStandings'
import { useFinishTournament } from '~/composables/useFinishTournament'
import { displayPlayerLabelWithoutRating } from '~/composables/usePlayerDisplay'
import { useAdminAuth } from '~/composables/useAdminAuth'
import {
  useStepStandingsRemoteHandlers,
  type StepStandingsRemoteEmit,
} from '~/composables/useStepStandingsRemoteHandlers'
import { matchStatusAfterAdopt } from '~/composables/tournament-standings/remoteSync'
import { scrollExpandedPanelIntoView } from '~/utils/scrollExpandedPanelIntoView'

export type StepStandingsPageProps = {
  tournamentName: string
  tournamentDate: string
  venueLabel?: string
  formatLabel?: string
  teams: string[]
  teamColors: Record<string, number>
  players: Player[]
  assignmentByPlayerId: Record<number, string>
  initialSnapshot?: SavedStandingsSnapshot | null
  /** Снапшот из БД (поллинг во время матча) — живая синхронизация судьи и админа. */
  remoteSnapshot?: SavedStandingsSnapshot | null
  /** Статус матча из БД — нужен, чтобы не переоткрыть матч, завершённый на другом устройстве. */
  remoteMatchStatus?: MatchStatus | null
  remoteLiveHomeTeam?: string | null
  remoteLiveAwayTeam?: string | null
  readonly?: boolean
  showClearTournamentConfirm: boolean
  clearTournamentSecondsLeft: number
  clearTournamentBusy: boolean
  fetchRemoteStandingsSnapshot?: () => Promise<SavedStandingsSnapshot | null>
  saveNow?: () => Promise<void>
}

export type StepStandingsPageEmit = {
  (e: 'update:snapshot', snapshot: SavedStandingsSnapshot): void
  (e: 'update:matchStatus', status: MatchStatus, homeTeam: string, awayTeam: string): void
  (
    e: 'tournament-finished' | 'clear-tournament' | 'cancel-clear-tournament' | 'confirm-clear-tournament',
  ): void
  (e: 'remove-player', playerId: number): void
}

export function useStepStandingsPage(props: StepStandingsPageProps, emit: StepStandingsPageEmit) {
  const { adminRole } = useAdminAuth()
  const hideCountdownTimerBar = computed(() => adminRole.value === 'limited')

  // Удалять игрока из состава можно только полному админу — не зрителю и не limited-админу.
  const canRemovePlayer = computed(() => props.readonly !== true && adminRole.value === 'full')

  const emitRemote = emit as StepStandingsRemoteEmit

  const {
    effectiveTeamColors,
    teamMarker,
    standingsRows,
    playedMatchesList,
    hasNextMatch,
    homeTeam,
    awayTeam,
    homeGoals,
    awayGoals,
    canFinishMatch,
    playersByTeam,
    selectPlayerForMark,
    isActivePlayer,
    playerStat,
    onSelectAction,
    addPlayerEvent,
    removePlayerEvent,
    updatePlayedMatch,
    deletePlayedMatch,
    resetMatchStats,
    resetTournamentMarks,
    finishMatch,
    goToNextMatch,
    applyTechnicalDefeat,
    mergeCurrentMatchFromRemoteSnapshot,
    applyRemoteLiveSnapshot,
    displayPlayerLabel,
    aggregatePlayerStats,
    playerRatingDeltas,
  } = useTournamentStandings(
    // Геттеры, а не снимок значений: иначе computed внутри standings не увидит изменений
    // props (например, удаление игрока меняет assignment) и обновится только после перезагрузки.
    {
      get teams() { return props.teams },
      get teamColors() { return props.teamColors },
      get players() { return props.players },
      get assignmentByPlayerId() { return props.assignmentByPlayerId },
    },
    {
      initialSnapshot: props.initialSnapshot,
      onSnapshot: (snapshot) => emit('update:snapshot', snapshot),
    },
  )

  // Живая синхронизация с другим устройством: тянем состояние из БД, пока идёт матч.
  // По 'adopt' там завершили матч, сменили пару или поправили сыгранный — сообщаем статус наверх,
  // иначе мастер оставит в БД старую пару. Статус берём серверный: если судья нажал «показать итоги»,
  // матч должен остаться завершённым, а не «переоткрыться» на выбор следующей пары.
  watch(
    () => props.remoteSnapshot,
    (remote) => {
      if (props.readonly === true) return
      if (applyRemoteLiveSnapshot(remote) !== 'adopt') return
      const [status, home, away] = matchStatusAfterAdopt(
        {
          matchStatus: props.remoteMatchStatus,
          liveHomeTeam: props.remoteLiveHomeTeam,
          liveAwayTeam: props.remoteLiveAwayTeam,
        },
        homeTeam.value,
        awayTeam.value,
      )
      emitRemote('update:matchStatus', status, home, away)
    },
  )

  const playerAvatarsById = computed(() => {
    const out: Record<number, { photo: string | null; name: string }> = {}
    for (const p of props.players) {
      out[p.id] = { photo: p.photo ?? null, name: p.name }
    }
    return out
  })

  const hideBasePlayerRating = computed(
    () => playedMatchesList.value.length > 0 || Boolean(homeTeam.value && awayTeam.value),
  )

  const standingsUid = useId?.() ?? Math.random().toString(36).slice(2)
  const standingsToggleId = `standings-block-toggle-${standingsUid}`
  const standingsPanelId = `standings-block-panel-${standingsUid}`
  const rosterTotalsToggleId = `roster-totals-toggle-${standingsUid}`
  const rosterTotalsPanelId = `roster-totals-panel-${standingsUid}`
  const playedMatchesToggleId = `played-matches-toggle-${standingsUid}`
  const playedMatchesPanelId = `played-matches-panel-${standingsUid}`

  const isStandingsBlockOpen = ref(props.readonly === true)
  const isRosterTotalsOpen = ref(false)
  const isPlayedMatchesOpen = ref(false)

  const {
    finishTournament,
    status: finishStatus,
    errorMessage: finishErrorMessage,
  } = useFinishTournament({
    players: props.players,
    assignmentByPlayerId: props.assignmentByPlayerId,
    standingsRows,
    aggregatePlayerStats,
    playerRatingDeltas,
    playedMatchesList,
    tournamentName: toRef(props, 'tournamentName'),
    tournamentDate: toRef(props, 'tournamentDate'),
    venueLabel: toRef(props, 'venueLabel') as Ref<string>,
    formatLabel: toRef(props, 'formatLabel') as Ref<string>,
    standingsSnapshot: toRef(props, 'initialSnapshot') as Ref<SavedStandingsSnapshot | null>,
    teamColors: toRef(props, 'teamColors'),
  })

  const {
    handleUpdateHomeTeam,
    handleUpdateAwayTeam,
    handleFinishMatchShowResults,
    handleFinishMatchSilent,
    handleResetTournamentMarks,
    handleGoToNextMatch,
    handleTechnicalDefeat,
    handleFinishTournament,
  } = useStepStandingsRemoteHandlers({
    homeTeam,
    awayTeam,
    finishMatch,
    goToNextMatch,
    applyTechnicalDefeat,
    mergeCurrentMatchFromRemoteSnapshot,
    resetTournamentMarks,
    fetchRemoteStandingsSnapshot: props.fetchRemoteStandingsSnapshot,
    emit: emitRemote,
    finishTournament,
    finishStatus,
    saveNow: props.saveNow,
  })

  return {
    hideCountdownTimerBar,
    canRemovePlayer,
    effectiveTeamColors,
    teamMarker,
    standingsRows,
    playedMatchesList,
    hasNextMatch,
    homeTeam,
    awayTeam,
    homeGoals,
    awayGoals,
    canFinishMatch,
    playersByTeam,
    selectPlayerForMark,
    isActivePlayer,
    playerStat,
    onSelectAction,
    addPlayerEvent,
    removePlayerEvent,
    updatePlayedMatch,
    deletePlayedMatch,
    resetMatchStats,
    displayPlayerLabel,
    displayPlayerLabelWithoutRating,
    aggregatePlayerStats,
    playerRatingDeltas,
    playerAvatarsById,
    hideBasePlayerRating,
    standingsToggleId,
    standingsPanelId,
    rosterTotalsToggleId,
    rosterTotalsPanelId,
    playedMatchesToggleId,
    playedMatchesPanelId,
    isStandingsBlockOpen,
    isRosterTotalsOpen,
    isPlayedMatchesOpen,
    finishStatus,
    finishErrorMessage,
    handleUpdateHomeTeam,
    handleUpdateAwayTeam,
    handleFinishMatchShowResults,
    handleFinishMatchSilent,
    handleResetTournamentMarks,
    handleGoToNextMatch,
    handleTechnicalDefeat,
    handleFinishTournament,
    scrollExpandedPanelIntoView,
  }
}
