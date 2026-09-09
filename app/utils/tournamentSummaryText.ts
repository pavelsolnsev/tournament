// Этот файл: собирает все итоги турнира в один простой текст без HTML.
// Нужен, чтобы админ мог скопировать полную сводку и вставить её в чат, заметки или письмо.
import { teamDisplayNameByMarker } from '~/utils/teamDisplayName'
import type { Player } from '~/types/tournament'
import type { PlayedMatch, PlayerMatchStats } from '~/composables/tournament-standings/types'
import type { AwardWinner, TournamentSummary } from '~/composables/tournament-summary/types'

export type TournamentTextExportParams = {
  tournamentName: string
  tournamentDate?: string
  venueLabel?: string
  formatLabel?: string
  pageUrl?: string
  summary: TournamentSummary
  players: Player[]
  assignmentByPlayerId: Record<number, string>
  aggregatePlayerStats: Record<number, PlayerMatchStats>
  playerRatingDeltas: Record<number, number>
  playedMatchesList: PlayedMatch[]
  /** Эмодзи-маркер команды — тот же, что в UI (🔴 🟢 🔵 …). */
  teamMarker: (teamName: string) => string
}

const EMPTY_STATS: PlayerMatchStats = { goals: 0, assists: 0, saves: 0, yellows: 0 }

// Дата в человеческом виде: «2026-07-30» → «30 июля 2026».
function formatDateRu(raw?: string): string {
  const t = (raw ?? '').trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return ''
  const y = Number(t.slice(0, 4))
  const m = Number(t.slice(5, 7))
  const d = Number(t.slice(8, 10))
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Убираем лишний ноль после запятой: 3.0 → «3», 3.75 → «3.8».
function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : (Math.round(value * 10) / 10).toFixed(1)
}

// Дельта рейтинга всегда со знаком, чтобы было видно рост или падение.
function formatDelta(value: number): string {
  if (!value) return '0'
  const num = formatNumber(Math.abs(value))
  return value > 0 ? `+${num}` : `−${num}`
}

// Русское склонение после числа: 1 гол, 2 гола, 5 голов.
function plural(n: number, one: string, few: string, many: string): string {
  const mod100 = Math.abs(n) % 100
  const mod10 = mod100 % 10
  if (mod100 >= 11 && mod100 <= 14) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}

// Число вместе со склонённым словом — «3 гола», «15 очков».
function withPlural(n: number, one: string, few: string, many: string): string {
  return `${n} ${plural(n, one, few, many)}`
}

// Короткая строка статистики игрока — показываем только ненулевые показатели.
function formatPlayerStats(stats: PlayerMatchStats): string {
  const parts: string[] = []
  if (stats.goals > 0) parts.push(withPlural(stats.goals, 'гол', 'гола', 'голов'))
  if (stats.assists > 0) parts.push(withPlural(stats.assists, 'пас', 'паса', 'пасов'))
  if (stats.saves > 0) parts.push(withPlural(stats.saves, 'сейв', 'сейва', 'сейвов'))
  if (stats.yellows > 0) parts.push(withPlural(stats.yellows, 'ЖК', 'ЖК', 'ЖК'))
  return parts.join(', ')
}

// Имя игрока для текста: ник без рейтинга и без обрезки — в тексте место не ограничено.
function playerLabel(p: Player): string {
  const cleaned = p.username?.replace(/^@+/, '').trim()
  if (!cleaned || cleaned.toLowerCase() === 'unknown') return (p.name || '').trim() || `Игрок #${p.id}`
  return cleaned
}

// Карта id → полное имя: в наградах имена обрезаны под вёрстку, здесь берём целиком.
function buildNameById(players: Player[]): Record<number, string> {
  const out: Record<number, string> = {}
  for (const p of players) out[p.id] = playerLabel(p)
  return out
}

// Победитель награды одной строкой: имя, команда и значение показателя.
function awardLine(
  w: AwardWinner,
  units: [string, string, string],
  marker: (t: string) => string,
  nameById: Record<number, string>,
): string {
  const team = w.teamName ? ` (${marker(w.teamName)} ${teamDisplayNameByMarker(w.teamName, marker(w.teamName))})` : ''
  return `${nameById[w.playerId] ?? w.name}${team} — ${withPlural(w.value, ...units)}`
}

// Шапка: название, дата, место, формат, ссылка на страницу турнира.
function buildHeaderBlock(p: TournamentTextExportParams): string[] {
  const lines = [p.tournamentName.trim() || 'Турнир', '='.repeat(40)]
  const date = formatDateRu(p.tournamentDate)
  if (date) lines.push(`Дата: ${date}`)
  if (p.venueLabel?.trim()) lines.push(`Место: ${p.venueLabel.trim()}`)
  if (p.formatLabel?.trim()) lines.push(`Формат: ${p.formatLabel.trim()}`)
  if (p.pageUrl) lines.push(`Ссылка: ${p.pageUrl}`)
  return lines
}

