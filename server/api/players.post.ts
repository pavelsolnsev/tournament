import { getPool } from '../utils/db'

const EMOJI_REGEX =
  /[\u{1F000}-\u{1FFFF}\u{1D400}-\u{1D7FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FEFF}\u{FF00}-\u{FFEF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}]/gu

function removeEmoji(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return ''
  return text.replace(EMOJI_REGEX, '').trim() || ''
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string; username?: string }>(event)
  const rawName = body?.name
  const rawUsername = body?.username

  const name = removeEmoji(rawName) || removeEmoji(rawUsername)
  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name is required',
    })
  }

  const username = rawUsername ? `@${removeEmoji(rawUsername).replace(/^@/, '')}` : null
  const id = Date.now()

  try {
    const pool = getPool()
    await pool.query(
      `INSERT INTO players (id, name, username, goals, assists, saves, gamesPlayed, wins, draws, losses, rating, mvp, yellow_cards)
       VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`,
      [id, name, username ?? null]
    )
    return { id, name, username }
  } catch (err) {
    console.error('players.post error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create player',
    })
  }
})
