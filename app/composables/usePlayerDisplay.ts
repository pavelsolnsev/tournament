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

/** Части подписи для вёрстки: имя можно сжимать (truncate), рейтинг — всегда целиком справа. */
export function playerLabelRatingParts(p: Player): { name: string; rating: string | null } {
  const cleaned = p.username?.replace(/^@+/, '').trim()
  const raw =
    !cleaned || cleaned.toLowerCase() === 'unknown'
      ? (p.name || '').trim()
      : cleaned
  const ratingValue = Number(p.rating)
  const hasRating = Number.isFinite(ratingValue)
  if (!hasRating) {
    return { name: clipLongPlayerLabel(raw), rating: null }
  }
  const r = Math.round(ratingValue)
  const emoji = ratingTierEmoji(r)
  const ratingSuffix = ` ${emoji} ${r}`
  const maxNameChars = Math.max(1, PLAYER_LABEL_MAX_CHARS - ratingSuffix.length)
  const clippedName =
    raw.length <= maxNameChars
      ? raw
      : `${raw.slice(0, Math.max(1, maxNameChars - 1))}…`
  return { name: clippedName, rating: `${emoji} ${r}` }
}

export function usePlayerDisplay() {
  function displayPlayerLabel(p: Player) {
    const { name, rating } = playerLabelRatingParts(p)
    return rating ? `${name} ${rating}` : name
  }

  return {
    displayPlayerLabel,
    displayPlayerLabelWithoutRating,
    playerLabelRatingParts,
    ratingTierEmoji,
  }
}