// Общие цифры турнира плюс чемпион из первой строки таблицы.
function buildStatsBlock(p: TournamentTextExportParams): string[] {
  const s = p.summary.stats
  const champion = [...p.summary.standingsRows].sort((a, b) => a.place - b.place)[0]
  // Считаем только тех, кто реально попал в состав команды — в архиве хранится весь список игроков.
  const participants = p.players.filter(pl => Boolean(p.assignmentByPlayerId[pl.id])).length
  const lines = ['', 'ОБЩАЯ СТАТИСТИКА', '-'.repeat(40)]
  if (champion) {
    const championLabel = teamDisplayNameByMarker(champion.teamName, p.teamMarker(champion.teamName))
    lines.push(`Чемпион: ${p.teamMarker(champion.teamName)} ${championLabel} (${withPlural(champion.points, 'очко', 'очка', 'очков')})`)
  }
  lines.push(`Матчей сыграно: ${s.totalMatches}`)
  lines.push(`Голов: ${s.totalGoals} (в среднем ${formatNumber(s.avgGoalsPerMatch)} за матч)`)
  lines.push(`Голевых передач: ${s.totalAssists}`)
  lines.push(`Сейвов: ${s.totalSaves}`)
  lines.push(`Команд: ${p.summary.standingsRows.length}`)
  lines.push(`Игроков: ${participants}`)
  return lines
}

// Итоговая таблица построчно — вместо колонок пишем понятные подписи, чтобы не ломался перенос.
function buildStandingsBlock(p: TournamentTextExportParams): string[] {
  if (p.summary.standingsRows.length === 0) return []
  const lines = ['', 'ИТОГОВАЯ ТАБЛИЦА', '-'.repeat(40)]
  for (const r of [...p.summary.standingsRows].sort((a, b) => a.place - b.place)) {
    const diff = r.goalDiff > 0 ? `+${r.goalDiff}` : String(r.goalDiff)
    const rowLabel = teamDisplayNameByMarker(r.teamName, p.teamMarker(r.teamName))
    lines.push(`${r.place}. ${p.teamMarker(r.teamName)} ${rowLabel} — ${withPlural(r.points, 'очко', 'очка', 'очков')}`)
    lines.push(`   И ${r.played} · В ${r.wins} · Н ${r.draws} · П ${r.losses} · мячи ${r.goalsFor}-${r.goalsAgainst} (${diff})`)
  }
  return lines
}

// Личные награды: MVP турнира и лучшие по голам, передачам, сейвам.
function buildAwardsBlock(p: TournamentTextExportParams): string[] {
  const lines: string[] = []
  const marker = p.teamMarker
  const nameById = buildNameById(p.players)

  if (p.summary.mvp.length > 0) {
    lines.push('', 'MVP ТУРНИРА', '-'.repeat(40))
    for (const w of p.summary.mvp) {
      const team = w.teamName ? ` (${marker(w.teamName)} ${teamDisplayNameByMarker(w.teamName, marker(w.teamName))})` : ''
      const st = formatPlayerStats(w.tournamentStats ?? EMPTY_STATS)
      lines.push(`${nameById[w.playerId] ?? w.name}${team}${st ? ` — ${st}` : ''}`)
    }
  }

  const groups: { title: string; list: AwardWinner[]; units: [string, string, string] }[] = [
    { title: 'ЛУЧШИЙ БОМБАРДИР', list: p.summary.topScorers, units: ['гол', 'гола', 'голов'] },
    { title: 'ЛУЧШИЙ АССИСТЕНТ', list: p.summary.topAssisters, units: ['передача', 'передачи', 'передач'] },
    { title: 'ЛУЧШИЙ ВРАТАРЬ', list: p.summary.topGoalkeepers, units: ['сейв', 'сейва', 'сейвов'] },
  ]
  for (const g of groups) {
    if (g.list.length === 0) continue
    lines.push('', g.title, '-'.repeat(40))
    for (const w of g.list) lines.push(awardLine(w, g.units, marker, nameById))
  }

  if (p.summary.yellowCards.length > 0) {
    lines.push('', 'ЖЁЛТЫЕ КАРТОЧКИ', '-'.repeat(40))
    for (const y of p.summary.yellowCards) {
      const team = y.teamName ? ` (${marker(y.teamName)} ${teamDisplayNameByMarker(y.teamName, marker(y.teamName))})` : ''
      lines.push(`${nameById[y.playerId] ?? y.name}${team} — ${withPlural(y.count, 'карточка', 'карточки', 'карточек')}`)
    }
  }

  if (p.summary.teamMvps.length > 0) {
    lines.push('', 'MVP КОМАНД', '-'.repeat(40))
    for (const t of p.summary.teamMvps) {
      const best = t.players[0]
      const who = best ? (nameById[best.playerId] ?? best.name) : '—'
      const st = formatPlayerStats({ goals: t.goals, assists: t.assists, saves: t.saves, yellows: 0 })
      lines.push(`${marker(t.teamName)} ${t.teamName}: ${who}${st ? ` — ${st}` : ''}`)
    }
  }

  return lines
}

