// Логика OrganismsTournamentStepStandingsMatchManagement — вынесена из .vue для лимита max-lines.
import type { Player } from '~/types/tournament'
import type { StatKey } from '~/composables/tournament-standings/types'
import { computed, nextTick, ref, watch } from 'vue'
import { useAdminAuth } from '~/composables/useAdminAuth'
import { useConfirmCountdown } from '~/composables/useConfirmCountdown'
import { useTeamColors } from '~/composables/useTeamColors'
import { scrollExpandedPanelIntoView } from '~/utils/scrollExpandedPanelIntoView'
import { reloadWithScrollRestore } from '~/utils/reloadWithScrollRestore'
import { resolveTeamColorIndex } from '~/utils/teamNames'
import { useMatchManagementVkStatus } from '~/composables/stepStandingsMatchManagementVk'

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
  resetTournamentMarks: () => void
  finishMatch: () => void
  finishMatchSilent: () => void | Promise<void>
  finishTournamentStatus: 'idle' | 'loading' | 'success' | 'error'
  finishTournamentError: string | null
  onFinishTournament: () => void
  showClearTournamentConfirm: boolean
  clearTournamentSecondsLeft: number
  clearTournamentBusy: boolean
}

export function useStepStandingsMatchManagement(props: StepStandingsMatchManagementProps) {
  const { getMatchScorePillClass } = useTeamColors()

  const { adminRole } = useAdminAuth()
  const canFinishTournament = computed(() => adminRole.value === 'full')
  const canClearTournament = computed(() => adminRole.value === 'full')
  const canFinishMatchShowResults = computed(() => adminRole.value === 'full')
  const canFinishMatchSilent = computed(() => adminRole.value === 'limited')
  const canViewVkStatus = computed(() => adminRole.value === 'full')
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

  function reloadPage() {
    reloadWithScrollRestore()
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

  const showResetMarksConfirm = ref(false)
  const { secondsLeft: resetMarksSecondsLeft, start: startResetMarksCountdown, stop: stopResetMarksCountdown } = useConfirmCountdown()

  function openResetMarksConfirm() {
    showResetMarksConfirm.value = true
    startResetMarksCountdown()
  }

  function closeResetMarksConfirm() {
    showResetMarksConfirm.value = false
    stopResetMarksCountdown()
  }

  function confirmResetMarks() {
    props.resetTournamentMarks()
    closeResetMarksConfirm()
  }

  const {
    vkStatusPending,
    vkStatusError,
    vkStatusLinked,
    vkPeerId,
    refreshVkStatus,
  } = useMatchManagementVkStatus(canViewVkStatus)

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
  const finishConfirmAnchor = useTemplateRef<HTMLDivElement>('finishConfirmAnchor')
  const finishSilentConfirmAnchor = useTemplateRef<HTMLDivElement>('finishSilentConfirmAnchor')
  const finishTournamentConfirmAnchor = useTemplateRef<HTMLDivElement>('finishTournamentConfirmAnchor')
  const clearDataConfirmAnchor = useTemplateRef<HTMLDivElement>('clearDataConfirmAnchor')
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

  function scrollConfirmIntoView(el: HTMLElement | null | undefined) {
    void nextTick(() => {
      el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    })
  }

  function closeActionConfirm() {
    stopFinishMatchCountdown()
    pendingAction.value = null
  }

  function openActionConfirm(action: 'next' | 'finish' | 'finishSilent') {
    pendingAction.value = action
    const el =
      action === 'next'
        ? nextConfirmAnchor.value
        : action === 'finishSilent'
          ? finishSilentConfirmAnchor.value
          : finishConfirmAnchor.value
    scrollConfirmIntoView(el)
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
    () => props.showClearTournamentConfirm,
    (open) => {
      if (!open) return
      scrollConfirmIntoView(clearDataConfirmAnchor.value)
    },
    { flush: 'post' },
  )

  watch(
    () => showFinishTournamentConfirm.value,
    (open) => {
      if (open) scrollConfirmIntoView(finishTournamentConfirmAnchor.value)
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
    canClearTournament,
    canFinishMatchShowResults,
    canFinishMatchSilent,
    canViewVkStatus,
    isLimitedAdmin,
    homeTeamColorIndex,
    awayTeamColorIndex,
    teamColorIndexForName,
    reloadPage,
    boardScorePillClass,
    nextMatchConfirmSubtitle,
    teamPickersAccordionRef,
    mgmtToggleId,
    mgmtPanelId,
    isMgmtOpen,
    pendingAction,
    isActionConfirmOpen,
    showResetMarksConfirm,
    resetMarksSecondsLeft,
    openResetMarksConfirm,
    closeResetMarksConfirm,
    confirmResetMarks,
    vkStatusPending,
    vkStatusError,
    vkStatusLinked,
    vkPeerId,
    refreshVkStatus,
    finishMatchSecondsLeft,
    showFinishTournamentConfirm,
    finishTournamentConfirmSecondsLeft,
    openFinishTournamentConfirm,
    closeFinishTournamentConfirm,
    confirmFinishTournament,
    nextConfirmAnchor,
    finishConfirmAnchor,
    finishSilentConfirmAnchor,
    finishTournamentConfirmAnchor,
    clearDataConfirmAnchor,
    matchCardRef,
    matchScoreBoardRef,
    closeActionConfirm,
    openActionConfirm,
    confirmPendingAction,
  }
}
