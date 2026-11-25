/**
 * Безопасный URL картинки игрока из папки public/player-photos/.
 * В колонке players.photo в БД хранится только имя файла (например vasya.jpg), без путей.
 */
export const uploadedPlayerPhotoPattern = /^avatar-(?:[a-z0-9][a-z0-9-]{0,39}-)?[a-f0-9]{32}\.webp$/

export function playerPhotoPublicUrl(photo: string | null | undefined): string | null {
  const t = (photo ?? '').trim()
  if (!t) return null
  if (t.includes('/') || t.includes('\\') || t.includes('..')) return null
  const directory = uploadedPlayerPhotoPattern.test(t) ? '/player-photos/uploads/' : '/player-photos/'
  return directory + encodeURIComponent(t)
}

/**
 * URL для webp-версии той же картинки.
 * Если в БД лежит "vasya.png", вернём "/player-photos/vasya.webp".
 * Если расширения нет, возвращаем null (не угадываем).
 */
export function playerPhotoWebpPublicUrl(photo: string | null | undefined): string | null {
  const t = (photo ?? '').trim()
  if (!t) return null
  if (uploadedPlayerPhotoPattern.test(t)) return playerPhotoPublicUrl(t)
  if (t.includes('/') || t.includes('\\') || t.includes('..')) return null
  const dot = t.lastIndexOf('.')
  if (dot <= 0 || dot === t.length - 1) return null
  const base = t.slice(0, dot)
  return `/player-photos/${encodeURIComponent(`${base}.webp`)}`
}