// Составы команд с личной статистикой и изменением рейтинга за турнир.
function buildRostersBlock(p: TournamentTextExportParams): string[] {
  const teams = p.summary.standingsRows.length > 0
    ? [...p.summary.standingsRows].sort((a, b) => a.place - b.place).map(r => r.teamName)
    : [...new Set(Object.values(p.assignmentByPlayerId))]
  if (teams.length === 0) return []

  const lines = ['', 'СОСТАВЫ', '-'.repeat(40)]
  for (const teamName of teams) {
    const roster = p.players.filter(pl => p.assignmentByPlayerId[pl.id] === teamName)
    lines.push(`${p.teamMarker(teamName)} ${teamName} (${roster.length}):`)
    if (roster.length === 0) {
      lines.push('   —')
      continue
    }
    for (const pl of roster) {
      const st = p.aggregatePlayerStats[pl.id] ?? EMPTY_STATS
      const delta = p.playerRatingDeltas[pl.id] ?? 0
      const bits = [formatPlayerStats(st), delta ? `рейтинг ${formatDelta(delta)}` : ''].filter(Boolean)
      lines.push(`   • ${playerLabel(pl)}${bits.length ? ` — ${bits.join(', ')}` : ''}`)
    }
  }
  return lines
}

// Все сыгранные матчи со счётом и списком отличившихся игроков.
function buildMatchesBlock(p: TournamentTextExportParams): string[] {
  if (p.playedMatchesList.length === 0) return []
  const nameById = buildNameById(p.players)
  const lines = ['', 'СЫГРАННЫЕ МАТЧИ', '-'.repeat(40)]

  // События одной команды в матче — в одну строку через «;», иначе список слишком длинный.
  const eventsLine = (teamName: string, marked: PlayedMatch['homePlayers']): string => {
    if (marked.length === 0) return ''
    const items = marked.map(mp => `${nameById[mp.playerId] ?? mp.name} ${mp.eventsLabel}`.trim())
    return `   ${p.teamMarker(teamName)} ${teamName}: ${items.join('; ')}`
  }

  for (const m of p.playedMatchesList) {
    const home = `${p.teamMarker(m.homeTeam)} ${teamDisplayNameByMarker(m.homeTeam, p.teamMarker(m.homeTeam))}`
    const away = `${p.teamMarker(m.awayTeam)} ${teamDisplayNameByMarker(m.awayTeam, p.teamMarker(m.awayTeam))}`
    lines.push(`Матч ${m.matchNumber}. ${home} ${m.homeGoals} : ${m.awayGoals} ${away}`)
    const homeLine = eventsLine(m.homeTeam, m.homePlayers)
    const awayLine = eventsLine(m.awayTeam, m.awayPlayers)
    if (homeLine) lines.push(homeLine)
    if (awayLine) lines.push(awayLine)
  }
  return lines
}

// Самый результативный матч турнира — отдельным блоком, как в интерфейсе.
function buildTopMatchBlock(p: TournamentTextExportParams): string[] {
  const m = p.summary.stats.topScoringMatch
  if (!m) return []
  const home = `${p.teamMarker(m.homeTeam)} ${teamDisplayNameByMarker(m.homeTeam, p.teamMarker(m.homeTeam))}`
  const away = `${p.teamMarker(m.awayTeam)} ${teamDisplayNameByMarker(m.awayTeam, p.teamMarker(m.awayTeam))}`
  return [
    '',
    'САМЫЙ РЕЗУЛЬТАТИВНЫЙ МАТЧ',
    '-'.repeat(40),
    `Матч ${m.matchNumber}: ${home} ${m.homeGoals} : ${m.awayGoals} ${away}`,
    `Всего голов: ${p.summary.stats.topScoringMatchGoals}`,
  ]
}

/** Полные итоги турнира одним текстом — без HTML, готово к копированию. */
export function buildTournamentSummaryText(params: TournamentTextExportParams): string {
  const blocks = [
    buildHeaderBlock(params),
    buildStatsBlock(params),
    buildStandingsBlock(params),
    buildAwardsBlock(params),
    buildRostersBlock(params),
    buildMatchesBlock(params),
    buildTopMatchBlock(params),
  ]
  return blocks.flat().join('\n').trim()
}
