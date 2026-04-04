// Этот файл: composable для цветов/маркеров команд.
// Он нужен, чтобы показывать командам одинаковые маркеры по индексу цвета.
export function useTeamColors() {
  // Порядок маркеров: индекс совпадает с номером команды минус 1.
  // Команда 1 → 🔴 (0), Команда 2 → 🔵 (1), Команда 3 → 🟢 (2), Команда 4 → 🟡 (3).
  const teamMarkers = ['🔴', '🔵', '🟢', '🟡', '⚪', '⚫'] as const

  // Фон + цвет текста для плашки счёта — тот же порядок, что и у маркеров.
  // В светлой теме — тёмный текст на лёгком тинте; в тёмной — светлый текст как раньше.
  const scorePillTones = [
    'bg-red-500/10 text-red-800 ring-red-300/70 dark:bg-red-500/15 dark:text-red-200 dark:ring-red-500/25',
    'bg-sky-500/10 text-sky-800 ring-sky-300/70 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-500/25',
    'bg-emerald-500/10 text-emerald-800 ring-emerald-300/70 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-500/25',
    'bg-amber-500/10 text-amber-900 ring-amber-300/70 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/25',
    'bg-slate-200/80 text-slate-800 ring-slate-300/80 dark:bg-slate-500/15 dark:text-slate-200 dark:ring-slate-500/25',
    'bg-zinc-200/80 text-zinc-800 ring-zinc-300/80 dark:bg-zinc-500/20 dark:text-zinc-200 dark:ring-zinc-500/30',
  ] as const

  function getMarkerByIndex(index: number): string {
    const safeIndex = Number.isFinite(index) ? index : 0
    const clamped = Math.max(0, Math.min(safeIndex, teamMarkers.length - 1))
    return teamMarkers[clamped] ?? teamMarkers[0]
  }
  // Имена игроков в UI больше не красим через этот composable — только маркеры команд и плашка счёта.

  // Ничья — нейтральная плашка; победа — тон команды-победителя (индекс из teamColors).
  function getMatchScorePillClass(
    homeGoals: number,
    awayGoals: number,
    homeTeam: string,
    awayTeam: string,
    colorIndexForTeam: (teamName: string) => number,
  ): string {
    if (homeGoals === awayGoals) {
      return 'bg-slate-100 text-slate-800 ring-slate-300/90 dark:bg-slate-800/90 dark:text-slate-400 dark:ring-slate-600/40'
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

