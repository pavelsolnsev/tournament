// Этот файл: единый формат подписи игрока и ограничение длины, чтобы на узком экране не ломать вёрстку.
import type { Player } from '~/types/tournament'

/** Максимум символов в подписи; дальше ставим «…», чтобы длинные ники не раздували строки. */
export const PLAYER_LABEL_MAX_CHARS = 28

// Обрезаем строку по длине: на мобильных и в таблицах так безопаснее, чем ждать только CSS.
export function clipLongPlayerLabel(text: string): string {
  const t = text.trim()
  if (!t) return '—'
  if (t.length <= PLAYER_LABEL_MAX_CHARS) return t
  const cut = Math.max(1, PLAYER_LABEL_MAX_CHARS - 1)
  return `${t.slice(0, cut)}…`
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

    // Готовим суффикс рейтинга, который должен быть виден всегда.
    const ratingSuffix = ` (${Math.round(ratingValue)})`
    // Считаем, сколько символов остаётся для ника после обязательного рейтинга.
    const maxNameChars = Math.max(1, PLAYER_LABEL_MAX_CHARS - ratingSuffix.length)
    // Обрезаем только ник, чтобы рейтинг не попадал под сокращение.
    const clippedName = raw.length <= maxNameChars
      ? raw
      : `${raw.slice(0, Math.max(1, maxNameChars - 1))}…`
    // Склеиваем: сокращённый ник + полный рейтинг.
    return `${clippedName}${ratingSuffix}`
  }

  return {
    displayPlayerLabel,
  }
}
