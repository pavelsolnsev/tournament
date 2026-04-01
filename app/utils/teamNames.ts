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
