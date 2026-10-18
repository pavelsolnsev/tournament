// Выбор игроков в мастере + учёт того, что админ поменял в составе именно в этой вкладке.
// На сервер уходит не только весь список, но и «кого добавили / кого убрали» (__rosterDelta):
// сервер применяет эти изменения к своему составу. Так отставшая вкладка не выкинет игрока,
// записавшегося кнопкой в ВК, и не вернёт того, кто вышел через ВК.
import type { ComputedRef, Ref } from 'vue'
import { ref, watch } from 'vue'
import type { SavedTournamentContext } from '~/composables/tournament-wizard/savedContextTypes'

export function useSelectedPlayersDelta(deps: {
  selectedIds: Ref<Set<number>>
  vkTeamLabelByPlayerId: Ref<Record<number, string>>
  removeFromTeam: (id: number) => void
  serverState: ComputedRef<SavedTournamentContext | null>
}) {
  const added = ref(new Set<number>())
  const removed = ref(new Set<number>())

  function selectPlayer(id: number) {
    const next = new Set(deps.selectedIds.value)
    next.add(id)
    deps.selectedIds.value = next
    added.value = new Set(added.value).add(id)
    const r = new Set(removed.value)
    r.delete(id)
    removed.value = r
  }

  function removePlayer(id: number) {
    deps.removeFromTeam(id)
    const next = new Set(deps.selectedIds.value)
    next.delete(id)
    deps.selectedIds.value = next
    deps.vkTeamLabelByPlayerId.value = Object.fromEntries(
      Object.entries(deps.vkTeamLabelByPlayerId.value).filter(([k]) => Number(k) !== id),
    ) as Record<number, string>
    removed.value = new Set(removed.value).add(id)
    const a = new Set(added.value)
    a.delete(id)
    added.value = a
  }

  // Сервер уже учёл правку — забываем её: добавленный появился в составе, убранный из него пропал.
  // Иначе «убрали» висело бы вечно и не дало бы игроку потом снова записаться из ВК.
  watch(
    () => deps.serverState.value?.selectedIds,
    (ids) => {
      const onServer = new Set((ids ?? []).map(Number))
      added.value = new Set([...added.value].filter((id) => !onServer.has(id)))
      removed.value = new Set([...removed.value].filter((id) => onServer.has(id)))
    },
  )

  /** Для тела PUT: что админ добавил и убрал в этой вкладке с последней синхронизации. */
  function rosterDelta() {
    return { added: [...added.value], removed: [...removed.value] }
  }

  return { selectPlayer, removePlayer, rosterDelta }
}
