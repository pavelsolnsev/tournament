// Убрать игрока из турнира «везде»: из участников, подписей команд ВК, расстановки по командам
// (составы на сайте собираются из неё) и отметок оплаты. Раньше выход через ВК убирал только
// из участников — в составах команд игрок оставался.

type State = Record<string, unknown>

function objectWithout(raw: unknown, key: string): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const next = { ...(raw as Record<string, unknown>) }
  Reflect.deleteProperty(next, key)
  return next
}

/** Мутирует state. Возвращает true, если игрок был среди участников. */
export function removePlayerFromTournamentState(state: State, playerId: number): boolean {
  const ids = Array.isArray(state.selectedIds) ? (state.selectedIds as unknown[]).map(Number) : []
  const wasSelected = ids.includes(playerId)
  state.selectedIds = ids.filter((id) => id !== playerId)

  const key = String(playerId)
  const labels = objectWithout(state.vkTeamLabelByPlayerId, key)
  if (labels) {
    if (Object.keys(labels).length === 0) Reflect.deleteProperty(state, 'vkTeamLabelByPlayerId')
    else state.vkTeamLabelByPlayerId = labels
  }

  const assignment = objectWithout(state.assignmentByPlayerId, key)
  if (assignment) state.assignmentByPlayerId = assignment

  if (Array.isArray(state.paidPlayerIds)) {
    state.paidPlayerIds = (state.paidPlayerIds as unknown[]).map(Number).filter((id) => id !== playerId)
  }

  return wasSelected
}

/**
 * Расстановка по командам только для участников турнира: кого нет в selectedIds, в составах быть не должно
 * (например, отставшая вкладка прислала расстановку с игроком, который уже вышел через ВК).
 */
export function pruneAssignmentToSelected(state: State): void {
  const raw = state.assignmentByPlayerId
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return
  const selected = new Set(
    (Array.isArray(state.selectedIds) ? (state.selectedIds as unknown[]) : []).map((id) => String(Number(id))),
  )
  state.assignmentByPlayerId = Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).filter(([k]) => selected.has(String(Number(k)))),
  )
}
