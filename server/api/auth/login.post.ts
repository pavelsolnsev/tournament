import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'

// API: POST /api/auth/login — проверяет пароль и выдаёт cookie сессии администратора.
export default defineEventHandler(async (event) => {
  await ensureTablesExist()

  const body = await readBody(event)
  const password: string = body?.password ?? ''

  if (!password) {
    throw createError({ statusCode: 400, statusMessage: 'Password required' })
  }

  // Читаем сохранённый пароль из базы (с retry при обрыве соединения).
  const rows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_settings WHERE key_name = ?',
    ['admin_password'],
  )

  // Если пароль ещё не задан — первый вход, сохраняем этот пароль как мастер-пароль.
  if (rows.length === 0) {
    await queryWithRetry(
      'INSERT INTO app_settings (key_name, value) VALUES (?, ?)',
      ['admin_password', password],
    )
  } else {
    // Сравниваем введённый пароль с сохранённым.
    const savedPassword = rows[0]?.value ?? ''
    if (password !== savedPassword) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
    }
  }

  // Устанавливаем cookie сессии администратора (30 дней).
  setCookie(event, 'admin_session', 'true', {
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    path: '/',
  })

  return { ok: true }
})
