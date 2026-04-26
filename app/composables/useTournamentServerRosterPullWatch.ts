import type { ComputedRef, Ref } from 'vue'
import { watch } from 'vue'
import type { SavedTournamentContext } from '~/composables/tournament-wizard/savedContextTypes'
import {
  rosterSyncFingerprint,
  vkListTournamentFromSavedContext,
  vkTeamLabelMapFromSavedContext,
  vkTeamSlotsFromSavedContext,
} from '~/composables/tournament-wizard/applyServerContext'

/** Подтягиваем состав/ВК с сервера в локальные refs, если админ не правил ростер с этой вкладки. */
export function useTournamentServerRosterPullWatch(opts: {
  stateRestored: Ref<boolean>
  isLoading: Ref<boolean>
  serverState: ComputedRef<SavedTournamentContext | null>
  selectedIds: Ref<Set<number>>
  vkTeamLabelByPlayerId: Ref<Record<number, string>>
  vkTeamSlots: Ref<string[]>
  vkListTournament: Ref<boolean>
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
      ] as const,
    () => {
      if (!opts.stateRestored.value || opts.isLoading.value) return
      const ctx = opts.serverState.value
      if (!ctx) return
      const serverVkList = vkListTournamentFromSavedContext(ctx)
      const serverLabels = serverVkList ? vkTeamLabelMapFromSavedContext(ctx) : {}
      const serverSlots = serverVkList ? vkTeamSlotsFromSavedContext(ctx) : []
      const serverKey = rosterSyncFingerprint(
        new Set((ctx.selectedIds ?? []).filter((id) => Number.isFinite(id))),
        serverLabels,
        serverSlots,
        serverVkList,
      )
      const localKey = rosterSyncFingerprint(
        opts.selectedIds.value,
        opts.vkTeamLabelByPlayerId.value,
        opts.vkTeamSlots.value,
        opts.vkListTournament.value,
      )
      if (serverKey === localKey) {
        opts.lastAppliedRosterKey.value = serverKey
        return
      }
      if (localKey === opts.lastAppliedRosterKey.value) {
        opts.selectedIds.value = new Set((ctx.selectedIds ?? []).filter((id) => Number.isFinite(id)))
        opts.vkListTournament.value = serverVkList
        opts.vkTeamLabelByPlayerId.value = serverLabels
        opts.vkTeamSlots.value = serverSlots
        opts.lastAppliedRosterKey.value = serverKey
      }
    },
  )
}
