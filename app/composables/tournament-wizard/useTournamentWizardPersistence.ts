// Вторая часть мастера турнира: синхронизация с сервером, ВК-слоты, сохранение и сброс.
// Вынесено из useTournamentWizard.ts, чтобы файл уложился в лимит ESLint max-lines.
import type { ComputedRef, Ref } from 'vue'
import type { Player, MatchStatus } from '~/types/tournament'
import type { TeamAssignmentComposable } from '~/composables/useTeamAssignment'
import type { TournamentStateSyncApi } from '~/composables/useTournamentState'
import { useSyncAssignmentFromVkTeamLabels } from '~/composables/useSyncAssignmentFromVkTeamLabels'
import { useSyncVkFromTournamentAssignment } from '~/composables/useSyncVkFromTournamentAssignment'
import { useTournamentServerRosterPullWatch } from '~/composables/useTournamentServerRosterPullWatch'
import { normalizeTeamColorsMap, normalizeTeamName } from '~/utils/teamNames'
import type { SavedStandingsSnapshot, SavedTournamentContext } from '~/composables/tournament-wizard/savedContextTypes'
import { applyEmptyTournamentContextLocal, applyLoadedContext } from '~/composables/tournament-wizard/applyServerContext'
import type { WizardServerContextDeps } from '~/composables/tournament-wizard/applyServerContext'

/** Согласовано с server/utils/tournamentPaidPlayers parseVkTeamSlots. */
const VK_TEAM_SLOT_NAME_MAX = 40
const VK_TEAM_SLOT_MAX = 9

export type TournamentWizardPersistenceCtx = {
  stateSync: TournamentStateSyncApi
  refreshTeams: () => Promise<void>
  assignment: TeamAssignmentComposable
  step: Ref<0 | 1 | 2>
  tournamentName: Ref<string>
  tournamentDate: Ref<string>
  venueLabel: Ref<string>
  formatLabel: Ref<string>
  selectedIds: Ref<Set<number>>
  vkTeamLabelByPlayerId: Ref<Record<number, string>>
  vkTeamSlots: Ref<string[]>
  vkListTournament: Ref<boolean>
  selectedPlayers: ComputedRef<Player[]>
  playerSearch: Ref<string>
  standingsSnapshot: Ref<SavedStandingsSnapshot | null>
  matchStatus: Ref<MatchStatus>
  liveHomeTeam: Ref<string>
  liveAwayTeam: Ref<string>
  stateRestored: Ref<boolean>
  lastAppliedRosterKey: Ref<string>
  suppressContextPersistFromReapply: Ref<boolean>
  existingTeamNames: ComputedRef<string[]>
  DEFAULT_AUTO_TEAM_NAME: RegExp
}

export function useTournamentWizardPersistence(ctx: TournamentWizardPersistenceCtx) {
  const {
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
  } = ctx

  const { serverState, isLoading, saveTournamentState, saveTournamentStateNow, cancelPendingSave, refresh } =
    stateSync

  const paidPlayerIds = ref<Set<number>>(new Set())

  /**
   * Режим s tr (кнопки команд в чате) — не s prof. Эвристика `vkListTournament` может дать true из старых подписей
   * без флага; для блока «Команды в списке ВК» смотрим явный флаг в state и/или слоты.
   */
  const vkTrTournament = computed(() => {
    if (!vkListTournament.value) {
      return false
    }
    const s = serverState.value
    if (s?.vkListTournament === false) {
      return false
    }
    if (s?.vkListTournament === true) {
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

  const serverContextDeps = computed<WizardServerContextDeps>(() => ({
    lastAppliedRosterKey,
    step,
    tournamentName,
    tournamentDate,
    venueLabel,
    formatLabel,
    selectedIds,
    vkTeamLabelByPlayerId,
    vkTeamSlots,
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
    ([s, loading]) => {
      if (loading || stateRestored.value) return

      stateRestored.value = true

      applyLoadedContext(serverContextDeps.value, s ?? null, 'initial')
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
    for (const slot of slots) {
      if (slot.replace(/\s+/g, ' ').trim().toLowerCase() === low) {
        return slot
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

  async function onAddNewTeam() {
    const added = assignment.addNewTeam(assignment.newTeamName.value)
    assignment.newTeamName.value = ''
    if (added) {
      if (!import.meta.client) return
      if (DEFAULT_AUTO_TEAM_NAME.test(normalizeTeamName(added))) return
      try {
        await $fetch('/api/teams', { method: 'POST' as const, body: { name: added } })
        await refreshTeams()
      } catch (e) {
        console.error('[teams] persist new team failed:', e)
      }
    }
  }

  return {
    paidPlayerIds,
    vkTrTournament,
    serverContextDeps,
    reapplyFromServer,
    serializeVkTeamLabelsForSave,
    findMatchingSlot,
    addVkTeamSlot,
    removeVkTeamSlot,
    setPlayerVkTeam,
    savedContext,
    saveStandingsSnapshot,
    updateMatchStatus,
    goToTeams,
    setPlayerPaid,
    resetWizard,
    saveCurrentTournamentStateNow,
    onAddNewTeam,
  }
}
