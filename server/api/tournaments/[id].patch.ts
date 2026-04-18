import { queryWithRetry } from '../../utils/db'

// Обновление даты турнира в архиве — только для администратора (cookie).
export default defineEventHandler(async (event) => {
  const session = getCookie(event, 'admin_session')
  // Simple10: Менять архив может любой залогиненный админ (full или limited), как сохранение состояния турнира.
  if (session !== 'full' && session !== 'limited') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Tournament id is required' })
  }

  const body = await readBody<{ tournament_date?: string }>(event)
  const raw = (body?.tournament_date ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw createError({ statusCode: 400, statusMessage: 'tournament_date must be YYYY-MM-DD' })
  }

  const y = Number(raw.slice(0, 4))
  const mo = Number(raw.slice(5, 7))
  const da = Number(raw.slice(8, 10))
  const cal = new Date(y, mo - 1, da)
  if (cal.getFullYear() !== y || cal.getMonth() !== mo - 1 || cal.getDate() !== da) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid calendar date' })
  }

  try {
    const result = await queryWithRetry<unknown>('UPDATE tournament_archives SET tournament_date = ? WHERE id = ?', [
      raw,
      id,
    ])
    const affected = (result as { affectedRows?: number })?.affectedRows ?? 0
    if (affected === 0) {
      throw createError({ statusCode: 404, statusMessage: 'Tournament not found' })
    }
    return { ok: true, tournament_date: raw }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    console.error('[tournaments/[id].patch] error:', err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update tournament date' })
  }
})
