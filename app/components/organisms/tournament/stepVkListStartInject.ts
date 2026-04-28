import type { InjectionKey, Ref } from 'vue'

/** Данные для блока «Отменить матч» — передаём через provide/inject, чтобы родитель .vue оставался короче лимита max-lines. */
export type StepVkListStartCancelUi = {
  clearTournamentBusy: Readonly<Ref<boolean>>
  vkBusy: Ref<boolean>
  vkCancelConfirmOpen: Ref<boolean>
  vkCancelSecondsLeft: Ref<number>
  vkCancelIntervalId: Ref<ReturnType<typeof setInterval> | null>
  openVkCancelConfirm: () => void
  closeVkCancelConfirm: () => void
  confirmVkCancelTournament: () => void
}

export const STEP_VK_LIST_START_CANCEL_UI: InjectionKey<StepVkListStartCancelUi> = Symbol(
  'stepVkListStartCancelUi',
)
