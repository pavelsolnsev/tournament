import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'

// API: POST /api/feedback — любой пользователь может оставить пожелание.
export default defineEventHandler(async (event) => {
  await ensureTablesExist()

  const body = await readBody<{ text?: string }>(event)
  const text = body?.text?.trim() ?? ''

  // Проверяем, что текст не пустой и не слишком длинный.
  if (!text) {
    throw createError({ statusCode: 400, statusMessage: 'Text is required' })
  }
  if (text.length > 500) {
    throw createError({ statusCode: 400, statusMessage: 'Text is too long (max 500 chars)' })
  }

  // Сохраняем пожелание в базу данных.
  const id = Date.now()
  await queryWithRetry(
    'INSERT INTO feedback (id, text) VALUES (?, ?)',
    [id, text],
  )

  return { ok: true, id }
})
