import { queryWithRetry } from './db'

export async function writeTournamentStateCas(previous: string | null, state: Record<string, unknown>) {
  const next = JSON.stringify(state)
  if (next === previous) return true
  const result = previous == null
    ? await queryWithRetry<{ affectedRows: number }>('INSERT IGNORE INTO app_state (key_name, value) VALUES (?, ?)', ['tournament', next])
    : await queryWithRetry<{ affectedRows: number }>('UPDATE app_state SET value = ? WHERE key_name = ? AND BINARY value = BINARY ?', [next, 'tournament', previous])
  return result.affectedRows === 1
}
