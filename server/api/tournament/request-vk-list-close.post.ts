import { ensureTablesExist } from '../../utils/initDb'
import { setVkListCloseRequested } from '../../utils/vkListCloseRequest'

// После «Завершить матч» в мастере — просим бота закрыть список в чате (как e!), если он есть.

export default defineEventHandler(async (event) => {
  await ensureTablesExist()

  const session = getCookie(event, 'admin_session')
  if (session !== 'true') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: admin only' })
  }

  await setVkListCloseRequested()
  return { ok: true }
})
