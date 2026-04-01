// Этот файл: composable для назначения игроков в команды.
// Он держит выбранные команды, подтверждения и распределение игроков.
import type { Ref, ComputedRef } from 'vue'
import { unref } from 'vue'
import {
  dedupeTeamNamesPreservingOrder,
  normalizeTeamName,
  teamNameCollides,
} from '~/utils/teamNames'

// Логика назначения игроков в команды и работы с командами.
export function useTeamAssignment(existingTeamNames: Ref<string[]> | ComputedRef<string[]>) {
  // Имена новых команд, созданных пользователем.
  const newTeamNames = ref<string[]>([])
  // Все команды: из API и новые, без дублей (в т.ч. совпадение с БД и лишние пробелы).
  const teamOptions = computed(() =>
    dedupeTeamNamesPreservingOrder([
      ...(unref(existingTeamNames) ?? []),
      ...newTeamNames.value,
    ]),
  )
  // Какой игрок в какой команде.
  const assignment = ref<Record<number, string>>({})
  // ID игрока, для которого сейчас создаём новую команду.
  const newTeamInputForPlayer = ref<number | null>(null)
  // Текст для имени новой команды.
  const newTeamName = ref('')
  /** Команды, которые участвуют в турнире. */
  const confirmedTeamNames = ref<Set<string>>(new Set())
  /** Цвета команд по имени (индекс 0–5). */
  const teamColors = ref<Record<string, number>>({})

  /** Список имён уже в опциях (БД + новые), для проверки перед добавлением. */
  function listedTeamNamesRaw(): string[] {
    return [...(unref(existingTeamNames) ?? []), ...newTeamNames.value]
  }

  function setTeamColor(teamName: string, colorIndex: number) {
    if (colorIndex < 0 || colorIndex > 5) return
    teamColors.value = { ...teamColors.value, [teamName]: colorIndex }
  }

  function getTeamColor(teamName: string): number {
    return teamColors.value[teamName] ?? 0
  }

  function confirmTeam(teamName: string) {
    const key = normalizeTeamName(teamName)
    if (!key) return
    const next = new Set(confirmedTeamNames.value)
    next.add(key)
    confirmedTeamNames.value = next
  }

  function unconfirmTeam(teamName: string) {
    const key = normalizeTeamName(teamName)
    const next = new Set(confirmedTeamNames.value)
    next.delete(key)
    confirmedTeamNames.value = next
  }

  function isTeamConfirmed(teamName: string) {
    return confirmedTeamNames.value.has(normalizeTeamName(teamName))
  }

  function openNewTeamInput(playerId: number) {
    newTeamInputForPlayer.value = playerId
    newTeamName.value = ''
  }

  function closeNewTeamInput() {
    newTeamInputForPlayer.value = null
    newTeamName.value = ''
  }

  function confirmNewTeam(playerId: number) {
    const name = normalizeTeamName(newTeamName.value)
    if (name.length < 2) return
    // Не дублируем строку в newTeamNames, если такое имя уже есть в БД или в списке новых.
    if (!teamNameCollides(name, listedTeamNamesRaw())) {
      newTeamNames.value = [...newTeamNames.value, name]
    }
    assignment.value = { ...assignment.value, [playerId]: name }
    closeNewTeamInput()
  }

  function setTeam(playerId: number, teamName: string) {
    if (teamName === '__new__') {
      openNewTeamInput(playerId)
      return
    }
    assignment.value = { ...assignment.value, [playerId]: teamName }
    closeNewTeamInput()
  }

  function getTeam(playerId: number) {
    return assignment.value[playerId] ?? ''
  }

  function addNewTeam(name: string) {
    const trimmed = normalizeTeamName(name)
    if (trimmed.length < 2) return
    if (teamNameCollides(trimmed, listedTeamNamesRaw())) return
    newTeamNames.value = [...newTeamNames.value, trimmed]
  }

  function removeFromTeam(playerId: number) {
    const next = { ...assignment.value }
    delete next[playerId]
    assignment.value = next
  }

  function removeTeam(teamName: string) {
    const normalized = normalizeTeamName(teamName)
    if (!normalized) return

    // Удаляем только команды, созданные пользователем (сравнение по нормализованному имени).
    if (newTeamNames.value.some((n) => normalizeTeamName(n) === normalized)) {
      newTeamNames.value = newTeamNames.value.filter((n) => normalizeTeamName(n) !== normalized)
    }

    // Сбрасываем назначения игроков
    const nextAssignment: Record<number, string> = { ...assignment.value }
    for (const [playerIdStr, name] of Object.entries(nextAssignment)) {
      if (normalizeTeamName(name) === normalized) {
        delete nextAssignment[Number(playerIdStr)]
      }
    }
    assignment.value = nextAssignment

    // Убираем участие и цвет (ищем ключ подтверждения по нормализованному имени).
    const nextConfirmed = new Set<string>()
    for (const c of confirmedTeamNames.value) {
      if (normalizeTeamName(c) !== normalized) nextConfirmed.add(c)
    }
    confirmedTeamNames.value = nextConfirmed

    const nextColors = { ...teamColors.value }
    for (const k of Object.keys(nextColors)) {
      if (normalizeTeamName(k) === normalized) delete nextColors[k]
    }
    teamColors.value = nextColors
  }

  return {
    newTeamNames,
    teamOptions,
    assignment,
    confirmedTeamNames,
    teamColors,
    newTeamInputForPlayer,
    newTeamName,
    openNewTeamInput,
    closeNewTeamInput,
    confirmNewTeam,
    setTeam,
    getTeam,
    addNewTeam,
    removeFromTeam,
    removeTeam,
    confirmTeam,
    unconfirmTeam,
    isTeamConfirmed,
    setTeamColor,
    getTeamColor,
  }
}
