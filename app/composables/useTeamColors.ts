export function useTeamColors() {
  const teamMarkers = ['🔴', '🟢', '🔵', '🟡', '⚪', '⚫'] as const

  function getMarkerByIndex(index: number): string {
    const safeIndex = Number.isFinite(index) ? index : 0
    const clamped = Math.max(0, Math.min(safeIndex, teamMarkers.length - 1))
    return teamMarkers[clamped] ?? teamMarkers[0]
  }

  return {
    teamMarkers,
    getMarkerByIndex,
  }
}

