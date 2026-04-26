import type { ComputedRef, Ref } from 'vue'
import { watch } from 'vue'
import type { SavedTournamentContext } from '~/composables/tournament-wizard/savedContextTypes'
import {
  rosterSyncFingerprint,
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
  lastAppliedRosterKey: Ref<string>
}) {
  watch(
    () =>
      [
        opts.isLoading.value,
        opts.serverState.value?.selectedIds,
        opts.serverState.value?.vkTeamLabelByPlayerId,
        opts.serverState.value?.vkTeamSlots,
      ] as const,
    () => {
      if (!opts.stateRestored.value || opts.isLoading.value) return
      const ctx = opts.serverState.value
      if (!ctx) return
      const serverKey = rosterSyncFingerprint(
        new Set((ctx.selectedIds ?? []).filter((id) => Number.isFinite(id))),
        vkTeamLabelMapFromSavedContext(ctx),
        vkTeamSlotsFromSavedContext(ctx),
      )
      const localKey = rosterSyncFingerprint(
        opts.selectedIds.value,
        opts.vkTeamLabelByPlayerId.value,
        opts.vkTeamSlots.value,
      )
      if (serverKey === localKey) {
        opts.lastAppliedRosterKey.value = serverKey
        return
      }
      if (localKey === opts.lastAppliedRosterKey.value) {
        opts.selectedIds.value = new Set((ctx.selectedIds ?? []).filter((id) => Number.isFinite(id)))
        opts.vkTeamLabelByPlayerId.value = vkTeamLabelMapFromSavedContext(ctx)
        opts.vkTeamSlots.value = vkTeamSlotsFromSavedContext(ctx)
        opts.lastAppliedRosterKey.value = serverKey
      }
    },
  )
}
