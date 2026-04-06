import { queryWithRetry } from './db'
import { nextSyntheticVkUserIdCandidate } from './syntheticVkUserId'

export type CreatedPlayerRow = {
  id: number
  name: string
  username: string | null
  vk_user_id: number
}

function isDuplicateVkError(err: unknown): boolean {
  const e = err as { code?: string; errno?: number; sqlMessage?: string }
  if (e?.code !== 'ER_DUP_ENTRY' && e?.errno !== 1062) return false
  const msg = String(e?.sqlMessage ?? '').toLowerCase()
  if (msg.includes('primary')) return false
  return msg.includes('vk_user')
}

// Создаёт строку в players с автоматическим отрицательным vk_user_id (игрок без аккаунта ВК).
export async function createPlayerInDb(params: { name: string; username: string | null }): Promise<CreatedPlayerRow> {
  const id = Date.now()
  let vkUserId = await nextSyntheticVkUserIdCandidate()

  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      await queryWithRetry(
        `INSERT INTO players (id, name, username, vk_user_id, goals, assists, saves, gamesPlayed, wins, draws, losses, rating, mvp, yellow_cards)
         VALUES (?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`,
        [id, params.name, params.username, vkUserId],
      )
      return { id, name: params.name, username: params.username, vk_user_id: vkUserId }
    } catch (err) {
      if (isDuplicateVkError(err)) {
        vkUserId -= 1
        continue
      }
      throw err
    }
  }

  throw createError({ statusCode: 500, statusMessage: 'Failed to allocate synthetic vk_user_id' })
}
