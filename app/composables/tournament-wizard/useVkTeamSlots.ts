// VK слоты команд — часть мастера турнира. Хранит метки игрок→команда и список слотов,
// синхронизирует с БД сразу (без debounce 800ms), чтобы бот видел изменения в roster-snapshot.
import type { Ref } from 'vue'
import { nextTick } from 'vue'
import type { SavedTournamentContext } from '~/composables/tournament-wizard/savedContextTypes'

/** Согласовано с server/utils/tournamentPaidPlayers parseVkTeamSlots. */
const VK_TEAM_SLOT_NAME_MAX = 40
const VK_TEAM_SLOT_MAX = 9

export function findMatchingSlot(raw: string, slots: string[]) {
  const t = String(raw || '').replace(/\s+/g, ' ').trim()
  if (!t) return null
  const low = t.toLowerCase()
  for (const s of slots) {
    if (s.replace(/\s+/g, ' ').trim().toLowerCase() === low) {
      return s
    }
  }
  return null
}

/** Ключ команды для карты лимитов: один пробел, без краёв, нижний регистр (как на сервере/в боте). */
function teamLimitKey(name: string): string {
  return String(name ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
}

export function useVkTeamSlots(deps: {
  selectedIds: Ref<Set<number>>
  vkTeamLabelByPlayerId: Ref<Record<number, string>>
  vkTeamSlots: Ref<string[]>
  vkTeamLimits: Ref<Record<string, number>>
  vkListLimit: Ref<number | undefined>
  stateRestored: Ref<boolean>
  cancelPendingSave: () => void
  saveTournamentStateNow: (ctx: SavedTournamentContext) => Promise<void> | void
  getSavedContext: () => SavedTournamentContext
}) {
  const {
    selectedIds,
    vkTeamLabelByPlayerId,
    vkTeamSlots,
    vkTeamLimits,
    vkListLimit,
    stateRestored,
    cancelPendingSave,
    saveTournamentStateNow,
    getSavedContext,
  } = deps

  function serializeVkTeamLabelsForSave(): Record<string, string> {
    const out: Record<string, string> = {}
    for (const id of selectedIds.value) {
      if (Object.prototype.hasOwnProperty.call(vkTeamLabelByPlayerId.value, id)) {
        const v = vkTeamLabelByPlayerId.value[id]
        out[String(id)] = v && String(v).trim() ? String(v).trim() : ''
      }
    }
    return out
  }

  // Сразу пишем в БД, чтобы бот в roster-snapshot увидел смену без debounce 800ms.
  function flushSaveSoon() {
    if (!stateRestored.value) return
    void nextTick(async () => {
      cancelPendingSave()
      try {
        await saveTournamentStateNow(getSavedContext())
      } catch {
        /* 403 / сеть — debounced put попробует снова при следующем изменении */
      }
    })
  }

  function addVkTeamSlot(rawName: string) {
    const t = String(rawName ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, VK_TEAM_SLOT_NAME_MAX)
    if (!t) return
    const next = [...vkTeamSlots.value]
    if (findMatchingSlot(t, next) != null) return
    if (next.length >= VK_TEAM_SLOT_MAX) return
    next.push(t)
    vkTeamSlots.value = next
    flushSaveSoon()
  }

  function removeVkTeamSlot(rawName: string) {
    const beforeSlots = [...vkTeamSlots.value]
    const m = findMatchingSlot(rawName, beforeSlots)
    if (m == null) return
    const next = beforeSlots.filter((s) => s !== m)
    const v = { ...vkTeamLabelByPlayerId.value }
    for (const id of selectedIds.value) {
      const cur = v[id] != null ? String(v[id]).trim() : ''
      if (cur && findMatchingSlot(cur, beforeSlots) === m) {
        v[id] = ''
      }
    }
    vkTeamSlots.value = next
    vkTeamLabelByPlayerId.value = v
    // Заодно убираем лимит удалённой команды (без delete по динамическому ключу — правило ESLint).
    const key = teamLimitKey(m)
    if (key in vkTeamLimits.value) {
      vkTeamLimits.value = Object.fromEntries(
        Object.entries(vkTeamLimits.value).filter(([k]) => k !== key),
      ) as Record<string, number>
    }
    flushSaveSoon()
  }

  /** Лимит команды: число ≥ 1 (clamp 1..99) задаёт явный лимит; пусто/невалидно — снимает (дефолт в боте). */
  function setVkTeamLimit(rawName: string, rawLimit: number | string | null | undefined) {
    const key = teamLimitKey(rawName)
    if (!key) return
    const n = Math.floor(Number(rawLimit))
    if (rawLimit == null || rawLimit === '' || !Number.isFinite(n) || n < 1) {
      vkTeamLimits.value = Object.fromEntries(
        Object.entries(vkTeamLimits.value).filter(([k]) => k !== key),
      ) as Record<string, number>
    } else {
      vkTeamLimits.value = { ...vkTeamLimits.value, [key]: Math.min(n, 99) }
    }
    flushSaveSoon()
  }

  function setPlayerVkTeam(playerId: number, nextTeam: string | null) {
    const slots = vkTeamSlots.value
    const v = { ...vkTeamLabelByPlayerId.value }
    if (nextTeam == null || !String(nextTeam).trim()) {
      v[playerId] = ''
    } else {
      const raw = String(nextTeam).trim()
      if (slots.length > 0) {
        const m = findMatchingSlot(raw, slots)
        v[playerId] = m != null && m !== '' ? m : raw
      } else {
        v[playerId] = raw
      }
    }
    vkTeamLabelByPlayerId.value = v
    flushSaveSoon()
  }

  /** Общий лимит списка (без команд): число ≥1 (clamp 1..200), пусто/невалидно — снять. */
  function setVkListLimit(rawLimit: number | string | null | undefined) {
    const n = Math.floor(Number(rawLimit))
    if (rawLimit == null || rawLimit === '' || !Number.isFinite(n) || n < 1) {
      vkListLimit.value = undefined
    } else {
      vkListLimit.value = Math.min(n, 200)
    }
    flushSaveSoon()
  }

  return {
    serializeVkTeamLabelsForSave,
    addVkTeamSlot,
    removeVkTeamSlot,
    setVkTeamLimit,
    setVkListLimit,
    setPlayerVkTeam,
  }
}
