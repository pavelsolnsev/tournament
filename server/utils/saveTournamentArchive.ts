import type { Connection } from 'mysql2/promise'
import type { SavedStandingsSnapshot } from '../../app/composables/useTournamentWizard'
import type { Player } from '../../app/types/tournament'

export type TournamentArchiveData = {
  // Название и дата турнира — берутся из SavedTournamentContext.
  tournamentName: string
  tournamentDate: string
  // Место проведения и формат — выбираются на шаге 0.
  venueLabel: string
  formatLabel: string
  // Полный снапшот таблицы и матчей — нужен для восстановления итогов.
  snapshot: SavedStandingsSnapshot
  // Список игроков с именами — нужен для отображения наград и составов.
  players: Player[]
  // Список команд с назначениями — нужен для составов.
  assignmentByPlayerId: Record<number, string>
  // Цвета команд — нужны для отображения карточек команд.
  teamColors: Record<string, number>
}

// Сохраняет итоги завершённого турнира в таблицу tournament_archives.
// Принимает открытое соединение, чтобы работать внутри общей транзакции finish.
export async function saveTournamentArchive(
  data: TournamentArchiveData,
  conn: Connection,
): Promise<string> {
  // Генерируем UUID на сервере — он станет частью публичной ссылки /tournaments/[id].
  const id = crypto.randomUUID()

  // Дата может прийти как строка "YYYY-MM-DD" или пустая — ставим сегодня как запасной вариант.
  const date = data.tournamentDate || new Date().toISOString().slice(0, 10)

  await conn.execute(
    `INSERT INTO tournament_archives
      (id, tournament_name, tournament_date, venue_label, format_label, snapshot, players, teams, team_colors)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.tournamentName || 'Турнир',
      date,
      data.venueLabel || '',
      data.formatLabel || '',
      JSON.stringify(data.snapshot),
      JSON.stringify(data.players),
      // teams хранит assignmentByPlayerId — нужен для восстановления составов по командам.
      JSON.stringify(data.assignmentByPlayerId),
      JSON.stringify(data.teamColors),
    ],
  )

  // Возвращаем id чтобы клиент мог сформировать ссылку /tournaments/[id].
  return id
}
