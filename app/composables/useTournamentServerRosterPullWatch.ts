import type { ComputedRef, Ref } from 'vue'
import { ref, watch } from 'vue'
import type { SavedTournamentContext } from '~/composables/tournament-wizard/savedContextTypes'
import {
  assignmentFromSavedContext,
  confirmedTeamNamesFromSavedContext,
  rosterSyncFingerprint,
  teamColorsFromSavedContext,
  vkListTournamentFromSavedContext,
  vkTeamLabelMapFromSavedContext,
  vkTeamSlotsFromSavedContext,
} from '~/composables/tournament-wizard/applyServerContext'

/** Подтягиваем состав/команды/ВК с сервера в локальные refs, если админ не правил ростер с этой вкладки. */
export function useTournamentServerRosterPullWatch(opts: {
  stateRestored: Ref<boolean>
  isLoading: Ref<boolean>
  serverState: ComputedRef<SavedTournamentContext | null>
  selectedIds: Ref<Set<number>>
  vkTeamLabelByPlayerId: Ref<Record<number, string>>
  vkTeamSlots: Ref<string[]>
  vkListTournament: Ref<boolean>
  assignmentByPlayerId: Ref<Record<number, string>>
  confirmedTeamNames: Ref<Set<string>>
  teamColors: Ref<Record<string, number>>
  lastAppliedRosterKey: Ref<string>
}) {
  // Отпечаток состава этой вкладки прямо сейчас.
  function currentLocalKey(): string {
    return rosterSyncFingerprint({
      selectedIds: opts.selectedIds.value,
      vkTeamLabelByPlayerId: opts.vkTeamLabelByPlayerId.value,
      vkTeamSlots: opts.vkTeamSlots.value,
      vkListTournament: opts.vkListTournament.value,
      assignmentByPlayerId: opts.assignmentByPlayerId.value,
      confirmedTeamNames: opts.confirmedTeamNames.value,
      teamColors: opts.teamColors.value,
    })
  }

  function serverRosterRev(): number {
    const n = Math.floor(Number(opts.serverState.value?.rosterRev))
    return Number.isFinite(n) && n > 0 ? n : 0
  }

  // Какой состав вкладка отправила на сервер последним и какая версия была на сервере в этот момент.
  // Раньше после сохранения вкладка «залипала»: сервер склеивал её правки с записями из ВК, ответ
  // отличался от локального состава, и вкладка считала, что у неё несохранённые правки — переставала
  // подтягивать сервер и следующим сохранением выкидывала игроков, записавшихся кнопками в ВК.
  const sentRoster = ref<{ key: string; rev: number } | null>(null)

  /** Вызывать перед каждым PUT состояния. */
  function markRosterSent() {
    sentRoster.value = { key: currentLocalKey(), rev: serverRosterRev() }
  }

  watch(
    () =>
      [
        opts.isLoading.value,
        opts.serverState.value?.selectedIds,
        opts.serverState.value?.vkTeamLabelByPlayerId,
        opts.serverState.value?.vkTeamSlots,
        opts.serverState.value?.vkListTournament,
        opts.serverState.value?.assignmentByPlayerId,
        opts.serverState.value?.confirmedTeamNames,
        opts.serverState.value?.teamColors,
      ] as const,
    () => {
      if (!opts.stateRestored.value || opts.isLoading.value) return
      const ctx = opts.serverState.value
      if (!ctx) return
      const serverVkList = vkListTournamentFromSavedContext(ctx)
      const serverLabels = serverVkList ? vkTeamLabelMapFromSavedContext(ctx) : {}
      const serverSlots = serverVkList ? vkTeamSlotsFromSavedContext(ctx) : []
      const serverAssignment = assignmentFromSavedContext(ctx)
      const serverConfirmed = confirmedTeamNamesFromSavedContext(ctx)
      const serverColors = teamColorsFromSavedContext(ctx)
      const serverKey = rosterSyncFingerprint({
        selectedIds: new Set((ctx.selectedIds ?? []).filter((id) => Number.isFinite(id))),
        vkTeamLabelByPlayerId: serverLabels,
        vkTeamSlots: serverSlots,
        vkListTournament: serverVkList,
        assignmentByPlayerId: serverAssignment,
        confirmedTeamNames: serverConfirmed,
        teamColors: serverColors,
      })
      const localKey = rosterSyncFingerprint({
        selectedIds: opts.selectedIds.value,
        vkTeamLabelByPlayerId: opts.vkTeamLabelByPlayerId.value,
        vkTeamSlots: opts.vkTeamSlots.value,
        vkListTournament: opts.vkListTournament.value,
        assignmentByPlayerId: opts.assignmentByPlayerId.value,
        confirmedTeamNames: opts.confirmedTeamNames.value,
        teamColors: opts.teamColors.value,
      })
      if (serverKey === localKey) {
        opts.lastAppliedRosterKey.value = serverKey
        return
      }
      // Забираем состав с сервера, если:
      // — локальных правок нет (состав поменяли на другом устройстве или в ВК);
      // — или наши правки уже отправлены, после этого ничего не меняли, а версия на сервере выросла
      //   (сервер принял их и склеил с ВК) — серверный состав и есть итог, держаться за локальный нельзя.
      const sent = sentRoster.value
      const ourEditsAccepted = sent != null && localKey === sent.key && serverRosterRev() > sent.rev
      if (localKey === opts.lastAppliedRosterKey.value || ourEditsAccepted) {
        sentRoster.value = null
        opts.selectedIds.value = new Set((ctx.selectedIds ?? []).filter((id) => Number.isFinite(id)))
        opts.vkListTournament.value = serverVkList
        opts.vkTeamLabelByPlayerId.value = serverLabels
        opts.vkTeamSlots.value = serverSlots
        opts.assignmentByPlayerId.value = serverAssignment
        opts.confirmedTeamNames.value = new Set(serverConfirmed)
        opts.teamColors.value = serverColors
        opts.lastAppliedRosterKey.value = serverKey
      }
    },
  )

  return { markRosterSent }
}

/**
 * Обёртка над сохранением состояния: перед каждым PUT отмечает, какой состав отправлен.
 * Отметку ставит markRosterSent из useTournamentServerRosterPullWatch (подключается через setMark,
 * потому что сохранения нужны раньше, чем создаётся watcher).
 */
export function withRosterSentMark(stateSync: {
  saveTournamentState: (state: SavedTournamentContext) => void
  saveTournamentStateNow: (state: SavedTournamentContext) => Promise<void>
}) {
  let mark: () => void = () => {}
  return {
    saveTournamentState(state: SavedTournamentContext) {
      mark()
      stateSync.saveTournamentState(state)
    },
    saveTournamentStateNow(state: SavedTournamentContext) {
      mark()
      return stateSync.saveTournamentStateNow(state)
    },
    setMark(fn: () => void) {
      mark = fn
    },
  }
}
