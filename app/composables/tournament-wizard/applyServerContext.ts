import type { ComputedRef, Ref } from 'vue'
import type { MatchStatus } from '~/types/tournament'
import { dedupeTeamNamesPreservingOrder, normalizeTeamColorsMap, normalizeTeamName } from '~/utils/teamNames'
import type { SavedStandingsSnapshot, SavedTournamentContext } from './savedContextTypes'

export type WizardAssignmentSlice = {
  assignment: Ref<Record<number, string>>
  confirmedTeamNames: Ref<Set<string>>
  teamColors: Ref<Record<string, number>>
  newTeamNames: Ref<string[]>
  newTeamName: Ref<string>
}

/** Всё состояние refs, которое переносится из SavedTournamentContext при загрузке с сервера. */
export type WizardServerContextDeps = {
  lastAppliedSelectedIdsKey: Ref<string>
  step: Ref<0 | 1 | 2>
  tournamentName: Ref<string>
  tournamentDate: Ref<string>
  venueLabel: Ref<string>
  formatLabel: Ref<string>
  selectedIds: Ref<Set<number>>
  paidPlayerIds: Ref<Set<number>>
  playerSearch: Ref<string>
  assignment: WizardAssignmentSlice
  standingsSnapshot: Ref<SavedStandingsSnapshot | null>
  matchStatus: Ref<MatchStatus>
  liveHomeTeam: Ref<string>
  liveAwayTeam: Ref<string>
  existingTeamNames: ComputedRef<string[]>
}

export function selectedIdsFingerprint(ids: Iterable<number> | undefined | null): string {
  const arr = ids == null ? [] : [...ids].filter((n) => Number.isFinite(n))
  arr.sort((a, b) => a - b)
  return arr.join(',')
}

export function applyEmptyTournamentContextLocal(deps: WizardServerContextDeps): void {
  deps.lastAppliedSelectedIdsKey.value = ''
  deps.step.value = 0
  deps.tournamentName.value = ''
  deps.tournamentDate.value = ''
  deps.venueLabel.value = ''
  deps.formatLabel.value = ''
  deps.selectedIds.value = new Set()
  deps.paidPlayerIds.value = new Set()
  deps.playerSearch.value = ''
  deps.assignment.assignment.value = {}
  deps.assignment.confirmedTeamNames.value = new Set()
  deps.assignment.teamColors.value = {}
  deps.assignment.newTeamNames.value = []
  deps.assignment.newTeamName.value = ''
  deps.standingsSnapshot.value = null
  deps.matchStatus.value = 'upcoming'
  deps.liveHomeTeam.value = ''
  deps.liveAwayTeam.value = ''
}

export function applyLoadedContext(
  deps: WizardServerContextDeps,
  ctx: SavedTournamentContext | null,
  mode: 'initial' | 'resync',
): void {
  if (!ctx) {
    deps.lastAppliedSelectedIdsKey.value = ''
    if (mode === 'resync') {
      applyEmptyTournamentContextLocal(deps)
    }
    return
  }

  const raw = ctx.step
  let migrated: 0 | 1 | 2
  if (raw === 0 || raw === 1 || raw === 2) {
    migrated = raw
  }
  else if (raw === 3) {
    migrated = 1
  }
  else {
    migrated = 2
  }
  deps.step.value = migrated

  deps.tournamentName.value = ctx.tournamentName ?? ''
  deps.tournamentDate.value = ctx.tournamentDate ?? ''
  deps.venueLabel.value = ctx.venueLabel ?? ''
  deps.formatLabel.value = ctx.formatLabel ?? ''

  deps.selectedIds.value = new Set(
    (ctx.selectedIds ?? []).filter((id) => Number.isFinite(id)),
  )

  deps.paidPlayerIds.value = new Set(
    (ctx.paidPlayerIds ?? []).filter((id) => Number.isFinite(id) && id > 0),
  )

  const rawAssign = ctx.assignmentByPlayerId ?? {}
  const normalizedAssign: Record<number, string> = {}
  for (const [idStr, team] of Object.entries(rawAssign)) {
    const n = normalizeTeamName(String(team))
    if (n) normalizedAssign[Number(idStr)] = n
  }
  deps.assignment.assignment.value = normalizedAssign
  deps.assignment.confirmedTeamNames.value = new Set(
    dedupeTeamNamesPreservingOrder(ctx.confirmedTeamNames ?? []),
  )
  deps.assignment.teamColors.value = normalizeTeamColorsMap(ctx.teamColors ?? {})

  deps.standingsSnapshot.value = ctx.standingsSnapshot ?? null

  deps.matchStatus.value = ctx.matchStatus ?? 'upcoming'
  deps.liveHomeTeam.value = ctx.liveHomeTeam ?? ''
  deps.liveAwayTeam.value = ctx.liveAwayTeam ?? ''

  const namesFromAssignments = Object.values(ctx.assignmentByPlayerId ?? {})
  const namesFromConfirmed = ctx.confirmedTeamNames ?? []
  const namesFromColors = Object.keys(ctx.teamColors ?? {})
  const mergedFromContext = [
    ...namesFromAssignments,
    ...namesFromConfirmed,
    ...namesFromColors,
  ].filter((name) => !!name && typeof name === 'string')
  const uniqueFromContext = dedupeTeamNamesPreservingOrder(mergedFromContext)

  const existingKeys = new Set((deps.existingTeamNames.value ?? []).map((n) => normalizeTeamName(n)))
  deps.assignment.newTeamNames.value = uniqueFromContext.filter(
    (name) => !existingKeys.has(normalizeTeamName(name)),
  )

  deps.lastAppliedSelectedIdsKey.value = selectedIdsFingerprint(deps.selectedIds.value)
}
