// Этот файл: композабл мастера создания турнира (wizard).
// Он хранит шаги, данные игроков/команд и связывает всё вместе через composables.
// Состояние теперь сохраняется в базу данных (не в cookie) для синхронизации между устройствами.
import type { Player, Team, MatchStatus } from '~/types/tournament'
import { useTeamAssignment } from '~/composables/useTeamAssignment'
import type { TournamentStateSyncApi } from '~/composables/useTournamentState'
import { dedupeTeamNamesPreservingOrder, normalizeTeamColorsMap } from '~/utils/teamNames'
import type { SavedStandingsSnapshot, SavedTournamentContext } from '~/composables/tournament-wizard/savedContextTypes'
import { applyLoadedContext, selectedIdsFingerprint } from '~/composables/tournament-wizard/applyServerContext'

export type { SavedStandingsSnapshot, SavedTournamentContext } from '~/composables/tournament-wizard/savedContextTypes'

// Управляет мастером создания турнира:
// шаги, загрузка данных, выбор игроков/команд и сохранение состояния в базу данных.
// stateSync передаётся снаружи — один useTournamentState() на странице, без второго параллельного GET.
export function useTournamentWizard(stateSync: TournamentStateSyncApi) {
  const step = ref<0 | 1 | 2>(0)
  const tournamentName = ref('')
  const tournamentDate = ref('')
  const venueLabel = ref('')
  const formatLabel = ref('')

  const { data: players, refresh: refreshPlayers } = useFetch<Player[]>('/api/players', {
    default: () => [],
  })

  const { data: teamsFromApi } = useFetch<Team[]>('/api/teams', {
    default: () => [],
  })

  const existingTeamNames = computed(() =>
    dedupeTeamNamesPreservingOrder((teamsFromApi.value ?? []).map((t) => t.name)),
  )

  const assignment = useTeamAssignment(existingTeamNames)

  const confirmedTeamsList = computed(() => Array.from(assignment.confirmedTeamNames.value))

  const selectedIds = ref<Set<number>>(new Set())

  const selectedPlayers = computed(() => {
    const list = players.value ?? []
    return list.filter((p) => selectedIds.value.has(p.id))
  })

  const availablePlayers = computed(() => {
    const list = players.value ?? []
    return list.filter((p) => !selectedIds.value.has(p.id))
  })

  const playerSearch = ref('')
  const filteredAvailablePlayers = computed(() => {
    const list = availablePlayers.value
    const term = playerSearch.value.trim().toLowerCase()

    if (term.length < 1) return list

    const normalized = term.replace(/^@/, '')

    return list.filter((p) => {
      const name = p.name.toLowerCase()
      const username = (p.username || '').replace(/^@/, '').toLowerCase()
      return name.includes(term) || (!!username && username.includes(normalized))
    })
  })

  function selectPlayer(id: number) {
    const next = new Set(selectedIds.value)
    next.add(id)
    selectedIds.value = next
  }

  function removePlayer(id: number) {
    assignment.removeFromTeam(id)
    const next = new Set(selectedIds.value)
    next.delete(id)
    selectedIds.value = next
  }

  function onAddNewTeam() {
    assignment.addNewTeam(assignment.newTeamName.value)
    assignment.newTeamName.value = ''
  }

  const standingsSnapshot = ref<SavedStandingsSnapshot | null>(null)

  const matchStatus = ref<MatchStatus>('upcoming')
  const liveHomeTeam = ref('')
  const liveAwayTeam = ref('')

  const stateRestored = ref(false)
  const lastAppliedSelectedIdsKey = ref('')

  const { serverState, isLoading, saveTournamentState, saveTournamentStateNow } = stateSync

  const serverContextDeps = computed(() => ({
    lastAppliedSelectedIdsKey,
    step,
    tournamentName,
    tournamentDate,
    venueLabel,
    formatLabel,
    selectedIds,
    playerSearch,
    assignment: {
      assignment: assignment.assignment,
      confirmedTeamNames: assignment.confirmedTeamNames,
      teamColors: assignment.teamColors,
      newTeamNames: assignment.newTeamNames,
      newTeamName: assignment.newTeamName,
    },
    standingsSnapshot,
    matchStatus,
    liveHomeTeam,
    liveAwayTeam,
    existingTeamNames,
  }))

  function reapplyFromServer() {
    if (!stateRestored.value) return
    applyLoadedContext(serverContextDeps.value, serverState.value ?? null, 'resync')
  }

  watch(
    [serverState, isLoading],
    ([ctx, loading]) => {
      if (loading || stateRestored.value) return

      stateRestored.value = true

      applyLoadedContext(serverContextDeps.value, ctx ?? null, 'initial')
    },
    { immediate: true },
  )

  watch(
    () => [isLoading.value, selectedIdsFingerprint(serverState.value?.selectedIds)] as const,
    () => {
      if (!stateRestored.value || isLoading.value) {
        return
      }
      const ctx = serverState.value
      if (!ctx) {
        return
      }
      const serverKey = selectedIdsFingerprint(ctx.selectedIds)
      const localKey = selectedIdsFingerprint(selectedIds.value)
      if (serverKey === localKey) {
        lastAppliedSelectedIdsKey.value = serverKey
        return
      }
      if (localKey === lastAppliedSelectedIdsKey.value) {
        selectedIds.value = new Set(
          (ctx.selectedIds ?? []).filter((id) => Number.isFinite(id)),
        )
        lastAppliedSelectedIdsKey.value = serverKey
      }
    },
  )

  const savedContext = computed<SavedTournamentContext>(() => ({
    step: step.value,
    tournamentName: tournamentName.value,
    tournamentDate: tournamentDate.value,
    venueLabel: venueLabel.value,
    formatLabel: formatLabel.value,
    selectedIds: Array.from(selectedIds.value),
    assignmentByPlayerId: assignment.assignment.value,
    confirmedTeamNames: Array.from(assignment.confirmedTeamNames.value),
    teamColors: normalizeTeamColorsMap(assignment.teamColors.value),
    standingsSnapshot: standingsSnapshot.value,
    matchStatus: matchStatus.value,
    liveHomeTeam: liveHomeTeam.value,
    liveAwayTeam: liveAwayTeam.value,
  }))

  watch(
    savedContext,
    (val) => {
      if (!stateRestored.value) return
      saveTournamentState(val)
    },
    { deep: true },
  )

  function saveStandingsSnapshot(snapshot: SavedStandingsSnapshot) {
    standingsSnapshot.value = snapshot
  }

  function updateMatchStatus(status: MatchStatus, home: string, away: string) {
    matchStatus.value = status
    liveHomeTeam.value = home
    liveAwayTeam.value = away
  }

  function goToTeams() {
    if (!tournamentDate.value) {
      tournamentDate.value = new Date().toISOString().slice(0, 10)
    }
    step.value = 1
  }

  async function resetWizard() {
    step.value = 0
    tournamentName.value = ''
    tournamentDate.value = ''

    selectedIds.value = new Set()
    playerSearch.value = ''

    assignment.assignment.value = {}
    assignment.confirmedTeamNames.value = new Set()
    assignment.teamColors.value = {}
    assignment.newTeamNames.value = []
    assignment.newTeamName.value = ''

    standingsSnapshot.value = null

    matchStatus.value = 'upcoming'
    liveHomeTeam.value = ''
    liveAwayTeam.value = ''

    venueLabel.value = ''
    formatLabel.value = ''

    await saveTournamentStateNow({
      step: 0,
      tournamentName: '',
      tournamentDate: '',
      venueLabel: '',
      formatLabel: '',
      selectedIds: [],
      assignmentByPlayerId: {},
      confirmedTeamNames: [],
      teamColors: {},
      standingsSnapshot: null,
      matchStatus: 'upcoming',
      liveHomeTeam: '',
      liveAwayTeam: '',
    })
  }

  async function saveCurrentTournamentStateNow() {
    await saveTournamentStateNow(savedContext.value)
  }

  return {
    step,
    tournamentName,
    tournamentDate,
    venueLabel,
    formatLabel,
    goToTeams,
    players,
    refreshPlayers,
    assignment,
    confirmedTeamsList,
    selectedPlayers,
    availablePlayers,
    playerSearch,
    filteredAvailablePlayers,
    selectPlayer,
    removePlayer,
    onAddNewTeam,
    standingsSnapshot,
    saveStandingsSnapshot,
    matchStatus,
    liveHomeTeam,
    liveAwayTeam,
    updateMatchStatus,
    resetWizard,
    saveCurrentTournamentStateNow,
    stateRestored,
    reapplyFromServer,
  }
}
