// Отметка оплаты на шаге «Игроки» + поллинг state, чтобы изменения из ВК подтягивались.
export function useAdminTournamentPlayerPaidSync(opts: {
  wizard: {
    paidPlayerIds: Ref<Set<number>>
    setPlayerPaid: (playerId: number, paid: boolean) => Promise<void>
    step: Ref<0 | 1 | 2>
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
    pollTimer = setInterval(() => {
      void opts.syncWizardFromServerAfterExternalChange()
    }, 15_000)
  }
  watch(
    () => [opts.isAdmin.value, opts.isLimitedAdmin.value, opts.wizard.step.value] as const,
    startPollIfNeeded,
    { immediate: true },
  )
  onUnmounted(clearPoll)

  return { paidPlayerIdsView, onTogglePlayerPaid }
}
