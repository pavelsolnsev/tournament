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
  const delta = takeRosterDelta(nextCtx)
  const prevRev = rosterRevOf(prevCtx)

  if (rosterRevOf(nextCtx) <= prevRev) {
    for (const key of ROSTER_KEYS) {
      if (prevCtx[key] === undefined) {
        Reflect.deleteProperty(nextCtx, key)
        continue
      }
      nextCtx[key] = prevCtx[key]
    }
    nextCtx.rosterRev = prevRev
  }

  // Кто в турнире — считаем от состава в БД, а не от списка из вкладки: применяем только то,
  // что админ сам добавил или убрал. Раньше вкладка присылала весь список, и отставшая вкладка
  // выкидывала тех, кто только что записался кнопкой в ВК (бот потом убирал их и из списка в чате —
  // «нажал, а ничего не произошло»), или возвращала тех, кто вышел через ВК.
  if (delta) {
    const before = idsOf(prevCtx.selectedIds)
    const after = applySelectedIdsDelta(before, delta)
    nextCtx.selectedIds = after
    const changed = after.length !== before.length || after.some((id, i) => id !== before[i])
    if (changed && rosterRevOf(nextCtx) <= prevRev) nextCtx.rosterRev = prevRev + 1
  }
}

export type RosterDelta = { added: number[]; removed: number[] }

function idsOf(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []
  return raw.map(Number).filter((id) => Number.isFinite(id) && id > 0)
}

/** Достаёт из тела PUT служебное поле __rosterDelta (в БД оно не попадает). Нет поля — null (старые клиенты). */
export function takeRosterDelta(nextCtx: Record<string, unknown>): RosterDelta | null {
  const raw = nextCtx.__rosterDelta as { added?: unknown; removed?: unknown } | undefined
  Reflect.deleteProperty(nextCtx, '__rosterDelta')
  if (!raw || typeof raw !== 'object') return null
  return { added: idsOf(raw.added), removed: idsOf(raw.removed) }
}

/** Состав из БД минус убранные админом плюс добавленные (в конец, в порядке добавления). */
export function applySelectedIdsDelta(before: number[], delta: RosterDelta): number[] {
  const removed = new Set(delta.removed)
  const out = before.filter((id) => !removed.has(id))
  const have = new Set(out)
  for (const id of delta.added) {
    if (removed.has(id) || have.has(id)) continue
    have.add(id)
    out.push(id)
  }
  return out
}
