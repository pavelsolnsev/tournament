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

  return {
    newTeamNames,
    teamOptions,
    assignment,
    newTeamInputForPlayer,
    newTeamName,
    openNewTeamInput,
    closeNewTeamInput,
    confirmNewTeam,
    setTeam,
    getTeam,
  }
}
