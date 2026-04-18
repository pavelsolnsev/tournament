import type { ComputedRef } from 'vue'
import type { Player } from '~/types/tournament'
import type { SavedStandingsSnapshot } from '~/composables/useTournamentWizard'
import { displayPlayerLabelWithoutRating } from '~/composables/usePlayerDisplay'

export const MAX_VISIBLE_LIVE_BADGES = 2

const LIVE_STAT_BADGES = [
  { key: 'goals', icon: '⚽', bgClass: 'bg-emerald-500/15', textClass: 'text-emerald-900 dark:text-emerald-300' },
  { key: 'assists', icon: '🎯', bgClass: 'bg-sky-500/15', textClass: 'text-sky-900 dark:text-sky-300' },
  { key: 'saves', icon: '🧤', bgClass: 'bg-violet-500/15', textClass: 'text-violet-900 dark:text-violet-300' },
  { key: 'yellows', icon: '🟨', bgClass: 'bg-amber-500/15', textClass: 'text-amber-950 dark:text-yellow-300' },
] as const

export type LiveViewerBadge = {
  key: string
  icon: string
  count: number
  bgClass: string
  textClass: string
}

export type LiveViewerPlayerRow = {
  playerId: number
  name: string
  badges: LiveViewerBadge[]
  side: 'home' | 'away'
  photo: string | null
  avatarFallbackName: string
}

function buildLivePlayerRow(
  players: Player[],
  idStr: string,
  stats: { goals: number; assists: number; saves: number; yellows: number },
  side: 'home' | 'away',
): LiveViewerPlayerRow | null {
  const total =
    (stats.goals ?? 0) +
    (stats.assists ?? 0) +
    (stats.saves ?? 0) +
    (stats.yellows ?? 0)
  if (total === 0) return null
  const playerId = Number(idStr)
  const player = players.find((p) => p.id === playerId)
  const badges = LIVE_STAT_BADGES.filter(
    (b) => (stats[b.key as keyof typeof stats] ?? 0) > 0,
  ).map((b) => ({
    key: b.key,
    icon: b.icon,
    count: stats[b.key as keyof typeof stats] ?? 0,
    bgClass: b.bgClass,
    textClass: b.textClass,
  }))
  const avatarFallbackName = (player?.name ?? '').trim() || `#${playerId}`
  return {
    playerId,
    name: player ? displayPlayerLabelWithoutRating(player) : `#${playerId}`,
    badges,
    side,
    photo: player?.photo ?? null,
    avatarFallbackName,
  }
}

/** Simple10: Строки live-статистики в шапке зрителя — только игроки с хотя бы одним событием. */
export function useTournamentViewerLivePlayerRows(
  initialSnapshot: ComputedRef<SavedStandingsSnapshot | null>,
  players: ComputedRef<Player[]>,
) {
  const expandedPlayerIds = ref<Set<number>>(new Set())

  function togglePlayerExpand(playerId: number) {
    const next = new Set(expandedPlayerIds.value)
    if (next.has(playerId)) next.delete(playerId)
    else next.add(playerId)
    expandedPlayerIds.value = next
  }

  function visibleBadgeCount(playerId: number, totalBadges: number): number {
    return expandedPlayerIds.value.has(playerId)
      ? totalBadges
      : Math.min(MAX_VISIBLE_LIVE_BADGES, totalBadges)
  }

  const livePlayerRows = computed<LiveViewerPlayerRow[]>(() => {
    const snap = initialSnapshot.value
    const pl = players.value
    if (!snap) return []
    const rows: LiveViewerPlayerRow[] = []
    for (const [idStr, stats] of Object.entries(snap.currentHomeStats ?? {})) {
      const row = buildLivePlayerRow(pl, idStr, stats, 'home')
      if (row) rows.push(row)
    }
    for (const [idStr, stats] of Object.entries(snap.currentAwayStats ?? {})) {
      const row = buildLivePlayerRow(pl, idStr, stats, 'away')
      if (row) rows.push(row)
    }
    return rows
  })

  return {
    livePlayerRows,
    expandedPlayerIds,
    togglePlayerExpand,
    visibleBadgeCount,
    maxVisibleBadges: MAX_VISIBLE_LIVE_BADGES,
  }
}
