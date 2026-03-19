import type { Ref, ComputedRef } from 'vue'
import { unref } from 'vue'

// Логика назначения игроков в команды и работы с командами.
export function useTeamAssignment(existingTeamNames: Ref<string[]> | ComputedRef<string[]>) {
  // Имена новых команд, созданных пользователем.
  const newTeamNames = ref<string[]>([])
  // Все команды: из API и новые.
  const teamOptions = computed(() => [
    ...(unref(existingTeamNames) ?? []),
    ...newTeamNames.value,
  ])
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

  function normalizeTeamName(name: string) {
    return name.trim().replace(/\s+/g, ' ')
  }

  function setTeamColor(teamName: string, colorIndex: number) {
    if (colorIndex < 0 || colorIndex > 5) return
    teamColors.value = { ...teamColors.value, [teamName]: colorIndex }
  }

  function getTeamColor(teamName: string): number {
    return teamColors.value[teamName] ?? 0
  }

  function confirmTeam(teamName: string) {
    if (!teamName.trim()) return
    const next = new Set(confirmedTeamNames.value)
    next.add(teamName.trim())
    confirmedTeamNames.value = next
  }

  function unconfirmTeam(teamName: string) {
    const next = new Set(confirmedTeamNames.value)
    next.delete(teamName)
    confirmedTeamNames.value = next
  }

  function isTeamConfirmed(teamName: string) {
    return confirmedTeamNames.value.has(teamName)
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
    if (!newTeamNames.value.includes(name)) {
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
    if (teamOptions.value.includes(trimmed)) return
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

    // Удаляем только команды, созданные пользователем.
    if (newTeamNames.value.includes(normalized)) {
      newTeamNames.value = newTeamNames.value.filter((n) => n !== normalized)
    }

    // Сбрасываем назначения игроков
    const nextAssignment: Record<number, string> = { ...assignment.value }
    for (const [playerIdStr, name] of Object.entries(nextAssignment)) {
      if (name === normalized) {
        delete nextAssignment[Number(playerIdStr)]
      }
    }
    assignment.value = nextAssignment

    // Убираем участие и цвет
    const nextConfirmed = new Set(confirmedTeamNames.value)
    nextConfirmed.delete(normalized)
    confirmedTeamNames.value = nextConfirmed

    const nextColors = { ...teamColors.value }
    delete nextColors[normalized]
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
