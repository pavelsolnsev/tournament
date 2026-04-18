/* eslint-disable no-misleading-character-class -- диапазоны Unicode для эмодзи; правило ложноположительно на \u в классе. */
const EMOJI_REGEX =
  /[\u{1F000}-\u{1FFFF}\u{1D400}-\u{1D7FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{FE20}-\u{FE2F}\u{FF00}-\u{FFEF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}]/gu
/* eslint-enable no-misleading-character-class */

/** Убираем эмодзи из строки имени — в БД храним текст без сюрпризов в сортировке. */
export function removeEmoji(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return ''
  return text.replace(EMOJI_REGEX, '').trim() || ''
}
