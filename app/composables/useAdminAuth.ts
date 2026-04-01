// Composable для управления режимом администратора.
// Значение isAdmin устанавливается серверным плагином admin-auth.server.ts (enforce: 'pre').
// На клиенте значение приходит через гидрацию __NUXT_DATA__ — не переинициализируем.

export function useAdminAuth() {
  const sessionCookie = useCookie<string>('admin_session', {
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    path: '/',
  })

  // Фабрика используется как fallback если плагин ещё не успел создать useState.
  // На сервере: читает cookie из HTTP-контекста.
  // На клиенте: читает sessionCookie.value — Nuxt восстанавливает его из документа.
  const isAdmin = useState<boolean>('isAdmin', () => sessionCookie.value === 'true')

  async function login(password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await $fetch('/api/auth/login', {
        method: 'POST',
        body: { password },
      })
      sessionCookie.value = 'true'
      isAdmin.value = true
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
    window.location.reload()
  }

  function restoreSession(): boolean {
    if (sessionCookie.value === 'true') {
      isAdmin.value = true
      return true
    }
    return false
  }

  return { isAdmin, login, logout, restoreSession }
}
