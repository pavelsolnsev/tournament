import type { Ref } from 'vue'
import type { useTournamentWizard } from '~/composables/useTournamentWizard'
import type { useTournamentState } from '~/composables/useTournamentState'
import { TOURNAMENT_STATE_NUXT_KEY } from '~/composables/useTournamentState'

const ADMIN_TOURNAMENT_BC = 'football-tournament-admin-sync'

type Wizard = ReturnType<typeof useTournamentWizard>
type TournamentState = ReturnType<typeof useTournamentState>

/** Синхронизация вкладок админки, сброс турнира и навигация по шагам — логика с index.vue. */
export function useHomePageAdminTournament(args: {
  wizard: Wizard
  tournamentState: TournamentState
  isAdmin: Ref<boolean>
  clearTournamentBottomAnchor: Ref<HTMLDivElement | null | undefined>
}) {
  const { wizard, tournamentState, isAdmin, clearTournamentBottomAnchor } = args

  let adminTournamentBc: BroadcastChannel | null = null

  async function fetchRemoteStandingsSnapshotForMerge() {
    await tournamentState.refresh()
    return tournamentState.serverState.value?.standingsSnapshot ?? null
  }

  async function syncWizardFromServerAfterExternalChange() {
    if (!isAdmin.value) return
    await tournamentState.refresh()
    await nextTick()
    wizard.reapplyFromServer()
  }

  function onAdminVisibilitySync() {
    if (document.visibilityState !== 'visible') return
    if (!isAdmin.value) return
    void syncWizardFromServerAfterExternalChange()
  }

  function broadcastAdminTournamentStateChanged() {
    if (!import.meta.client || !isAdmin.value) return
    try {
      adminTournamentBc?.postMessage({ type: 'tournament-state-sync', ts: Date.now() })
    } catch {
      /* BroadcastChannel может быть недоступен */
    }
  }

  onMounted(() => {
    if (!import.meta.client) return
    const match = document.cookie.match(/(?:^|; )admin_session=([^;]*)/)
    const cookieValue = match ? decodeURIComponent(match[1] ?? '') : ''
    if (cookieValue !== 'full' && cookieValue !== 'limited') return
    if (typeof BroadcastChannel !== 'undefined') {
      adminTournamentBc = new BroadcastChannel(ADMIN_TOURNAMENT_BC)
      adminTournamentBc.onmessage = () => {
        void syncWizardFromServerAfterExternalChange()
      }
    }
    document.addEventListener('visibilitychange', onAdminVisibilitySync)
  })

  const showClearTournamentConfirm = ref(false)
  const clearTournamentBusy = ref(false)
  const clearTournamentError = ref<string | null>(null)
  const clearTournamentSeconds = ref(3)
  let clearTournamentCountdown: ReturnType<typeof setInterval> | null = null

  function startClearTournamentCountdown() {
    clearTournamentSeconds.value = 3
    clearTournamentCountdown = setInterval(() => {
      clearTournamentSeconds.value -= 1
      if (clearTournamentSeconds.value <= 0 && clearTournamentCountdown) {
        clearInterval(clearTournamentCountdown)
        clearTournamentCountdown = null
      }
    }, 1000)
  }

  watch(showClearTournamentConfirm, (open) => {
    if (open) {
      clearTournamentError.value = null
      startClearTournamentCountdown()
    }
    else {
      if (clearTournamentCountdown) {
        clearInterval(clearTournamentCountdown)
        clearTournamentCountdown = null
      }
      clearTournamentSeconds.value = 3
    }
  })

  watch(
    showClearTournamentConfirm,
    (open) => {
      if (!open || wizard.step.value === 2) return
      void nextTick(() => {
        clearTournamentBottomAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      })
    },
    { flush: 'post' },
  )

  onUnmounted(() => {
    if (clearTournamentCountdown) clearInterval(clearTournamentCountdown)
    document.removeEventListener('visibilitychange', onAdminVisibilitySync)
    adminTournamentBc?.close()
    adminTournamentBc = null
  })

  function cancelClearTournament() {
    showClearTournamentConfirm.value = false
  }

  async function confirmClearTournament() {
    clearTournamentBusy.value = true
    clearTournamentError.value = null
    try {
      try {
        await wizard.resetWizard()
      } catch (e) {
        if (import.meta.dev) console.error('[clear-tournament] resetWizard failed (first try):', e)
        await new Promise((r) => setTimeout(r, 500))
        await wizard.resetWizard()
      }
      await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
      broadcastAdminTournamentStateChanged()
      showClearTournamentConfirm.value = false
    } catch (e) {
      if (import.meta.dev) console.error('[clear-tournament] failed:', e)
      clearTournamentError.value = 'Не удалось очистить данные. Попробуйте ещё раз.'
    } finally {
      clearTournamentBusy.value = false
    }
  }

  async function goToStandings() {
    wizard.step.value = 2
    await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
  }

  function navigateBreadcrumb(step: 0 | 1 | 2) {
    if (step === wizard.step.value) return
    if (step === 2) void goToStandings()
    else wizard.step.value = step
  }

  async function handleTournamentFinished() {
    await nextTick()
    await wizard.saveCurrentTournamentStateNow()
    await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
    await wizard.resetWizard()
    await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
    broadcastAdminTournamentStateChanged()
  }

  return {
    fetchRemoteStandingsSnapshotForMerge,
    syncWizardFromServerAfterExternalChange,
    broadcastAdminTournamentStateChanged,
    showClearTournamentConfirm,
    clearTournamentBusy,
    clearTournamentError,
    clearTournamentSeconds,
    cancelClearTournament,
    confirmClearTournament,
    goToStandings,
    navigateBreadcrumb,
    handleTournamentFinished,
  }
}
