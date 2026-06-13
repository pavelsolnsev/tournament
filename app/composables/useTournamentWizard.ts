// Мастер турнира: шаги, состав, сохранение в БД.
import type { Player, Team, MatchStatus } from '~/types/tournament'
import { useTeamAssignment } from '~/composables/useTeamAssignment'
import type { TournamentStateSyncApi } from '~/composables/useTournamentState'
import { useSyncAssignmentFromVkTeamLabels } from '~/composables/useSyncAssignmentFromVkTeamLabels'
import { useSyncVkFromTournamentAssignment } from '~/composables/useSyncVkFromTournamentAssignment'
import { useTournamentServerRosterPullWatch } from '~/composables/useTournamentServerRosterPullWatch'
import { dedupeTeamNamesPreservingOrder, normalizeTeamColorsMap, normalizeTeamName } from '~/utils/teamNames'
import type { SavedStandingsSnapshot, SavedTournamentContext } from '~/composables/tournament-wizard/savedContextTypes'
import { applyEmptyTournamentContextLocal, applyLoadedContext } from '~/composables/tournament-wizard/applyServerContext'
import { findMatchingSlot, useVkTeamSlots } from '~/composables/tournament-wizard/useVkTeamSlots'

export type { SavedStandingsSnapshot, SavedTournamentContext } from '~/composables/tournament-wizard/savedContextTypes'

