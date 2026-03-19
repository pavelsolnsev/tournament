// Этот файл: логика статистики событий в текущем матче.
// Он помогает выбирать активного игрока, накапливать счётчики и сбрасывать матч.
import type { Ref } from 'vue'
import type { PlayerMatchStats, Side, StatKey } from './types'

export type ActiveSelection = { side: Side; playerId: number } | null

// Выбираем игрока, чтобы он мог добавлять события в текущем матче.
export function selectPlayerForMark(
  activeSelection: Ref<ActiveSelection>,
  side: Side,
  playerId: number,
) {
  if (
    activeSelection.value &&
    activeSelection.value.side === side &&
    activeSelection.value.playerId === playerId
  ) {
    activeSelection.value = null
    return
  }

  activeSelection.value = { side, playerId }
}

export function isActivePlayer(activeSelection: Ref<ActiveSelection>, side: Side, playerId: number) {
  // Проверяем, выбран ли конкретный игрок на конкретной стороне.
  return (
    !!activeSelection.value &&
    activeSelection.value.side === side &&
    activeSelection.value.playerId === playerId
  )
}

function ensureStats(
  side: Side,
  playerId: number,
  homeStats: Ref<Record<number, PlayerMatchStats>>,
  awayStats: Ref<Record<number, PlayerMatchStats>>,
): PlayerMatchStats {
  const target = side === 'home' ? homeStats.value : awayStats.value
  if (!target[playerId]) {
    target[playerId] = { goals: 0, assists: 0, saves: 0, yellows: 0 }
  }
  return target[playerId]
}

export function playerStat(
  side: Side,
  playerId: number,
  homeStats: Ref<Record<number, PlayerMatchStats>>,
  awayStats: Ref<Record<number, PlayerMatchStats>>,
): PlayerMatchStats {
  // Возвращаем счётчики игрока, создавая их при первом обращении.
  return ensureStats(side, playerId, homeStats, awayStats)
}

export function incrementStat(
  side: Side,
  playerId: number,
  key: StatKey,
  homeStats: Ref<Record<number, PlayerMatchStats>>,
  awayStats: Ref<Record<number, PlayerMatchStats>>,
) {
  // Увеличиваем один конкретный счётчик события (гол/пас/сейв/желтая).
  const st = ensureStats(side, playerId, homeStats, awayStats)
  st[key] += 1
}

export function onSelectAction(
  side: Side,
  playerId: number,
  evt: Event,
  homeStats: Ref<Record<number, PlayerMatchStats>>,
  awayStats: Ref<Record<number, PlayerMatchStats>>,
) {
  // Обрабатываем событие из <select>: добавляем счётчик и очищаем выбор.
  const select = evt.target as HTMLSelectElement
  const value = select.value as StatKey | ''
  if (!value) return

  incrementStat(side, playerId, value, homeStats, awayStats)
  // Сбрасываем select, чтобы пользователь мог добавить следующее событие.
  select.value = ''
}

export function resetMatchStats(
  homeStats: Ref<Record<number, PlayerMatchStats>>,
  awayStats: Ref<Record<number, PlayerMatchStats>>,
  activeSelection: Ref<ActiveSelection>,
  matchFinalized: Ref<boolean>,
) {
  // Сбрасываем все статистики и закрываем активный выбор игрока.
  homeStats.value = {}
  awayStats.value = {}
  matchFinalized.value = false
  activeSelection.value = null
}

