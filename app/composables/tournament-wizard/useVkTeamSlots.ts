// VK слоты команд — часть мастера турнира. Хранит метки игрок→команда и список слотов,
// синхронизирует с БД сразу (без debounce 800ms), чтобы бот видел изменения в roster-snapshot.
import type { Ref } from 'vue'
import { nextTick, ref, watch } from 'vue'
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

function normLabel(v: unknown): string {
  return v != null ? String(v).replace(/\s+/g, ' ').trim() : ''
}

/**
 * Какие команды игроков отправить на сервер. Шлём только то, что админ поменял в этой вкладке
 * относительно последней версии с сервера (base). Остальное сервер возьмёт из БД.
 * Раньше уходила вся карта целиком, и отставшая вкладка затирала команды, выбранные игроками в ВК.
 */
export function diffVkTeamLabelsForSave(
  selectedIds: Iterable<number>,
  local: Record<number, string>,
  base: Record<number, string>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const id of selectedIds) {
    if (!Object.prototype.hasOwnProperty.call(local, id)) continue
    const cur = normLabel(local[id])
    if (cur === normLabel(base[id])) continue
    out[String(id)] = cur
  }
  return out
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
  /** Отпечаток ростера, последний раз принятого с сервера (меняется вместе с командами). */
  lastAppliedRosterKey: Ref<string>
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

  // Команды игроков в том виде, как их последний раз прислал сервер. Снимок делаем в момент,
  // когда вкладка принимает состав с сервера (flush: 'sync' — до того, как другие watcher'ы что-то поменяют).
  const vkLabelsBase = ref<Record<number, string>>({})
  watch(
    deps.lastAppliedRosterKey,
    () => {
      vkLabelsBase.value = { ...vkTeamLabelByPlayerId.value }
    },
    { flush: 'sync' },
  )

  function serializeVkTeamLabelsForSave(): Record<string, string> {
    return diffVkTeamLabelsForSave(selectedIds.value, vkTeamLabelByPlayerId.value, vkLabelsBase.value)
  }

  // Сразу пишем в БД, чтобы бот в roster-snapshot увидел смену без debounce 800ms.
  // extra — служебные флаги тела PUT (например, «слоты команд правил админ»), в БД они не попадают.
  function flushSaveSoon(extra?: Partial<SavedTournamentContext>) {
    if (!stateRestored.value) return
    void nextTick(async () => {
      cancelPendingSave()
      try {
        const ctx = getSavedContext()
        await saveTournamentStateNow(extra ? { ...ctx, ...extra } : ctx)
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
    flushSaveSoon({ __vkTeamSlotsAuthoritative: true })
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
    // Флаг «слоты заданы админом»: если убрали последнюю команду, сервер сохранит пустой список,
    // а не подставит прошлые слоты из БД (та защита нужна против устаревшей вкладки).
    flushSaveSoon({ __vkTeamSlotsAuthoritative: true })
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
