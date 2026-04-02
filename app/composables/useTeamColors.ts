// Этот файл: composable для цветов/маркеров команд.
// Он нужен, чтобы показывать командам одинаковые маркеры по индексу цвета.
export function useTeamColors() {
  // Порядок маркеров: индекс совпадает с номером команды минус 1.
  // Команда 1 → 🔴 (0), Команда 2 → 🔵 (1), Команда 3 → 🟢 (2), Команда 4 → 🟡 (3).
  const teamMarkers = ['🔴', '🔵', '🟢', '🟡', '⚪', '⚫'] as const

  // Фон + цвет текста для плашки счёта — тот же порядок, что и у маркеров.
  const scorePillTones = [
    'bg-red-500/15 text-red-200 ring-red-500/25',
    'bg-sky-500/15 text-sky-200 ring-sky-500/25',
    'bg-emerald-500/15 text-emerald-200 ring-emerald-500/25',
    'bg-amber-500/15 text-amber-200 ring-amber-500/25',
    'bg-slate-500/15 text-slate-200 ring-slate-500/25',
    'bg-zinc-500/20 text-zinc-200 ring-zinc-500/30',
  ] as const

  function getMarkerByIndex(index: number): string {
    const safeIndex = Number.isFinite(index) ? index : 0
    const clamped = Math.max(0, Math.min(safeIndex, teamMarkers.length - 1))
    return teamMarkers[clamped] ?? teamMarkers[0]
  }

  // Ничья — нейтральная плашка; победа — тон команды-победителя (индекс из teamColors).
  function getMatchScorePillClass(
    homeGoals: number,
    awayGoals: number,
    homeTeam: string,
    awayTeam: string,
    colorIndexForTeam: (teamName: string) => number,
  ): string {
    if (homeGoals === awayGoals) {
      return 'bg-slate-800/90 text-slate-400 ring-slate-600/40'
    }
    const winnerTeam = homeGoals > awayGoals ? homeTeam : awayTeam
    const idx = colorIndexForTeam(winnerTeam)
    const safe = Number.isFinite(idx) ? Math.max(0, Math.min(idx, scorePillTones.length - 1)) : 0
    return scorePillTones[safe] ?? scorePillTones[0]
  }

  return {
    teamMarkers,
    getMarkerByIndex,
    getMatchScorePillClass,
  }
}

