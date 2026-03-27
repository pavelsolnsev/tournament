// API: POST /api/auth/logout — удаляет cookie сессии администратора.
export default defineEventHandler(async (event) => {
  // Удаляем cookie сессии, устанавливая maxAge = 0.
  setCookie(event, 'admin_session', '', {
    maxAge: 0,
    sameSite: 'lax',
    path: '/',
  })

  return { ok: true }
})
