import type { Ref, ComputedRef } from 'vue'
import { unref } from 'vue'

/**
 * Shared logic for assigning players to teams (existing or new).
 * Composable is sync; parent provides existing team names (e.g. from API).
 */
export function useTeamAssignment(existingTeamNames: Ref<string[]> | ComputedRef<string[]>) {
  const newTeamNames = ref<string[]>([])
  const teamOptions = computed(() => [
    ...(unref(existingTeamNames) ?? []),
    ...newTeamNames.value,
  ])
  const assignment = ref<Record<number, string>>({})
  const newTeamInputForPlayer = ref<number | null>(null)
  const newTeamName = ref('')
  /** Team names that are confirmed to participate in the tournament */
  const confirmedTeamNames = ref<Set<string>>(new Set())
  /** Team name -> color index 0–3 (🔴 🟢 🔵 🟡) */
  const teamColors = ref<Record<string, number>>({})

  function setTeamColor(teamName: string, colorIndex: number) {
    if (colorIndex < 0 || colorIndex > 3) return
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
    const name = newTeamName.value.trim()
    if (!name) return
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
    const trimmed = name.trim()
    if (!trimmed) return
    if (teamOptions.value.includes(trimmed)) return
    newTeamNames.value = [...newTeamNames.value, trimmed]
  }

  function removeFromTeam(playerId: number) {
    const next = { ...assignment.value }
    delete next[playerId]
    assignment.value = next
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
    confirmTeam,
    unconfirmTeam,
    isTeamConfirmed,
    setTeamColor,
    getTeamColor,
  }
}
