import type { ComputedRef, Ref } from 'vue'
import { watch } from 'vue'
import type { SavedTournamentContext } from '~/composables/tournament-wizard/savedContextTypes'
import {
  assignmentFromSavedContext,
  confirmedTeamNamesFromSavedContext,
  rosterSyncFingerprint,
  teamColorsFromSavedContext,
  vkListTournamentFromSavedContext,
  vkTeamLabelMapFromSavedContext,
  vkTeamSlotsFromSavedContext,
} from '~/composables/tournament-wizard/applyServerContext'

/** Подтягиваем состав/команды/ВК с сервера в локальные refs, если админ не правил ростер с этой вкладки. */
export function useTournamentServerRosterPullWatch(opts: {
  stateRestored: Ref<boolean>
  isLoading: Ref<boolean>
  serverState: ComputedRef<SavedTournamentContext | null>
  selectedIds: Ref<Set<number>>
  vkTeamLabelByPlayerId: Ref<Record<number, string>>
  vkTeamSlots: Ref<string[]>
  vkListTournament: Ref<boolean>
  assignmentByPlayerId: Ref<Record<number, string>>
  confirmedTeamNames: Ref<Set<string>>
  teamColors: Ref<Record<string, number>>
  lastAppliedRosterKey: Ref<string>
}) {
  watch(
    () =>
      [
        opts.isLoading.value,
        opts.serverState.value?.selectedIds,
        opts.serverState.value?.vkTeamLabelByPlayerId,
        opts.serverState.value?.vkTeamSlots,
        opts.serverState.value?.vkListTournament,
        opts.serverState.value?.assignmentByPlayerId,
        opts.serverState.value?.confirmedTeamNames,
        opts.serverState.value?.teamColors,
      ] as const,
    () => {
      if (!opts.stateRestored.value || opts.isLoading.value) return
      const ctx = opts.serverState.value
      if (!ctx) return
      const serverVkList = vkListTournamentFromSavedContext(ctx)
      const serverLabels = serverVkList ? vkTeamLabelMapFromSavedContext(ctx) : {}
      const serverSlots = serverVkList ? vkTeamSlotsFromSavedContext(ctx) : []
      const serverAssignment = assignmentFromSavedContext(ctx)
      const serverConfirmed = confirmedTeamNamesFromSavedContext(ctx)
      const serverColors = teamColorsFromSavedContext(ctx)
      const serverKey = rosterSyncFingerprint({
        selectedIds: new Set((ctx.selectedIds ?? []).filter((id) => Number.isFinite(id))),
        vkTeamLabelByPlayerId: serverLabels,
        vkTeamSlots: serverSlots,
        vkListTournament: serverVkList,
        assignmentByPlayerId: serverAssignment,
        confirmedTeamNames: serverConfirmed,
        teamColors: serverColors,
      })
      const localKey = rosterSyncFingerprint({
        selectedIds: opts.selectedIds.value,
        vkTeamLabelByPlayerId: opts.vkTeamLabelByPlayerId.value,
        vkTeamSlots: opts.vkTeamSlots.value,
        vkListTournament: opts.vkListTournament.value,
        assignmentByPlayerId: opts.assignmentByPlayerId.value,
        confirmedTeamNames: opts.confirmedTeamNames.value,
        teamColors: opts.teamColors.value,
      })
      if (serverKey === localKey) {
        opts.lastAppliedRosterKey.value = serverKey
        return
      }
      // Локальных правок ростера нет — значит состав поменяли на другом устройстве или в ВК, забираем его.
      if (localKey === opts.lastAppliedRosterKey.value) {
        opts.selectedIds.value = new Set((ctx.selectedIds ?? []).filter((id) => Number.isFinite(id)))
        opts.vkListTournament.value = serverVkList
        opts.vkTeamLabelByPlayerId.value = serverLabels
        opts.vkTeamSlots.value = serverSlots
        opts.assignmentByPlayerId.value = serverAssignment
        opts.confirmedTeamNames.value = new Set(serverConfirmed)
        opts.teamColors.value = serverColors
        opts.lastAppliedRosterKey.value = serverKey
      }
    },
  )
}
