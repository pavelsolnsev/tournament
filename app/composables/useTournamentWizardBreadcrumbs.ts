import { computed } from 'vue'
import type { useTournamentWizard } from '~/composables/useTournamentWizard'

type Wizard = ReturnType<typeof useTournamentWizard>

export const tournamentWizardBreadcrumbs = [
  { step: 0, label: 'Игроки' },
  { step: 1, label: 'Команды' },
  { step: 2, label: 'Таблица' },
] as const

/**
 * Крошки мастера:
 * — «Команды»: как кнопка «Перейти к командам» (игроки + место + формат), с любого шага.
 * — «Таблица»: всегда доступна (как раньше по навигации).
 */
export function useTournamentWizardBreadcrumbs(
  wizard: Wizard,
  goToStandings: () => void | Promise<void>,
) {
  const canGoToTeamsFromPlayersStep = computed(
    () =>
      wizard.selectedPlayers.value.length > 0 &&
      wizard.venueLabel.value.trim() !== '' &&
      wizard.formatLabel.value.trim() !== '',
  )

  function isBreadcrumbStepEnabled(step: 0 | 1 | 2): boolean {
    if (step === wizard.step.value) return false
    if (step === 1) {
      return canGoToTeamsFromPlayersStep.value
    }
    return true
  }

  function breadcrumbDisabledTitle(step: 0 | 1 | 2): string | undefined {
    if (step === 1 && !canGoToTeamsFromPlayersStep.value) {
      return 'Выберите игроков и укажите место и формат'
    }
    return undefined
  }

  function navigateBreadcrumb(step: 0 | 1 | 2) {
    if (step === wizard.step.value) return
    if (!isBreadcrumbStepEnabled(step)) return
    if (step === 2) void goToStandings()
    else wizard.step.value = step
  }

  return {
    breadcrumbs: tournamentWizardBreadcrumbs,
    isBreadcrumbStepEnabled,
    breadcrumbDisabledTitle,
    navigateBreadcrumb,
  }
}
