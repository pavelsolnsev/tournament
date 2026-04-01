// Этот файл: единый формат подписи игрока и ограничение длины, чтобы на узком экране не ломать вёрстку.
import type { Player } from '~/types/tournament'

/** Максимум символов в подписи; дальше ставим «…», чтобы длинные ники не раздували строки. */
export const PLAYER_LABEL_MAX_CHARS = 28

/** Иконка уровня рейтинга (целое число после округления). */
export function ratingTierEmoji(ratingRounded: number): string {
  if (ratingRounded < 10) return '⭐️'
  if (ratingRounded < 30) return '💫'
  if (ratingRounded < 60) return '✨'
  if (ratingRounded < 100) return '🌠'
  if (ratingRounded < 150) return '💎'
  return '🏆'
}

// Обрезаем строку по длине: на мобильных и в таблицах так безопаснее, чем ждать только CSS.
export function clipLongPlayerLabel(text: string): string {
  const t = text.trim()
  if (!t) return '—'
  if (t.length <= PLAYER_LABEL_MAX_CHARS) return t
  const cut = Math.max(1, PLAYER_LABEL_MAX_CHARS - 1)
  return `${t.slice(0, cut)}…`
}

/** Все эмодзи уровня из ratingTierEmoji — нужны, чтобы срезать старые подписи с рейтингом в конце строки. */
const RATING_TIER_EMOJI_ALTERNATION = ['⭐️', '💫', '✨', '🌠', '💎', '🏆']
  .map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|')

/**
 * Убирает суффикс рейтинга из сохранённой подписи игрока.
 * Поддерживает два формата, которые использовались в разное время:
 *   - новый:  «Ник ⭐️ 45»   (эмодзи уровня + число)
 *   - старый: «Ник (45)»     (число в скобках)
 */
export function stripRatingFromDisplayLabel(label: string): string {
  const t = label.trimEnd()
  if (!t) return '—'
  // Сначала пробуем новый формат: пробел + эмодзи уровня + пробел + число в конце строки.
  const reNew = new RegExp(`^(.*)\\s+(?:${RATING_TIER_EMOJI_ALTERNATION})\\s+\\d+$`)
  const mNew = t.match(reNew)
  if (mNew) return mNew[1]!.trimEnd() || '—'
  // Затем старый формат: пробел + «(число)» в конце строки.
  const reOld = /^(.*)\s+\(\d+\)$/
  const mOld = t.match(reOld)
  if (mOld) return mOld[1]!.trimEnd() || '—'
  return t
}

/** Подпись игрока без рейтинга — для деталей сыгранного матча и похожих мест. */
export function displayPlayerLabelWithoutRating(p: Player): string {
  const cleaned = p.username?.replace(/^@+/, '').trim()
  const raw =
    !cleaned || cleaned.toLowerCase() === 'unknown'
      ? (p.name || '').trim()
      : cleaned
  return clipLongPlayerLabel(raw)
}

export function usePlayerDisplay() {
  function displayPlayerLabel(p: Player) {
    // Берём ник без @, чтобы подпись была чистой и одинаковой во всех списках.
    const cleaned = p.username?.replace(/^@+/, '').trim()
    // Если ника нет или он "unknown", показываем обычное имя игрока.
    const raw =
      !cleaned || cleaned.toLowerCase() === 'unknown'
        ? (p.name || '').trim()
        : cleaned
    // Приводим рейтинг к числу, потому что из БД он может прийти строкой.
    const ratingValue = Number(p.rating)
    // Проверяем, что рейтинг валиден и конечен, чтобы не показать NaN в UI.
    const hasRating = Number.isFinite(ratingValue)
    // Если рейтинга нет, оставляем старое поведение и просто безопасно обрезаем подпись.
    if (!hasRating) {
      return clipLongPlayerLabel(raw)
    }

    // Суффикс: эмодзи уровня + число, без скобок.
    const r = Math.round(ratingValue)
    const ratingSuffix = ` ${ratingTierEmoji(r)} ${r}`
    // Считаем, сколько символов остаётся для ника после суффикса с рейтингом.
    const maxNameChars = Math.max(1, PLAYER_LABEL_MAX_CHARS - ratingSuffix.length)
    // Обрезаем только ник, чтобы рейтинг не попадал под сокращение.
    const clippedName = raw.length <= maxNameChars
      ? raw
      : `${raw.slice(0, Math.max(1, maxNameChars - 1))}…`
    // Склеиваем: сокращённый ник + иконка уровня + значение рейтинга.
    return `${clippedName}${ratingSuffix}`
  }

  return {
    displayPlayerLabel,
    displayPlayerLabelWithoutRating,
    ratingTierEmoji,
  }
}
