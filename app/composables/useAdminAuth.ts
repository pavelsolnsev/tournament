// Composable для управления режимом администратора.
// Начальное значение isAdmin устанавливается в plugins/admin-auth.server.ts до рендера.

export function useAdminAuth() {
  // useState с ключом 'isAdmin' — один shared ref на всё приложение.
  // Значение установлено серверным плагином из cookie до первого рендера.
  const isAdmin = useState<boolean>('isAdmin', () => false)

  // useCookie нужен только для записи при login/logout.
  const sessionCookie = useCookie<string>('admin_session', {
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    path: '/',
  })

  async function login(password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await $fetch('/api/auth/login', {
        method: 'POST',
        body: { password },
      })
      // Записываем cookie и обновляем shared state — страница переключится реактивно.
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

  return { isAdmin, login, logout }
}
