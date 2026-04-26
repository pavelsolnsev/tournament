import type { SavedTournamentContext } from '~/composables/tournament-wizard/savedContextTypes'

/** Проверка после «Очистить данные»: в БД не должно остаться состава/таблицы. */
export function isTournamentVisuallyCleared(s: SavedTournamentContext | null): boolean {
  if (s == null) return true
  const hasAssignments = Object.keys(s.assignmentByPlayerId ?? {}).length > 0
  const hasConfirmed = (s.confirmedTeamNames?.length ?? 0) > 0
  const hasPaid = (s.paidPlayerIds?.length ?? 0) > 0
  const hasVkTeams = Object.keys(s.vkTeamLabelByPlayerId ?? {}).length > 0
  const hasVkSlots = (s.vkTeamSlots?.length ?? 0) > 0
  return (
    s.step === 0 &&
    (s.selectedIds?.length ?? 0) === 0 &&
    !hasAssignments &&
    !hasConfirmed &&
    !hasPaid &&
    !hasVkTeams &&
    !hasVkSlots &&
    s.standingsSnapshot == null
  )
}
