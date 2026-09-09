// Версия состава для тела PUT. Состав турнира может менять только та вкладка, которая
// реально его правила: она заявляет версию больше сохранённой, и сервер такую правку принимает.
// Остальные сохранения (например, отметки судьи) шлют серверную версию — их состав в БД не попадёт.
import type { ComputedRef, Ref } from 'vue'
import { computed } from 'vue'
import type { SavedTournamentContext } from '~/composables/tournament-wizard/savedContextTypes'
import { rosterSyncFingerprint } from '~/composables/tournament-wizard/applyServerContext'

export function useRosterRevForSave(deps: {
  serverState: ComputedRef<SavedTournamentContext | null>
  selectedIds: Ref<Set<number>>
  vkTeamLabelByPlayerId: Ref<Record<number, string>>
  vkTeamSlots: Ref<string[]>
  vkListTournament: Ref<boolean>
  assignment: {
    assignment: Ref<Record<number, string>>
    confirmedTeamNames: Ref<Set<string>>
    teamColors: Ref<Record<string, number>>
  }
  lastAppliedRosterKey: Ref<string>
}): ComputedRef<number> {
  // Отпечаток ростера этой вкладки: если он разошёлся с последним применённым с сервера,
  // значит состав правили здесь.
  const localRosterKey = computed(() =>
    rosterSyncFingerprint({
      selectedIds: deps.selectedIds.value,
      vkTeamLabelByPlayerId: deps.vkTeamLabelByPlayerId.value,
      vkTeamSlots: deps.vkTeamSlots.value,
      vkListTournament: deps.vkListTournament.value,
      assignmentByPlayerId: deps.assignment.assignment.value,
      confirmedTeamNames: deps.assignment.confirmedTeamNames.value,
      teamColors: deps.assignment.teamColors.value,
    }),
  )

  const serverRosterRev = computed(() => {
    const n = Math.floor(Number(deps.serverState.value?.rosterRev))
    return Number.isFinite(n) && n > 0 ? n : 0
  })

  return computed(() =>
    localRosterKey.value === deps.lastAppliedRosterKey.value
      ? serverRosterRev.value
      : serverRosterRev.value + 1,
  )
}
