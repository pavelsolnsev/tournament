<template>
  <!-- print: чёрный текст на белом — чтобы PDF не зависел от тёмной темы. -->
  <section class="flex flex-col print:bg-white print:text-black">

    <OrganismsViewerTournamentSummaryHeaderMeta
      :venue-label="props.venueLabel"
      :format-label="props.formatLabel"
      :header-date-label="headerDateLabel"
      :tournament-date-iso="tournamentDateIso"
    />

    <div v-if="props.venueLabel || props.formatLabel || headerDateLabel" class="border-t border-slate-200 dark:border-slate-700/50 sm:mx-6" />

    <MoleculesViewerTournamentSummaryIntroBar
      v-if="showIntroBar"
      :stats="props.summary.stats"
      :champion="championStandingsRow"
      :champion-marker="championTeamMarker"
      :nav-items="summaryNavItems"
    />

    <div
      v-if="showIntroBar && props.summary.standingsRows.length > 0"
      class="border-t border-slate-200 dark:border-slate-700/50 sm:mx-6"
    />

    <div
      v-if="props.summary.standingsRows.length > 0"
      id="summary-standings"
      class="scroll-mt-24 pt-5 pb-4 sm:px-6"
    >
      <p class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">📊 Итоговая таблица</p>
      <OrganismsStandingsTable
        :teams="props.summary.standingsRows.map(r => r.teamName)"
        :rows="props.summary.standingsRows"
        :team-colors="effectiveTeamColors"
      />
    </div>

    <div class="border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />

    <OrganismsViewerTournamentSummaryMvpSection
      v-if="props.summary.mvp.length > 0"
      :mvp="props.summary.mvp"
    />

    <div class="border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />

    <OrganismsViewerTournamentSummaryAwardsSection
      v-if="hasAnyStats"
      :top-scorers="props.summary.topScorers"
      :top-assisters="props.summary.topAssisters"
      :top-goalkeepers="props.summary.topGoalkeepers"
    />

    <div class="border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />

    <OrganismsViewerTournamentSummaryYellowCardsSection
      v-if="props.summary.yellowCards.length > 0"
      :yellow-cards="props.summary.yellowCards"
    />

    <div class="border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />

    <template v-if="hasRosterData">
      <OrganismsViewerTournamentSummaryRosterAccordionSection
        :roster-teams="rosterTeams"
        :roster-players-by-team="rosterPlayersByTeam"
        :team-marker-for-row="teamMarkerForRow"
        :aggregate-player-stats="props.aggregatePlayerStats"
        :player-rating-deltas="props.playerRatingDeltas"
        :hide-base-player-rating="hideBasePlayerRating"
      />
      <div class="border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />
    </template>

    <OrganismsViewerTournamentSummaryTeamMvpsSection
      v-if="props.summary.teamMvps.length > 0"
      :team-mvps="props.summary.teamMvps"
    />

    <div class="border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />

    <OrganismsViewerTournamentSummaryPlayedResultsAccordionSection
      v-if="hasPlayedMatches"
      :played-matches-list="playedMatchesForResults"
      :team-marker-for-row="teamMarkerForRow"
      :team-color-by-name="effectiveTeamColors"
      :roster-players-by-team="rosterPlayersByTeam"
      :player-avatars-by-id="playerAvatarsById"
    />

    <div v-if="hasPlayedMatches" class="border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />

    <OrganismsViewerTournamentSummaryTopMatchSection
      v-if="props.summary.stats.topScoringMatch"
      :match="props.summary.stats.topScoringMatch"
      :pill-class="topScoringMatchPillClass"
      :totals="topScoringMatchTotals"
      :home-team-marker="homeTeamMarker"
      :away-team-marker="awayTeamMarker"
      :team-marker-for-row="teamMarkerForRow"
      :player-avatars-by-id="playerAvatarsById"
    />

    <div class="border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />

    <OrganismsViewerTournamentSummaryUsefulLinksSection />
  </section>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { TournamentSummary } from '~/composables/useTournamentSummary'
import type { PlayedMatch, PlayerMatchStats } from '~/composables/tournament-standings/types'
import { useTeamColors } from '~/composables/useTeamColors'
import { normalizeTeamColorsMap, normalizeTeamName, resolveTeamColorIndex } from '~/utils/teamNames'

const props = defineProps<{
  summary: TournamentSummary
  venueLabel?: string
  formatLabel?: string
  tournamentDate?: string
  teamColors?: Record<string, number>
  players?: Player[]
  assignmentByPlayerId?: Record<number, string>
  aggregatePlayerStats?: Record<number, PlayerMatchStats>
  playerRatingDeltas?: Record<number, number>
  playedMatchesList?: PlayedMatch[]
}>()

const tournamentDateIso = computed(() => {
  const t = (props.tournamentDate ?? '').trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : undefined
})

