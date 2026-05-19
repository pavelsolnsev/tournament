// Логика OrganismsTournamentStepStandingsMatchManagement — вынесена из .vue для лимита max-lines.
import type { Player } from '~/types/tournament'
import type { StatKey } from '~/composables/tournament-standings/types'
import { computed, nextTick, ref, watch } from 'vue'
import { useAdminAuth } from '~/composables/useAdminAuth'
import { useConfirmCountdown } from '~/composables/useConfirmCountdown'
import { useTeamColors } from '~/composables/useTeamColors'
import { scrollExpandedPanelIntoView } from '~/utils/scrollExpandedPanelIntoView'
import { resolveTeamColorIndex } from '~/utils/teamNames'

export type MatchMgmtSide = 'home' | 'away'

export type MatchPlayerStat = {
  goals: number
  assists: number
  saves: number
  yellows: number
}

export type StepStandingsMatchManagementProps = {
  teams: string[]
  homeTeam: string
  awayTeam: string
  homeGoals: number
  awayGoals: number
  hasNextMatch: boolean
  canFinishMatch: boolean
  hasPlayedMatches: boolean
  playersByTeam: (teamName: string) => Player[]
  teamMarker: (teamName: string) => string
  effectiveTeamColors: Record<string, number>
  displayPlayerLabel: (player: Player) => string
  isActivePlayer: (side: MatchMgmtSide, playerId: number) => boolean
  selectPlayerForMark: (side: MatchMgmtSide, playerId: number) => void
  playerStat: (side: MatchMgmtSide, playerId: number) => MatchPlayerStat
  onSelectAction: (side: MatchMgmtSide, playerId: number, event: Event) => void
  addPlayerEvent: (side: MatchMgmtSide, playerId: number, key: StatKey) => void
  removePlayerEvent: (side: MatchMgmtSide, playerId: number, key: StatKey) => void
  goToNextMatch: () => void
  resetMatchStats: () => void
  finishMatch: () => void
  finishMatchSilent: () => void | Promise<void>
  finishTournamentStatus: 'idle' | 'loading' | 'success' | 'error'
  finishTournamentError: string | null
  onFinishTournament: () => void
}

