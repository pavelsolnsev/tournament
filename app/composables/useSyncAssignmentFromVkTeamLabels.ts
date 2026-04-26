import type { ComputedRef, Ref } from 'vue'
import { watch } from 'vue'
import type { Player } from '~/types/tournament'
import { normalizeTeamName, resolveExistingTeamNameForLabel } from '~/utils/teamNames'

type AssignmentSync = {
  getTeam: (playerId: number) => string
  setTeam: (playerId: number, teamName: string) => void
}

/**
 * Если подпись команды игрока в списке ВК совпадает с именем команды из /api/teams — назначает игрока в эту команду на шаге «Команды».
 * Нет совпадения в БД — назначение не трогаем.
 */
export function useSyncAssignmentFromVkTeamLabels(opts: {
  stateRestored: Ref<boolean>
  existingTeamNames: ComputedRef<string[]>
  selectedIds: Ref<Set<number>>
  selectedPlayers: ComputedRef<Player[]>
  vkListTournament: Ref<boolean>
  vkTeamLabelByPlayerId: Ref<Record<number, string>>
  assignment: AssignmentSync
}) {
  watch(
    () => ({
      restored: opts.stateRestored.value,
      vkList: opts.vkListTournament.value,
      dbTeams: opts.existingTeamNames.value,
      selectedIds: [...opts.selectedIds.value].sort((a, b) => a - b).join(','),
      vkFingerprint: Object.keys(opts.vkTeamLabelByPlayerId.value)
        .map((k) => Number(k))
        .filter((id) => Number.isFinite(id))
        .sort((a, b) => a - b)
        .map((id) => `${id}:${normalizeTeamName(opts.vkTeamLabelByPlayerId.value[id] ?? '')}`)
        .join('\x1e'),
    }),
    () => {
      if (!opts.stateRestored.value) return
      if (!opts.vkListTournament.value) return
      const dbTeams = opts.existingTeamNames.value
      if (dbTeams.length === 0) return
      for (const p of opts.selectedPlayers.value) {
        const label = opts.vkTeamLabelByPlayerId.value[p.id] ?? ''
        const resolved = resolveExistingTeamNameForLabel(label, dbTeams)
        if (resolved == null) continue
        const cur = normalizeTeamName(opts.assignment.getTeam(p.id))
        if (cur === resolved) continue
        opts.assignment.setTeam(p.id, resolved)
      }
    },
  )
}