const headerDateLabel = computed(() => {
  const raw = (props.tournamentDate ?? '').trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return ''
  const y = Number(raw.slice(0, 4))
  const m = Number(raw.slice(5, 7))
  const d = Number(raw.slice(8, 10))
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const { teamMarkers, getMarkerByIndex, getMatchScorePillClass } = useTeamColors()

const playedMatchesForResults = computed(() => props.playedMatchesList ?? [])
const hasPlayedMatches = computed(() => playedMatchesForResults.value.length > 0)

const hideBasePlayerRating = computed(() => playedMatchesForResults.value.length > 0)

const effectiveTeamColors = computed(() => {
  const map = normalizeTeamColorsMap(props.teamColors)
  const ordered: string[] = []
  const seen = new Set<string>()
  for (const r of props.summary.standingsRows) {
    const nk = normalizeTeamName(r.teamName)
    if (!nk || seen.has(nk)) continue
    seen.add(nk)
    ordered.push(nk)
  }
  for (const m of playedMatchesForResults.value) {
    for (const raw of [m.homeTeam, m.awayTeam]) {
      const nk = normalizeTeamName(raw)
      if (!nk || seen.has(nk)) continue
      seen.add(nk)
      ordered.push(nk)
    }
  }
  // Если в teamColors нет части команд (старые архивы/неполные сохранения),
  // мы назначаем им цвета по порядку (0,1,2,...) — так же, как это делает fallback логика в турнире.
  for (const [idx, nk] of ordered.entries()) {
    if (map[nk] !== undefined) continue
    map[nk] = idx % teamMarkers.length
  }
  return map
})

const playerAvatarsById = computed(() => {
  const out: Record<number, { photo: string | null; name: string }> = {}
  for (const p of props.players ?? []) {
    out[p.id] = { photo: p.photo ?? null, name: p.name }
  }
  return out
})

function scorePillColorIndexForTeam(teamName: string): number {
  const idx = props.summary.standingsRows.findIndex((r) => normalizeTeamName(r.teamName) === normalizeTeamName(teamName))
  return resolveTeamColorIndex(teamName, effectiveTeamColors.value, idx >= 0 ? idx : 0)
}

const topScoringMatchPillClass = computed(() => {
  const m = props.summary.stats.topScoringMatch
  if (!m) return 'bg-slate-100 text-slate-800 ring-slate-300/90 dark:bg-slate-800/90 dark:text-slate-400 dark:ring-slate-600/40'
  return getMatchScorePillClass(
    m.homeGoals,
    m.awayGoals,
    m.homeTeam,
    m.awayTeam,
    scorePillColorIndexForTeam,
  )
})

const topScoringMatchTotals = computed(() => {
  const m = props.summary.stats.topScoringMatch
  if (!m) return { goals: 0, assists: 0, saves: 0 }
  let assists = 0
  let saves = 0
  for (const st of Object.values(m.homeStats)) {
    assists += st.assists ?? 0
    saves += st.saves ?? 0
  }
  for (const st of Object.values(m.awayStats)) {
    assists += st.assists ?? 0
    saves += st.saves ?? 0
  }
  return {
    goals: m.homeGoals + m.awayGoals,
    assists,
    saves,
  }
})

function teamMarkerForRow(teamName: string): string {
  const idx = props.summary.standingsRows.findIndex((r) => normalizeTeamName(r.teamName) === normalizeTeamName(teamName))
  const colorIdx = resolveTeamColorIndex(teamName, effectiveTeamColors.value, idx >= 0 ? idx : 0)
  return getMarkerByIndex(colorIdx)
}

const homeTeamMarker = computed(() => teamMarkerForRow(props.summary.stats.topScoringMatch?.homeTeam ?? ''))
const awayTeamMarker = computed(() => teamMarkerForRow(props.summary.stats.topScoringMatch?.awayTeam ?? ''))

const rosterTeams = computed(() => props.summary.standingsRows.map(r => r.teamName))

function rosterPlayersByTeam(teamName: string): Player[] {
  if (!props.players || !props.assignmentByPlayerId) return []
  return props.players.filter(p => props.assignmentByPlayerId![p.id] === teamName)
}

const hasRosterData = computed(() => (props.players?.length ?? 0) > 0)

const showIntroBar = computed(() => props.summary.stats.totalMatches > 0)

const championStandingsRow = computed(() => {
  const rows = props.summary.standingsRows
  if (!rows.length) return null
  return [...rows].sort((a, b) => a.place - b.place)[0] ?? null
})

const championTeamMarker = computed(() => {
  const row = championStandingsRow.value
  if (!row) return ''
  return teamMarkerForRow(row.teamName)
})

const hasAnyStats = computed(() =>
  props.summary.topScorers.length > 0 ||
  props.summary.topAssisters.length > 0 ||
  props.summary.topGoalkeepers.length > 0 ||
  props.summary.yellowCards.length > 0,
)

const summaryNavItems = computed(() => {
  const items: { href: string; label: string }[] = []
  if (props.summary.standingsRows.length > 0) items.push({ href: '#summary-standings', label: 'Таблица' })
  if (props.summary.mvp.length > 0) items.push({ href: '#summary-mvp', label: 'MVP' })
  if (hasAnyStats.value) items.push({ href: '#summary-awards', label: 'Награды' })
  if (props.summary.yellowCards.length > 0) items.push({ href: '#summary-yellows', label: 'Карточки' })
  if (hasRosterData.value) items.push({ href: '#summary-rosters', label: 'Составы' })
  if (props.summary.teamMvps.length > 0) items.push({ href: '#summary-team-mvps', label: 'MVP команд' })
  if (hasPlayedMatches.value) items.push({ href: '#summary-results', label: 'Матчи' })
  if (props.summary.stats.topScoringMatch) items.push({ href: '#summary-top-match', label: 'Топ-матч' })
  items.push({ href: '#summary-links', label: 'Ссылки' })
  return items
})
</script>