export function useTournamentWizard(stateSync: TournamentStateSyncApi) {
  const step = ref<0 | 1 | 2>(0)
  const tournamentName = ref('')
  const tournamentDate = ref('')
  const venueLabel = ref('')
  const formatLabel = ref('')

  const { data: players, refresh: refreshPlayers } = useFetch<Player[]>('/api/players', {
    default: () => [],
  })

  const { data: teamsFromApi, refresh: refreshTeams } = useFetch<Team[]>('/api/teams', {
    default: () => [],
  })

  const existingTeamNames = computed(() =>
    dedupeTeamNamesPreservingOrder((teamsFromApi.value ?? []).map((t) => t.name)),
  )

  const assignment = useTeamAssignment(existingTeamNames)

  const confirmedTeamsList = computed(() => Array.from(assignment.confirmedTeamNames.value))

  const selectedIds = ref<Set<number>>(new Set())
  const vkTeamLabelByPlayerId = ref<Record<number, string>>({})
  const vkTeamSlots = ref<string[]>([])
  const vkTeamLimits = ref<Record<string, number>>({})
  const vkListTournament = ref(false)

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
    vkTeamLabelByPlayerId.value = Object.fromEntries(
      Object.entries(vkTeamLabelByPlayerId.value).filter(([k]) => Number(k) !== id),
    ) as Record<number, string>
  }

  const DEFAULT_AUTO_TEAM_NAME = /^Команда \d+$/i

  async function persistNewTeamToDb(name: string) {
    if (!import.meta.client) return
    if (DEFAULT_AUTO_TEAM_NAME.test(normalizeTeamName(name))) return
    try {
      await $fetch('/api/teams', { method: 'POST' as const, body: { name } })
      await refreshTeams()
    } catch (e) {
      console.error('[teams] persist new team failed:', e)
    }
  }

  function onAddNewTeam() {
    const added = assignment.addNewTeam(assignment.newTeamName.value)
    assignment.newTeamName.value = ''
    if (added) {
      void persistNewTeamToDb(added)
    }
  }

  const standingsSnapshot = ref<SavedStandingsSnapshot | null>(null)

  const matchStatus = ref<MatchStatus>('upcoming')
  const liveHomeTeam = ref('')
  const liveAwayTeam = ref('')

  const stateRestored = ref(false)
  const lastAppliedRosterKey = ref('')

  /** Пока перезаливаем мастер из `serverState` — не пишем тот же снимок обратно в БД (PUT + лишний GET). */
  const suppressContextPersistFromReapply = ref(false)

  const { serverState, isLoading, saveTournamentState, saveTournamentStateNow, cancelPendingSave, refresh } = stateSync

  const paidPlayerIds = ref<Set<number>>(new Set())

  /**
   * Режим s tr (кнопки команд в чате) — не s prof. Эвристика `vkListTournament` может дать true из старых подписей
   * без флага; для блока «Команды в списке ВК» смотрим явный флаг в state и/или слоты.
   */
  const vkTrTournament = computed(() => {
    if (!vkListTournament.value) {
      return false
    }
    const ctx = serverState.value
    if (ctx?.vkListTournament === false) {
      return false
    }
    if (ctx?.vkListTournament === true) {
      return true
    }
    if (vkTeamSlots.value.length > 0) {
      return true
    }
    return false
  })

  const emptyResetState = (): SavedTournamentContext => ({
    step: 0,
    tournamentName: '',
    tournamentDate: '',
    venueLabel: '',
    formatLabel: '',
    selectedIds: [],
    paidPlayerIds: [],
    vkTeamLabelByPlayerId: {},
    vkTeamSlots: [],
    vkTeamLimits: {},
    vkListTournament: false,
    assignmentByPlayerId: {},
    confirmedTeamNames: [],
    teamColors: {},
    standingsSnapshot: null,
    matchStatus: 'upcoming',
    liveHomeTeam: '',
    liveAwayTeam: '',
    __fullReset: true,
  })

  const serverContextDeps = computed(() => ({
    lastAppliedRosterKey,
    step,
    tournamentName,
    tournamentDate,
    venueLabel,
    formatLabel,
    selectedIds,
    vkTeamLabelByPlayerId,
    vkTeamSlots,
    vkTeamLimits,
    vkListTournament,
    paidPlayerIds,
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
    cancelPendingSave()
    suppressContextPersistFromReapply.value = true
    applyLoadedContext(serverContextDeps.value, serverState.value ?? null, 'resync')
    setTimeout(() => {
      suppressContextPersistFromReapply.value = false
    }, 0)
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

  const {
    serializeVkTeamLabelsForSave,
    addVkTeamSlot,
    removeVkTeamSlot,
    setVkTeamLimit,
    setPlayerVkTeam,
  } = useVkTeamSlots({
    selectedIds,
    vkTeamLabelByPlayerId,
    vkTeamSlots,
    vkTeamLimits,
    stateRestored,
    cancelPendingSave,
    saveTournamentStateNow,
    getSavedContext: () => savedContext.value,
  })

  useSyncAssignmentFromVkTeamLabels({
    stateRestored,
    existingTeamNames,
    selectedIds,
    selectedPlayers,
    vkListTournament,
    vkTeamLabelByPlayerId,
    assignment,
  })

  useTournamentServerRosterPullWatch({
    stateRestored,
    isLoading,
    serverState,
    selectedIds,
    vkTeamLabelByPlayerId,
    vkTeamSlots,
    vkListTournament,
    lastAppliedRosterKey,
  })

  const savedContext = computed<SavedTournamentContext>(() => ({
    step: step.value,
    tournamentName: tournamentName.value,
    tournamentDate: tournamentDate.value,
    venueLabel: venueLabel.value,
    formatLabel: formatLabel.value,
    selectedIds: Array.from(selectedIds.value),
    vkTeamLabelByPlayerId: serializeVkTeamLabelsForSave(),
    vkTeamSlots: [...vkTeamSlots.value],
    vkTeamLimits: { ...vkTeamLimits.value },
    vkListTournament: vkListTournament.value,
    assignmentByPlayerId: assignment.assignment.value,
    confirmedTeamNames: Array.from(assignment.confirmedTeamNames.value),
    teamColors: normalizeTeamColorsMap(assignment.teamColors.value),
    standingsSnapshot: standingsSnapshot.value,
    matchStatus: matchStatus.value,
    liveHomeTeam: liveHomeTeam.value,
    liveAwayTeam: liveAwayTeam.value,
  }))

  useSyncVkFromTournamentAssignment({
    stateRestored,
    step,
    selectedIds,
    vkListTournament,
    vkTeamSlots,
    vkTeamLabelByPlayerId,
    assignment: { getTeam: assignment.getTeam, assignment: assignment.assignment },
    savedContext,
    cancelPendingSave,
    saveTournamentStateNow,
    findMatchingSlot,
  })

  watch(
    savedContext,
    (val) => {
      if (!stateRestored.value) return
      if (suppressContextPersistFromReapply.value) return
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

  async function setPlayerPaid(playerId: number, paid: boolean) {
    cancelPendingSave()
    await $fetch('/api/tournament/player-paid', {
      method: 'POST',
      body: { playerId, paid },
    })
    await refresh()
    reapplyFromServer()
  }

  async function resetWizard() {
    // Сначала отменяем отложенный PUT — иначе через ~800мс в БД улетит старый снимок и перетрёт очистку.
    cancelPendingSave()
    await saveTournamentStateNow(emptyResetState())
    if (stateRestored.value) {
      reapplyFromServer()
    } else {
      applyEmptyTournamentContextLocal(serverContextDeps.value)
    }
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
    vkTeamLabelByPlayerId,
    vkTeamSlots,
    vkTeamLimits,
    vkListTournament,
    vkTrTournament,
    setPlayerVkTeam,
    addVkTeamSlot,
    removeVkTeamSlot,
    setVkTeamLimit,
    paidPlayerIds,
    setPlayerPaid,
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
