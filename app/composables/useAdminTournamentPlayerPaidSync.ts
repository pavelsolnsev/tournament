// Отметка оплаты на шаге «Игроки» + поллинг state, чтобы изменения из ВК подтягивались.
// Simple10: Поллинг реже, чем раньше — на 3G лишние GET /api/tournament/state бьют по скорости.
// Плюс не даём двум событиям (таймер + вкладка + BroadcastChannel) дернуть sync подряд без паузы.
const PAID_SYNC_POLL_MS = 45_000
const PAID_SYNC_MIN_GAP_MS = 1_500

export function useAdminTournamentPlayerPaidSync(opts: {
  wizard: {
    paidPlayerIds: Ref<Set<number>>
    setPlayerPaid: (playerId: number, paid: boolean) => Promise<void>
    step: Ref<0 | 1 | 2>
    /**
     * Пока false (пустой мастер, нет режима списка ВК) — не поллим state;
     * синхронизация остаётся по вкладке / BroadcastChannel / после действий.
     */
    rosterSyncRelevant?: Ref<boolean> | ComputedRef<boolean>
  }
  isAdmin: Ref<boolean>
  isLimitedAdmin: Ref<boolean>
  syncWizardFromServerAfterExternalChange: () => Promise<void>
  broadcastAdminTournamentStateChanged: () => void
}) {
  const paidPlayerIdsView = computed(() => opts.wizard.paidPlayerIds.value)

  async function onTogglePlayerPaid(playerId: number, paid: boolean) {
    await opts.wizard.setPlayerPaid(playerId, paid)
    opts.broadcastAdminTournamentStateChanged()
  }

  let pollTimer: ReturnType<typeof setInterval> | null = null
  let syncInFlight = false
  let lastSyncAt = 0

  async function runPaidSyncThrottled() {
    const now = Date.now()
    if (syncInFlight) return
    if (now - lastSyncAt < PAID_SYNC_MIN_GAP_MS) return
    syncInFlight = true
    lastSyncAt = now
    try {
      await opts.syncWizardFromServerAfterExternalChange()
    } finally {
      syncInFlight = false
    }
  }

  function clearPoll() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }
  function startPollIfNeeded() {
    if (!import.meta.client) return
    clearPoll()
    if (!opts.isAdmin.value || opts.isLimitedAdmin.value || opts.wizard.step.value !== 0) return
    const rel = opts.wizard.rosterSyncRelevant
    if (rel != null && !rel.value) return
    pollTimer = setInterval(() => {
      void runPaidSyncThrottled()
    }, PAID_SYNC_POLL_MS)
  }
  watch(
    () =>
      [
        opts.isAdmin.value,
        opts.isLimitedAdmin.value,
        opts.wizard.step.value,
        opts.wizard.rosterSyncRelevant?.value ?? true,
      ] as const,
    startPollIfNeeded,
    { immediate: true },
  )
  onUnmounted(clearPoll)

  return { paidPlayerIdsView, onTogglePlayerPaid }
}
