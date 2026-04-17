// Composable для управления режимом администратора.
// Значение isAdmin устанавливается серверным плагином admin-auth.server.ts (enforce: 'pre').
// На клиенте значение приходит через гидрацию __NUXT_DATA__ — не переинициализируем.

export function useAdminAuth() {
  const sessionCookie = useCookie<string>('admin_session', {
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    path: '/',
  })

  function readAdminRoleFromCookieValue(v: string | undefined): 'full' | 'limited' | null {
    // Simple10: В cookie admin_session лежит роль: full или limited.
    if (v === 'full' || v === 'limited') return v
    return null
  }

  function hasAdminSessionCookie(): boolean {
    // Simple10: Админ — это либо full, либо limited.
    if (readAdminRoleFromCookieValue(sessionCookie.value) !== null) return true
    // Simple10: Иногда после обновления useCookie может отдать старое значение, поэтому на клиенте дополнительно читаем cookie напрямую из браузера.
    if (!import.meta.client) return false
    return document.cookie.split(';').some((cookie) => {
      const trimmed = cookie.trim()
      return trimmed.startsWith('admin_session=full') || trimmed.startsWith('admin_session=limited')
    })
  }

  // Фабрика используется как fallback если плагин ещё не успел создать useState.
  // На сервере: читает cookie из HTTP-контекста.
  // На клиенте: читает sessionCookie.value — Nuxt восстанавливает его из документа.
  const isAdmin = useState<boolean>('isAdmin', () => hasAdminSessionCookie())
  const adminRole = useState<'full' | 'limited' | null>(
    'adminRole',
    () => readAdminRoleFromCookieValue(sessionCookie.value),
  )

  async function login(password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await $fetch<{ ok: true; role: 'full' | 'limited' }>('/api/auth/login', {
        method: 'POST',
        body: { password },
      })
      // Simple10: Сервер вернул роль — сохраняем её в cookie и в state.
      sessionCookie.value = res.role
      isAdmin.value = true
      adminRole.value = res.role
      return { ok: true }
    } catch (err: unknown) {
      const status = (err as { statusCode?: number })?.statusCode
      if (status === 401) return { ok: false, error: 'Неверный пароль' }
      return { ok: false, error: 'Ошибка соединения' }
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    sessionCookie.value = ''
    isAdmin.value = false
    adminRole.value = null
    window.location.reload()
  }

  function restoreSession(): boolean {
    // Simple10: При восстановлении сессии читаем роль из cookie и синхронизируем state.
    const role = readAdminRoleFromCookieValue(sessionCookie.value)
    if (!role) return false
    adminRole.value = role
    isAdmin.value = true
    return true
  }

  return { isAdmin, adminRole, login, logout, restoreSession }
}
