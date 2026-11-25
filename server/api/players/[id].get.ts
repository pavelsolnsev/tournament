import { queryWithRetry } from '../../utils/db'
import { playerEditorId, playerEditorValues } from '../../utils/playerEditor'

export default defineEventHandler(async event => {
  const id = playerEditorId(event)
  const rows = await queryWithRetry<Record<string, unknown>[]>('SELECT * FROM players WHERE id = ?', [id])
  return playerEditorValues(rows[0])
})
