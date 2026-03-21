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
    const cleaned = p.username?.replace(/^@+/, '').trim()
    const raw =
      !cleaned || cleaned.toLowerCase() === 'unknown'
        ? (p.name || '').trim()
        : cleaned
    return clipLongPlayerLabel(raw)
  }

  return {
    displayPlayerLabel,
  }
}
