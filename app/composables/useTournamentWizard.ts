// Этот файл: композабл мастера создания турнира (wizard).
// Он хранит шаги, данные игроков/команд и связывает всё вместе через composables.
// Состояние теперь сохраняется в базу данных (не в cookie) для синхронизации между устройствами.
import type { Player, Team, MatchStatus } from '~/types/tournament'
import { useTeamAssignment } from '~/composables/useTeamAssignment'
import type { TournamentStateSyncApi } from '~/composables/useTournamentState'
import { dedupeTeamNamesPreservingOrder, normalizeTeamColorsMap } from '~/utils/teamNames'
import type { SavedStandingsSnapshot, SavedTournamentContext } from '~/composables/tournament-wizard/savedContextTypes'
import {
  applyEmptyTournamentContextLocal,
  applyLoadedContext,
  rosterSyncFingerprint,
  vkTeamLabelMapFromSavedContext,
  vkTeamSlotsFromSavedContext,
} from '~/composables/tournament-wizard/applyServerContext'

/** Согласовано с server/utils/tournamentPaidPlayers parseVkTeamSlots. */
const VK_TEAM_SLOT_NAME_MAX = 40
const VK_TEAM_SLOT_MAX = 9

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
  const vkTeamLabelByPlayerId = ref<Record<number, string>>({})
  const vkTeamSlots = ref<string[]>([])

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

  function onAddNewTeam() {
    assignment.addNewTeam(assignment.newTeamName.value)
    assignment.newTeamName.value = ''
  }

  const standingsSnapshot = ref<SavedStandingsSnapshot | null>(null)

  const matchStatus = ref<MatchStatus>('upcoming')
  const liveHomeTeam = ref('')
  const liveAwayTeam = ref('')

  const stateRestored = ref(false)
  const lastAppliedRosterKey = ref('')

  const { serverState, isLoading, saveTournamentState, saveTournamentStateNow, cancelPendingSave, refresh } = stateSync

  const paidPlayerIds = ref<Set<number>>(new Set())

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

  function serializeVkTeamLabelsForSave(): Record<string, string> {
    const out: Record<string, string> = {}
    for (const id of selectedIds.value) {
      if (Object.prototype.hasOwnProperty.call(vkTeamLabelByPlayerId.value, id)) {
        const v = vkTeamLabelByPlayerId.value[id]
        out[String(id)] = v && String(v).trim() ? String(v).trim() : ''
      }
    }
    return out
  }

  function findMatchingSlot(raw: string, slots: string[]) {
    const t = String(raw || '').replace(/\s+/g, ' ').trim()
    if (!t) return null
    const low = t.toLowerCase()
    for (const s of slots) {
      if (s.replace(/\s+/g, ' ').trim().toLowerCase() === low) {
        return s
      }
    }
    return null
  }

  function addVkTeamSlot(rawName: string) {
    const t = String(rawName ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, VK_TEAM_SLOT_NAME_MAX)
    if (!t) {
      return
    }
    const next = [...vkTeamSlots.value]
    if (findMatchingSlot(t, next) != null) {
      return
    }
    if (next.length >= VK_TEAM_SLOT_MAX) {
      return
    }
    next.push(t)
    vkTeamSlots.value = next
    if (!stateRestored.value) {
      return
    }
    void nextTick(async () => {
      cancelPendingSave()
      try {
        await saveTournamentStateNow(savedContext.value)
      } catch {
        /* ignore */
      }
    })
  }

  function removeVkTeamSlot(rawName: string) {
    const beforeSlots = [...vkTeamSlots.value]
    const m = findMatchingSlot(rawName, beforeSlots)
    if (m == null) {
      return
    }
    const next = beforeSlots.filter((s) => s !== m)
    const v = { ...vkTeamLabelByPlayerId.value }
    for (const id of selectedIds.value) {
      const cur = v[id] != null ? String(v[id]).trim() : ''
      if (cur && findMatchingSlot(cur, beforeSlots) === m) {
        v[id] = ''
      }
    }
    vkTeamSlots.value = next
    vkTeamLabelByPlayerId.value = v
    if (!stateRestored.value) {
      return
    }
    void nextTick(async () => {
      cancelPendingSave()
      try {
        await saveTournamentStateNow(savedContext.value)
      } catch {
        /* ignore */
      }
    })
  }

  function setPlayerVkTeam(playerId: number, nextTeam: string | null) {
    const slots = vkTeamSlots.value
    const v = { ...vkTeamLabelByPlayerId.value }
    if (nextTeam == null || !String(nextTeam).trim()) {
      v[playerId] = ''
    } else {
      const raw = String(nextTeam).trim()
      if (slots.length > 0) {
        const m = findMatchingSlot(raw, slots)
        v[playerId] = m != null && m !== '' ? m : raw
      } else {
        v[playerId] = raw
      }
    }
    vkTeamLabelByPlayerId.value = v
    if (!stateRestored.value) {
      return
    }
    // Сразу пишем в БД, чтобы бот в roster-snapshot увидел смену без debounce 800ms.
    void nextTick(async () => {
      cancelPendingSave()
      try {
        await saveTournamentStateNow(savedContext.value)
      } catch {
        /* 403 / сеть — debounced put попробует снова при следующем изменении */
      }
    })
  }

  watch(
    () =>
      [
        isLoading.value,
        serverState.value?.selectedIds,
        serverState.value?.vkTeamLabelByPlayerId,
        serverState.value?.vkTeamSlots,
      ] as const,
    () => {
      if (!stateRestored.value || isLoading.value) {
        return
      }
      const ctx = serverState.value
      if (!ctx) {
        return
      }
      const serverKey = rosterSyncFingerprint(
        new Set((ctx.selectedIds ?? []).filter((id) => Number.isFinite(id))),
        vkTeamLabelMapFromSavedContext(ctx),
        vkTeamSlotsFromSavedContext(ctx),
      )
      const localKey = rosterSyncFingerprint(
        selectedIds.value,
        vkTeamLabelByPlayerId.value,
        vkTeamSlots.value,
      )
      if (serverKey === localKey) {
        lastAppliedRosterKey.value = serverKey
        return
      }
      if (localKey === lastAppliedRosterKey.value) {
        selectedIds.value = new Set(
          (ctx.selectedIds ?? []).filter((id) => Number.isFinite(id)),
        )
        vkTeamLabelByPlayerId.value = vkTeamLabelMapFromSavedContext(ctx)
        vkTeamSlots.value = vkTeamSlotsFromSavedContext(ctx)
        lastAppliedRosterKey.value = serverKey
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
    vkTeamLabelByPlayerId: serializeVkTeamLabelsForSave(),
    vkTeamSlots: [...vkTeamSlots.value],
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
    setPlayerVkTeam,
    addVkTeamSlot,
    removeVkTeamSlot,
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
