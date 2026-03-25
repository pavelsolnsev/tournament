// Этот файл: расчёт дельты рейтинга игрока за один матч.
// Логика точно портирована из matchHelpers.js телеграм-бота.
import type { PlayerMatchStats } from './types'

// Округляем до 1 знака после запятой.
export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

// Модификатор роста — чем выше рейтинг, тем медленнее растёт (не быстрее 1, не медленнее 0.2).
export function growthModifier(baseRating: number): number {
  return Math.max(0.2, 1 - baseRating / 250)
}

// Считаем итоговую дельту рейтинга за один матч для одного игрока.
// baseRating — рейтинг игрока ДО матча (из БД).
export function calculateMatchRatingDelta(
  stats: PlayerMatchStats,
  baseRating: number,
  isWin: boolean,
  isDraw: boolean,
  isLose: boolean,
  teamGoals: number,
  opponentGoals: number,
): number {
  const mod = growthModifier(baseRating)

  const goals = stats.goals
  const assists = stats.assists
  const saves = stats.saves
  // В типе PlayerMatchStats поле называется yellows — в боте yellowCards.
  const yellowCards = stats.yellows

  // Базовые дельты за события.
  const goalDelta = goals * 0.3 * mod
  const assistDelta = assists * 0.3 * mod
  const saveDelta = saves * 0.2 * mod
  const yellowCardDelta = yellowCards * -0.3

  // Голевые бонусы: покер (4+) > хет-трик (3) > дубль (2) — берём максимальный.
  const goalBonus =
    goals >= 4 ? 0.7 * mod
    : goals >= 3 ? 0.4 * mod
    : goals >= 2 ? 0.3 * mod
    : 0

  // Ассистентские бонусы: плеймейкер (4+) > мастер (3) > ассист (2).
  const assistBonus =
    assists >= 4 ? 0.7 * mod
    : assists >= 3 ? 0.4 * mod
    : assists >= 2 ? 0.3 * mod
    : 0

  // Вратарские бонусы: сухой лист + бонус за серию сейвов.
  const cleanSheetBonus = saves > 0 && opponentGoals === 0 ? 0.2 * mod : 0
  const saveBonus =
    saves >= 4 ? 0.5 * mod
    : saves >= 3 ? 0.3 * mod
    : saves >= 2 ? 0.2 * mod
    : 0

  // Победа: базовая + бонус за сухую победу (3:0 и выше).
  const isShutoutWin = isWin && teamGoals >= 3 && opponentGoals === 0
  const winDelta = isWin ? 1.8 * mod : 0
  const shutoutWinBonus = isShutoutWin ? 0.5 * mod : 0

  // Ничья.
  const drawDelta = isDraw ? 0.5 * mod : 0

  // Поражение: базовый штраф + смягчение за результативных игроков.
  const isShutoutLoss = isLose && opponentGoals >= 3 && teamGoals === 0
  const totalActions = goals + assists + saves

  // Герой проигравших — 2+ гола: -0.5 от штрафа.
  const heroLossReduction = isLose && goals >= 2 ? 0.5 : 0
  // Боролся до конца — 2+ действий (но не герой): -0.4 от штрафа.
  const fighterLossReduction = isLose && goals < 2 && totalActions >= 2 ? 0.4 : 0
  const loseReduction = heroLossReduction + fighterLossReduction

  const baseLoseDelta = isShutoutLoss ? -1.8 : isLose ? -1.3 : 0
  const loseDelta = baseLoseDelta + loseReduction

  // Итоговая дельта — сумма всех составляющих.
  const delta =
    goalDelta + assistDelta + saveDelta
    + goalBonus + assistBonus
    + cleanSheetBonus + saveBonus
    + winDelta + shutoutWinBonus
    + drawDelta + loseDelta
    + yellowCardDelta

  return round1(delta)
}
