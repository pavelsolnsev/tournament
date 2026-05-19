import type { InjectionKey, ShallowRef } from 'vue'

/** Ref’ы DOM для scrollIntoView подтверждений — provide/inject между StepStandingsMatchManagement и панелью. */
export type MatchManagementConfirmAnchors = {
  finishConfirmAnchor: ShallowRef<HTMLDivElement | null>
  finishSilentConfirmAnchor: ShallowRef<HTMLDivElement | null>
  finishTournamentConfirmAnchor: ShallowRef<HTMLDivElement | null>
}

export const matchManagementConfirmAnchorsKey: InjectionKey<MatchManagementConfirmAnchors> = Symbol(
  'stepStandingsMatchManagementConfirmAnchors',
)
