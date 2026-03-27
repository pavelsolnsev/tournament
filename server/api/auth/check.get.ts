// API: GET /api/auth/check — проверяет, активна ли сессия администратора.
export default defineEventHandler(async (event) => {
  const session = getCookie(event, 'admin_session')

  // Если cookie сессии есть — пользователь администратор.
  return { isAdmin: session === 'true' }
})
