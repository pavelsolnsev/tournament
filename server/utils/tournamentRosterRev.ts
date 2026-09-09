/**
 * Состав турнира правит только полный админ (и бот из ВК), а PUT со всем состоянием шлёт
 * каждое устройство — в том числе судья, который отмечает статистику. Пока судья не подтянул
 * свежий состав, его сохранение откатывало добавленного или удалённого игрока.
 * Поэтому у ростера есть монотонная версия: менять состав может только тот, кто прислал версию
 * больше сохранённой (он реально правил ростер). Остальные PUT для состава — только чтение.
 */

/** Поля, которые описывают состав турнира и расстановку по командам. */
const ROSTER_KEYS = [
  'selectedIds',
  'assignmentByPlayerId',
  'confirmedTeamNames',
  'teamColors',
  'vkTeamLabelByPlayerId',
  'vkTeamSlots',
] as const

export function rosterRevOf(json: Record<string, unknown> | null | undefined): number {
  const n = Math.floor(Number(json?.rosterRev))
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Версия ростера выросла: вызывают бот и другие серверные правки состава (join / leave / set-team). */
export function bumpRosterRev(state: Record<string, unknown>): void {
  state.rosterRev = rosterRevOf(state) + 1
}

/**
 * Мутирует nextCtx: если пришедшее состояние не заявляет новую версию ростера,
 * состав и команды берём из БД. Так отметка судьи не откатывает правку админа или запись из ВК.
 */
export function mergeRosterIntoNextState(
  prevCtx: Record<string, unknown>,
  nextCtx: Record<string, unknown>,
): void {
  const prevRev = rosterRevOf(prevCtx)
  if (rosterRevOf(nextCtx) > prevRev) return

  for (const key of ROSTER_KEYS) {
    if (prevCtx[key] === undefined) {
      Reflect.deleteProperty(nextCtx, key)
      continue
    }
    nextCtx[key] = prevCtx[key]
  }
  nextCtx.rosterRev = prevRev
}
