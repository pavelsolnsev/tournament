import type { PlayerMatchStats } from '~/composables/tournament-standings/types'

/** Simple10: Сумма отметок MVP — если ноль, строку с плашками в карточке не показываем. */
export function mvpMarksTotal(s: PlayerMatchStats): number {
  return s.goals + s.assists + s.saves + s.yellows
}

/** Simple10: Подпись количества голов для карточки «Бомбардир». */
export function pluralGoals(n: number): string {
  if (n === 1) return '1 гол'
  if (n >= 2 && n <= 4) return `${n} гола`
  return `${n} голов`
}

/** Simple10: Подпись для «Ассистент». */
export function pluralAssists(n: number): string {
  if (n === 1) return '1 передача'
  if (n >= 2 && n <= 4) return `${n} передачи`
  return `${n} передач`
}

/** Simple10: Подпись для «Вратарь». */
export function pluralSaves(n: number): string {
  if (n === 1) return '1 сейв'
  if (n >= 2 && n <= 4) return `${n} сейва`
  return `${n} сейвов`
}
