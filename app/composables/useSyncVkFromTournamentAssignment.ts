import type { ComputedRef, Ref } from 'vue'
import { nextTick, watch } from 'vue'
import type { SavedTournamentContext } from '~/composables/tournament-wizard/savedContextTypes'
import { normalizeTeamName } from '~/utils/teamNames'

type AssignmentApi = {
  getTeam: (playerId: number) => string
  assignment: Ref<Record<number, string>>
}

const VK_TEAM_SLOT_NAME_MAX = 40
const VK_TEAM_SLOT_MAX = 9

/**
 * Состав на шаге «Команды» → подписи ВК и слоты кнопок (шаг «Игроки», бот).
 * На шаге 0 не трогаем ВК, чтобы не стереть подписи до распределения по командам.
 */
export function useSyncVkFromTournamentAssignment(opts: {
  stateRestored: Ref<boolean>
  step: Ref<number>
  selectedIds: Ref<Set<number>>
  vkListTournament: Ref<boolean>
  vkTeamSlots: Ref<string[]>
  vkTeamLabelByPlayerId: Ref<Record<number, string>>
  assignment: AssignmentApi
  savedContext: ComputedRef<SavedTournamentContext>
  cancelPendingSave: () => void
  saveTournamentStateNow: (state: SavedTournamentContext) => Promise<void>
  findMatchingSlot: (raw: string, slots: string[]) => string | null
}) {
  // Игроки, у которых в прошлый раз была команда на шаге «Команды».
  // Стираем подпись ВК только им — значит, админ сам убрал игрока из команды.
  // Тех, кого ещё не расставили (например, список команд из БД не успел загрузиться),
  // не трогаем: иначе у всех, кто записался за команду в ВК, команда пропадала.
  let idsWithTeam = new Set<number>()

  function syncVkFromTournamentAssignment() {
    if (!opts.stateRestored.value) return
    if (opts.step.value === 0) return
    if (!opts.vkListTournament.value) return

    const slots = [...opts.vkTeamSlots.value]
    let slotsMutated = false
    const nextLabels: Record<number, string> = { ...opts.vkTeamLabelByPlayerId.value }

    const ensureCanonicalSlot = (teamNorm: string): string => {
      if (!teamNorm) return ''
      const hit = opts.findMatchingSlot(teamNorm, slots)
      if (hit) return hit
      if (slots.length >= VK_TEAM_SLOT_MAX) {
        return teamNorm.slice(0, VK_TEAM_SLOT_NAME_MAX)
      }
      const toAdd = teamNorm.slice(0, VK_TEAM_SLOT_NAME_MAX)
      slots.push(toAdd)
      slotsMutated = true
      return toAdd
    }

    let labelsMutated = false
    const nextIdsWithTeam = new Set<number>()
    for (const id of opts.selectedIds.value) {
      const team = normalizeTeamName(opts.assignment.getTeam(id))
      if (team) nextIdsWithTeam.add(id)
      if (!team) {
        const prev = nextLabels[id] != null ? String(nextLabels[id]).trim() : ''
        if (prev && idsWithTeam.has(id)) {
          nextLabels[id] = ''
          labelsMutated = true
        }
        continue
      }
      const canon = ensureCanonicalSlot(team)
      const prev = nextLabels[id] != null ? String(nextLabels[id]).trim() : ''
      if (prev !== canon) {
        nextLabels[id] = canon
        labelsMutated = true
      }
    }

    idsWithTeam = nextIdsWithTeam

    if (slotsMutated) {
      opts.vkTeamSlots.value = slots
    }

    if (labelsMutated) {
      opts.vkTeamLabelByPlayerId.value = nextLabels
    }

    if (slotsMutated || labelsMutated) {
      void nextTick(async () => {
        opts.cancelPendingSave()
        try {
          await opts.saveTournamentStateNow(opts.savedContext.value)
        } catch {
          /* сеть / 403 */
        }
      })
    }
  }

  watch(opts.stateRestored, (ok) => {
    if (ok) syncVkFromTournamentAssignment()
  })

  watch(opts.step, (s) => {
    if (s === 1 || s === 2) syncVkFromTournamentAssignment()
  })

  watch(
    () => [...opts.selectedIds.value].sort((a, b) => a - b).join(','),
    () => {
      syncVkFromTournamentAssignment()
    },
  )

  watch(
    opts.assignment.assignment,
    () => {
      syncVkFromTournamentAssignment()
    },
    { deep: true },
  )
}
