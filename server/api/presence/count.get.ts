import { countActiveVisitors } from '../../utils/presence'

// Считаем активных за последнюю минуту; админ видит цифру в шапке мастера.
const ACTIVE_MS = 60_000
const PRUNE_MS = 120_000

export default defineEventHandler(async (event) => {
  const session = getCookie(event, 'admin_session')
  if (session !== 'true') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })
  }
  const count = countActiveVisitors(ACTIVE_MS, PRUNE_MS)
  return { count }
})
