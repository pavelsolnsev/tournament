// API: GET /api/auth/check — проверяет, активна ли сессия администратора.
export default defineEventHandler(async (event) => {
  const session = getCookie(event, 'admin_session')

  // Simple10: В cookie admin_session теперь лежит роль: full или limited.
  const role = session === 'full' || session === 'limited' ? session : null
  const isAdmin = role !== null

  // Simple10: Возвращаем и флаг админа, и роль — это удобно для UI.
  return { isAdmin, role }
})