export function useStepStandingsMatchManagement(props: StepStandingsMatchManagementProps) {
  const { getMatchScorePillClass } = useTeamColors()

  const { adminRole } = useAdminAuth()
  const canFinishTournament = computed(() => adminRole.value === 'full')
  const canFinishMatchShowResults = computed(() => adminRole.value === 'full' || adminRole.value === 'limited')
  const canFinishMatchSilent = computed(() => false)
  const isLimitedAdmin = computed(() => adminRole.value === 'limited')

  const homeTeamColorIndex = computed(() =>
    resolveTeamColorIndex(props.homeTeam, props.effectiveTeamColors, 0),
  )
  const awayTeamColorIndex = computed(() =>
    resolveTeamColorIndex(props.awayTeam, props.effectiveTeamColors, 1),
  )

  function teamColorIndexForName(teamName: string): number {
    return resolveTeamColorIndex(teamName, props.effectiveTeamColors, 0)
  }

  const boardScorePillClass = computed(() =>
    getMatchScorePillClass(
      props.homeGoals,
      props.awayGoals,
      props.homeTeam,
      props.awayTeam,
      (name) => resolveTeamColorIndex(name, props.effectiveTeamColors, 0),
    ),
  )

  const nextMatchConfirmSubtitle = computed(() => {
    const isZeroZero = props.homeGoals === 0 && props.awayGoals === 0
    if (isZeroZero) {
      return `Внимание: счёт ${props.homeGoals}:${props.awayGoals}. Матч будет записан с нулевым счётом.`
    }
    return 'Текущий матч будет завершён и записан в историю.'
  })

  const uid = useId?.() ?? Math.random().toString(36).slice(2)

  const teamPickersAccordionRef = useTemplateRef<{
    collapseTeamPickersSection: () => void
  }>('teamPickersAccordionRef')

  const mgmtToggleId = `match-mgmt-toggle-${uid}`
  const mgmtPanelId = `match-mgmt-panel-${uid}`
  const isMgmtOpen = ref(false)

  const pendingAction = ref<'next' | 'finish' | 'finishSilent' | null>(null)
  const isActionConfirmOpen = computed(() => pendingAction.value !== null)

  const { secondsLeft: finishMatchSecondsLeft, start: startFinishMatchCountdown, stop: stopFinishMatchCountdown } = useConfirmCountdown()

  watch(pendingAction, (action) => {
    if (action === 'finish') startFinishMatchCountdown()
    else stopFinishMatchCountdown()
  })

  const showFinishTournamentConfirm = ref(false)
  const { secondsLeft: finishTournamentConfirmSecondsLeft, start: startFinishTournamentConfirmCountdown, stop: stopFinishTournamentConfirmCountdown } = useConfirmCountdown()

  function openFinishTournamentConfirm() {
    if (!canFinishTournament.value) return
    showFinishTournamentConfirm.value = true
    startFinishTournamentConfirmCountdown()
  }

  function closeFinishTournamentConfirm() {
    if (props.finishTournamentStatus === 'loading') return
    showFinishTournamentConfirm.value = false
    stopFinishTournamentConfirmCountdown()
  }

  function confirmFinishTournament() {
    if (!canFinishTournament.value) return
    props.onFinishTournament()
  }

  watch(
    () => props.finishTournamentStatus,
    (s) => {
      if (s === 'success') {
        showFinishTournamentConfirm.value = false
        stopFinishTournamentConfirmCountdown()
      }
    },
  )

  const nextConfirmAnchor = useTemplateRef<HTMLDivElement>('nextConfirmAnchor')
  const matchCardRef = useTemplateRef<HTMLElement>('matchCardRef')
  const matchScoreBoardRef = useTemplateRef<HTMLDivElement>('matchScoreBoardRef')

  function scrollMatchCardIntoView() {
    if (import.meta.server) return
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = matchScoreBoardRef.value ?? matchCardRef.value
        el?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
      })
    })
  }

  // Все confirm-диалоги находятся внизу панели управления — скроллим #scroll-root до конца.
  // Прямое измерение через ref ненадёжно: anchors в дочернем компоненте, значение может быть null.
  function scrollToConfirm() {
    if (import.meta.server) return
    void nextTick(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const scrollRoot = document.getElementById('scroll-root')
          if (!scrollRoot) return
          scrollRoot.scrollTo({ top: scrollRoot.scrollHeight, behavior: 'smooth' })
        })
      })
    })
  }

  function closeActionConfirm() {
    stopFinishMatchCountdown()
    pendingAction.value = null
  }

  function openActionConfirm(action: 'next' | 'finish' | 'finishSilent') {
    pendingAction.value = action
    if (action === 'next') {
      void nextTick(() => {
        requestAnimationFrame(() => {
          nextConfirmAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        })
      })
      return
    }
    scrollToConfirm()
  }

  async function confirmPendingAction() {
    const action = pendingAction.value
    closeActionConfirm()

    if (action === 'finish') {
      props.finishMatch()
      return
    }
    if (action === 'finishSilent') {
      await props.finishMatchSilent()
      return
    }
    if (action === 'next') {
      props.goToNextMatch()
      await nextTick()
      await nextTick()
      scrollMatchCardIntoView()
    }
  }

  watch(
    () => showFinishTournamentConfirm.value,
    (open) => {
      if (open) scrollToConfirm()
    },
    { flush: 'post' },
  )

  watch(
    () => [props.homeTeam, props.awayTeam] as const,
    async ([home, away], prevPair) => {
      const both = !!(home && away)
      const hadBothBefore = !!(prevPair?.[0] && prevPair?.[1])
      if (!both || hadBothBefore) return
      teamPickersAccordionRef.value?.collapseTeamPickersSection()
      await nextTick()
      scrollMatchCardIntoView()
    },
    { flush: 'post' },
  )

  return {
    scrollExpandedPanelIntoView,
    canFinishTournament,
    canFinishMatchShowResults,
    canFinishMatchSilent,
    isLimitedAdmin,
    homeTeamColorIndex,
    awayTeamColorIndex,
    teamColorIndexForName,
    boardScorePillClass,
    nextMatchConfirmSubtitle,
    teamPickersAccordionRef,
    mgmtToggleId,
    mgmtPanelId,
    isMgmtOpen,
    pendingAction,
    isActionConfirmOpen,
    finishMatchSecondsLeft,
    showFinishTournamentConfirm,
    finishTournamentConfirmSecondsLeft,
    openFinishTournamentConfirm,
    closeFinishTournamentConfirm,
    confirmFinishTournament,
    nextConfirmAnchor,
    matchCardRef,
    matchScoreBoardRef,
    closeActionConfirm,
    openActionConfirm,
    confirmPendingAction,
  }
}
