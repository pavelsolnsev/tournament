import { randomUUID } from 'node:crypto'
import { touchPresence } from '../../utils/presence'

// POST /api/presence/ping — любой гость шлёт «я на сайте», сервер ставит/обновляет cookie и метку времени.
export default defineEventHandler(async (event) => {
  let id = getCookie(event, 'presence_id')
  if (!id || id.length < 8) {
    id = randomUUID()
    setCookie(event, 'presence_id', id, {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      path: '/',
      httpOnly: true,
    })
  }
  touchPresence(id)
  return { ok: true }
})
