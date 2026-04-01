/**
 * Безопасный URL картинки игрока из папки public/player-photos/.
 * В колонке players.photo в БД хранится только имя файла (например vasya.jpg), без путей.
 */
export function playerPhotoPublicUrl(photo: string | null | undefined): string | null {
  const t = (photo ?? '').trim()
  if (!t) return null
  if (t.includes('/') || t.includes('\\') || t.includes('..')) return null
  return `/player-photos/${encodeURIComponent(t)}`
}
