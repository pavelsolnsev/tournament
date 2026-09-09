// Имя команды для показа. Авто-команды из распределения по рейтингу называются «Команда 1»,
// «Команда 2» и так далее, а логотипа у них нет — вместо него цветной маркер.
// Такую команду показываем по её цвету: 🔵 Синие вместо 🔵 Команда 2.
import { normalizeTeamName } from '~/utils/teamNames'

/** Авто-имя из распределения по рейтингу. */
const AUTO_TEAM_NAME_RE = /^команда\s*\d+$/i

/** Порядок совпадает с teamMarkers в useTeamColors: 🔴 🔵 🟢 🟡 ⚪ ⚫. */
export const TEAM_COLOR_NAMES = ['Красные', 'Синие', 'Зелёные', 'Жёлтые', 'Белые', 'Чёрные'] as const

/** Эмодзи-маркер → цвет, когда под рукой только он (маркер уже посчитан для картинки). */
const COLOR_NAME_BY_MARKER: Record<string, string> = {
  '🔴': 'Красные',
  '🔵': 'Синие',
  '🟢': 'Зелёные',
  '🟡': 'Жёлтые',
  '⚪': 'Белые',
  '⚫': 'Чёрные',
}

/** Команда названа автоматически при распределении по рейтингу. */
export function isAutoTeamName(name: string): boolean {
  return AUTO_TEAM_NAME_RE.test(normalizeTeamName(String(name ?? '')))
}

/** Подпись команды: авто-команду зовём по цвету, у остальных имя оставляем как есть. */
export function teamDisplayName(name: string, colorIndex: number | null | undefined): string {
  const raw = normalizeTeamName(String(name ?? ''))
  if (!raw || !isAutoTeamName(raw)) return raw
  // Индекса нет — цвет неизвестен, оставляем имя как есть (Number(null) дал бы 0 и «Красные»).
  if (colorIndex == null) return raw
  const idx = Math.floor(Number(colorIndex))
  if (!Number.isFinite(idx) || idx < 0 || idx >= TEAM_COLOR_NAMES.length) return raw
  return TEAM_COLOR_NAMES[idx] ?? raw
}

/** То же самое, но по эмодзи-маркеру — им удобно пользоваться там, где маркер уже посчитан. */
export function teamDisplayNameByMarker(name: string, marker: string): string {
  const raw = normalizeTeamName(String(name ?? ''))
  if (!raw || !isAutoTeamName(raw)) return raw
  return COLOR_NAME_BY_MARKER[String(marker ?? '').trim()] ?? raw
}
