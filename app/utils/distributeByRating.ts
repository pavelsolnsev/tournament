// Утилита: автоматическое распределение игроков по командам на основе рейтинга.
//
// Алгоритм «змейка» (snake draft):
//   Тур 1: команда 1 → 2 → 3 → ...
//   Тур 2: ... → 3 → 2 → 1
//   Тур 3: снова слева направо, и т.д.
//
// Это даёт строго равное количество игроков в командах (±1 при нечётном числе)
// и хорошо сбалансированный суммарный рейтинг — лучший выбор даёт команде
// следующий выбор в обратную сторону.

import type { Player } from '~/types/tournament'

export interface DistributionResult {
  // Название команды → массив ID игроков
  teamAssignments: Record<string, number[]>
  // Название команды → суммарный рейтинг
  teamRatings: Record<string, number>
}

/**
 * Распределяет игроков по teamCount командам методом «змейки».
 * Гарантирует:
 * - разница в количестве игроков между командами не больше 1
 * - суммарные рейтинги максимально близки
 */
export function distributePlayersByRating(
  players: Player[],
  teamCount: number,
): DistributionResult {
  // Ограничиваем количество команд: минимум 2, максимум 4.
  const count = Math.min(4, Math.max(2, teamCount))

  // Сортируем игроков по рейтингу от большего к меньшему.
  // Игроки без рейтинга получают 0 и уходят в конец.
  const sorted = [...players].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))

  // Создаём пустые команды с именами «Команда 1», «Команда 2», ...
  const teamNames: string[] = Array.from({ length: count }, (_, i) => `Команда ${i + 1}`)

  const teamRatings: Record<string, number> = {}
  const teamAssignments: Record<string, number[]> = {}
  for (const name of teamNames) {
    teamRatings[name] = 0
    teamAssignments[name] = []
  }

  // Строим порядок команд по методу «змейки»:
  // тур 1: [0, 1, 2], тур 2: [2, 1, 0], тур 3: [0, 1, 2], ...
  // Каждый тур вмещает `count` игроков — по одному на команду.
  const snakeOrder: number[] = []
  const totalRounds = Math.ceil(sorted.length / count)
  for (let round = 0; round < totalRounds; round++) {
    // Чётный тур — слева направо, нечётный — справа налево.
    const indices = Array.from({ length: count }, (_, i) => i)
    if (round % 2 === 1) indices.reverse()
    snakeOrder.push(...indices)
  }

  // Назначаем каждого игрока в команду согласно рассчитанному порядку змейки.
  for (let i = 0; i < sorted.length; i++) {
    const player = sorted[i]
    const teamIndex = snakeOrder[i]
    const teamName = teamNames[teamIndex]
    teamAssignments[teamName].push(player.id)
    teamRatings[teamName] += player.rating ?? 0
  }

  return { teamAssignments, teamRatings }
}
