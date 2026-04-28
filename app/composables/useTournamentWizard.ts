// Мастер турнира: шаги, состав, сохранение в БД (часть 1 — локальный UI; часть 2 — useTournamentWizardPersistence).
import type { Player, Team, MatchStatus } from '~/types/tournament'
import { useTeamAssignment } from '~/composables/useTeamAssignment'
import type { TournamentStateSyncApi } from '~/composables/useTournamentState'
import { dedupeTeamNamesPreservingOrder } from '~/utils/teamNames'
import type { SavedStandingsSnapshot } from '~/composables/tournament-wizard/savedContextTypes'
import { useTournamentWizardPersistence } from '~/composables/tournament-wizard/useTournamentWizardPersistence'

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

  const standingsSnapshot = ref<SavedStandingsSnapshot | null>(null)

  const matchStatus = ref<MatchStatus>('upcoming')
  const liveHomeTeam = ref('')
  const liveAwayTeam = ref('')

  const stateRestored = ref(false)
  const lastAppliedRosterKey = ref('')

  /** Пока перезаливаем мастер из `serverState` — не пишем тот же снимок обратно в БД (PUT + лишний GET). */
  const suppressContextPersistFromReapply = ref(false)

  const persist = useTournamentWizardPersistence({
    stateSync,
    refreshTeams,
    assignment,
    step,
    tournamentName,
    tournamentDate,
    venueLabel,
    formatLabel,
    selectedIds,
    vkTeamLabelByPlayerId,
    vkTeamSlots,
    vkListTournament,
    selectedPlayers,
    playerSearch,
    standingsSnapshot,
    matchStatus,
    liveHomeTeam,
    liveAwayTeam,
    stateRestored,
    lastAppliedRosterKey,
    suppressContextPersistFromReapply,
    existingTeamNames,
    DEFAULT_AUTO_TEAM_NAME,
  })

  return {
    step,
    tournamentName,
    tournamentDate,
    venueLabel,
    formatLabel,
    goToTeams: persist.goToTeams,
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
    vkListTournament,
    vkTrTournament: persist.vkTrTournament,
    setPlayerVkTeam: persist.setPlayerVkTeam,
    addVkTeamSlot: persist.addVkTeamSlot,
    removeVkTeamSlot: persist.removeVkTeamSlot,
    paidPlayerIds: persist.paidPlayerIds,
    setPlayerPaid: persist.setPlayerPaid,
    onAddNewTeam: persist.onAddNewTeam,
    standingsSnapshot,
    saveStandingsSnapshot: persist.saveStandingsSnapshot,
    matchStatus,
    liveHomeTeam,
    liveAwayTeam,
    updateMatchStatus: persist.updateMatchStatus,
    resetWizard: persist.resetWizard,
    saveCurrentTournamentStateNow: persist.saveCurrentTournamentStateNow,
    stateRestored,
    reapplyFromServer: persist.reapplyFromServer,
  }
}
