import type { Ref } from 'vue'
import type { MatchStatus } from '~/types/tournament'
import type { SavedStandingsSnapshot } from '~/composables/tournament-wizard/savedContextTypes'
import type { FinishStatus } from '~/composables/useFinishTournament'
import { TOURNAMENT_STATE_NUXT_KEY } from '~/composables/useTournamentState'

export interface StepStandingsRemoteEmit {
  (e: 'update:matchStatus', status: MatchStatus, homeTeam: string, awayTeam: string): void
  (e: 'tournament-finished'): void
}

/** Обработчики матча/синхронизации со зрителем — вынесены из StepStandings.vue для уменьшения размера SFC. */
export function useStepStandingsRemoteHandlers(args: {
  homeTeam: Ref<string>
  awayTeam: Ref<string>
  finishMatch: () => void
  goToNextMatch: () => void
  mergeCurrentMatchFromRemoteSnapshot: (remote: SavedStandingsSnapshot | null | undefined) => void
  resetTournamentMarks: () => void
  fetchRemoteStandingsSnapshot?: () => Promise<SavedStandingsSnapshot | null>
  emit: StepStandingsRemoteEmit
  finishTournament: () => Promise<void>
  finishStatus: Ref<FinishStatus>
}) {
  const {
    homeTeam,
    awayTeam,
    finishMatch,
    goToNextMatch,
    mergeCurrentMatchFromRemoteSnapshot,
    resetTournamentMarks,
    fetchRemoteStandingsSnapshot,
    emit,
    finishTournament,
    finishStatus,
  } = args

  async function handleUpdateHomeTeam(next: string) {
    homeTeam.value = next
    if (homeTeam.value && awayTeam.value) {
      emit('update:matchStatus', 'live', homeTeam.value, awayTeam.value)
      await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
    } else {
      emit('update:matchStatus', 'upcoming', '', '')
    }
  }

  async function handleUpdateAwayTeam(next: string) {
    awayTeam.value = next
    if (homeTeam.value && awayTeam.value) {
      emit('update:matchStatus', 'live', homeTeam.value, awayTeam.value)
      await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
    } else {
      emit('update:matchStatus', 'upcoming', '', '')
    }
  }

  async function pullRemoteMarksIntoCurrentMatch() {
    if (!fetchRemoteStandingsSnapshot) return
    try {
      const remote = await fetchRemoteStandingsSnapshot()
      mergeCurrentMatchFromRemoteSnapshot(remote)
    } catch {
      /* сеть: финализируем хотя бы локальные отметки */
    }
  }

  async function handleFinishMatchShowResults() {
    await pullRemoteMarksIntoCurrentMatch()
    if (homeTeam.value && awayTeam.value) {
      emit('update:matchStatus', 'finished', homeTeam.value, awayTeam.value)
    } else {
      emit('update:matchStatus', 'finished', '', '')
    }
    finishMatch()
    await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
  }

  async function handleFinishMatchSilent() {
    await pullRemoteMarksIntoCurrentMatch()
    finishMatch()
    emit('update:matchStatus', 'upcoming', '', '')
    await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
  }

  async function handleResetTournamentMarks() {
    resetTournamentMarks()
    emit('update:matchStatus', 'upcoming', '', '')
    await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
  }

  async function handleGoToNextMatch() {
    await pullRemoteMarksIntoCurrentMatch()
    goToNextMatch()
    if (homeTeam.value && awayTeam.value) {
      emit('update:matchStatus', 'live', homeTeam.value, awayTeam.value)
    } else {
      emit('update:matchStatus', 'upcoming', '', '')
    }
    await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
  }

  async function handleFinishTournament() {
    await finishTournament()
    if (finishStatus.value === 'success') {
      emit('update:matchStatus', 'finished', '', '')
      emit('tournament-finished')
    }
  }

  return {
    handleUpdateHomeTeam,
    handleUpdateAwayTeam,
    handleFinishMatchShowResults,
    handleFinishMatchSilent,
    handleResetTournamentMarks,
    handleGoToNextMatch,
    handleFinishTournament,
  }
}
