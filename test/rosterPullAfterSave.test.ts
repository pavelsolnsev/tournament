import { describe, it, expect } from 'vitest'
import { computed, nextTick, ref } from 'vue'
import type { SavedTournamentContext } from '../app/composables/tournament-wizard/savedContextTypes'
import { useTournamentServerRosterPullWatch } from '../app/composables/useTournamentServerRosterPullWatch'
import { rosterSyncFingerprint } from '../app/composables/tournament-wizard/applyServerContext'

/** Вкладка админа: локальный состав + серверное состояние, как в мастере. */
function setup(initialIds: number[], rosterRev: number) {
  const server = ref<SavedTournamentContext | null>({ selectedIds: initialIds, rosterRev } as SavedTournamentContext)
  const local = {
    selectedIds: ref(new Set(initialIds)),
    vkTeamLabelByPlayerId: ref<Record<number, string>>({}),
    vkTeamSlots: ref<string[]>([]),
    vkListTournament: ref(false),
    assignmentByPlayerId: ref<Record<number, string>>({}),
    confirmedTeamNames: ref(new Set<string>()),
    teamColors: ref<Record<string, number>>({}),
  }
  const lastAppliedRosterKey = ref(rosterSyncFingerprint({ ...Object.fromEntries(Object.entries(local).map(([k, v]) => [k, v.value])) } as never))
  const { markRosterSent } = useTournamentServerRosterPullWatch({
    stateRestored: ref(true),
    isLoading: ref(false),
    serverState: computed(() => server.value),
    ...local,
    lastAppliedRosterKey,
  })
  return { server, local, markRosterSent }
}

describe('useTournamentServerRosterPullWatch: вкладка не залипает после сохранения', () => {
  it('после принятого сохранения забирает состав сервера с игроком, записавшимся из ВК', async () => {
    const { server, local, markRosterSent } = setup([1, 2], 5)

    // Админ поменял расстановку (шаг «Команды») и сохранил.
    local.assignmentByPlayerId.value = { 1: 'Ручеёк' }
    markRosterSent()

    // Сервер принял правку и склеил её с игроком 3, который нажал кнопку в ВК.
    server.value = {
      selectedIds: [1, 2, 3],
      assignmentByPlayerId: { 1: 'Ручеёк' },
      rosterRev: 7,
    } as unknown as SavedTournamentContext
    await nextTick()

    expect([...local.selectedIds.value].sort()).toEqual([1, 2, 3])
  })

  it('несохранённые правки (не отправлены) серверным составом не затираются', async () => {
    const { server, local } = setup([1, 2], 5)

    local.assignmentByPlayerId.value = { 1: 'Ручеёк' }
    server.value = { selectedIds: [1, 2, 3], rosterRev: 6 } as SavedTournamentContext
    await nextTick()

    expect(local.assignmentByPlayerId.value).toEqual({ 1: 'Ручеёк' })
    expect([...local.selectedIds.value].sort()).toEqual([1, 2])
  })
})
