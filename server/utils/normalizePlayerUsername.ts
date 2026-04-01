/**
 * Приводит username для записи в MySQL: срезает ведущие «@», пустая строка → null.
 * Плейсхолдер «без ника» в БД хранится как @unknown — так в колонке видно, что это не обычный логин.
 */
export function normalizePlayerUsername(text: string | null | undefined): string | null {
  const cleaned = (text ?? '').replace(/^@+/, '').trim()
  if (!cleaned) return null
  if (cleaned.toLowerCase() === 'unknown') return '@unknown'
  return cleaned
}
