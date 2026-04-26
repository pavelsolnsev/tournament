// Утилиты для имён команд: одна форма строки и список без дублей (после нормализации).

/** Приводит имя к одному виду: без краевых пробелов и с одним пробелом между словами. */
export function normalizeTeamName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

/**
 * Оставляет каждое «логическое» имя один раз, порядок как в исходном списке.
 * Дубликаты отличающиеся только пробелами считаются одной командой.
 */
export function dedupeTeamNamesPreservingOrder(names: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of names) {
    const key = normalizeTeamName(raw)
    if (!key) continue
    if (seen.has(key)) continue
    seen.add(key)
    out.push(key)
  }
  return out
}

/** Есть ли в списке команда с тем же нормализованным именем. */
export function teamNameCollides(candidate: string, list: string[]): boolean {
  const key = normalizeTeamName(candidate)
  return list.some((x) => normalizeTeamName(x) === key)
}

/**
 * Если label (например подпись команды из ВК) совпадает с именем из справочника команд (БД)
 * с учётом normalize и регистра — возвращает каноническое имя из списка. Иначе null.
 */
export function resolveExistingTeamNameForLabel(label: string, existingTeamNames: string[]): string | null {
  const needle = normalizeTeamName(label)
  if (!needle) return null
  const needleKey = needle.toLowerCase()
  for (const name of existingTeamNames) {
    const canon = normalizeTeamName(name)
    if (!canon) continue
    if (canon.toLowerCase() === needleKey) return canon
  }
  return null
}

/**
 * Приводит ключи карты цветов к канону (trim + один пробел).
 * Нужно чтобы зритель и админка совпадали, даже если в БД лежали «старые» ключи.
 */
export function normalizeTeamColorsMap(map: Record<string, number> | undefined | null): Record<string, number> {
  if (!map || typeof map !== 'object') return {}
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(map)) {
    const key = normalizeTeamName(k)
    if (!key || typeof v !== 'number' || !Number.isFinite(v)) continue
    out[key] = v
  }
  return out
}

const MAX_COLOR_INDEX = 5

/**
 * Индекс цвета команды: сначала карта (по каноническому имени), иначе fallback.
 * Если в карте есть «чужой» ключ с тем же normalize — тоже находим (старые сохранения).
 */
export function resolveTeamColorIndex(
  teamName: string,
  teamColors: Record<string, number> | undefined | null,
  fallbackIndex: number,
): number {
  const key = normalizeTeamName(teamName)
  if (!key) return Math.min(Math.max(0, fallbackIndex), MAX_COLOR_INDEX)
  const map = teamColors
  if (map && typeof map === 'object') {
    const direct = map[key]
    if (typeof direct === 'number' && Number.isFinite(direct)) {
      return Math.min(Math.max(0, direct), MAX_COLOR_INDEX)
    }
    for (const [k, v] of Object.entries(map)) {
      if (normalizeTeamName(k) === key && typeof v === 'number' && Number.isFinite(v)) {
        return Math.min(Math.max(0, v), MAX_COLOR_INDEX)
      }
    }
  }
  return Math.min(Math.max(0, fallbackIndex), MAX_COLOR_INDEX)
}
