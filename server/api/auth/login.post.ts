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

  // Simple10: В системе 2 роли: full (полный админ) и limited (ограниченный админ).
  // Simple10: limited нужен, чтобы можно было зайти в админку, но без опасных действий (завершение турнира, CRUD игроков/команд).
  const LIMITED_PASSWORD = '30275'

  // Simple10: Читаем оба пароля из базы (с retry при обрыве соединения).
  // Simple10: admin_password — мастер-пароль (full), admin_password_limited — пароль ограниченного админа (limited).
  const settings = await queryWithRetry<Array<{ key_name: string; value: string }>>(
    'SELECT key_name, value FROM app_settings WHERE key_name IN (?, ?)',
    ['admin_password', 'admin_password_limited'],
  )

  const savedFullPassword = settings.find((r) => r.key_name === 'admin_password')?.value ?? ''
  const savedLimitedPassword = settings.find((r) => r.key_name === 'admin_password_limited')?.value ?? ''

  // Simple10: Если пароль ограниченного админа ещё не записан — записываем дефолт 30275.
  // Simple10: Это безопасно, потому что ограниченная роль не может делать опасные действия.
  if (!savedLimitedPassword) {
    await queryWithRetry(
      'INSERT INTO app_settings (key_name, value) VALUES (?, ?)',
      ['admin_password_limited', LIMITED_PASSWORD],
    )
  }

  // Simple10: Если мастер-пароль ещё не задан — первый вход, сохраняем введённый пароль как мастер-пароль (full).
  if (!savedFullPassword) {
    await queryWithRetry(
      'INSERT INTO app_settings (key_name, value) VALUES (?, ?)',
      ['admin_password', password],
    )
  }

  // Simple10: Определяем роль по введённому паролю.
  const isFull = password === (savedFullPassword || password) // если мастер-пароль только что создан — full для этого входа
  const isLimited = password === (savedLimitedPassword || LIMITED_PASSWORD)

  if (!isFull && !isLimited) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid password' })
  }

  const role = isFull ? 'full' : 'limited'

  // Simple10: Устанавливаем cookie сессии администратора (30 дней) — теперь там хранится роль.
  setCookie(event, 'admin_session', role, {
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    path: '/',
  })

  return { ok: true, role }
})
