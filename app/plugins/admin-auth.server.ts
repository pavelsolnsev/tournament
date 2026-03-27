// Серверный плагин — выполняется на сервере до рендера любой страницы.
// Читает cookie admin_session из HTTP-запроса и кладёт результат в useState.
// Это гарантирует что isAdmin на SSR и клиенте будет одинаковым.
export default defineNuxtPlugin(() => {
  const sessionCookie = useCookie<string>('admin_session')

  // Инициализируем isAdmin из cookie прямо здесь — до того как страница начнёт рендериться.
  const isAdmin = useState<boolean>('isAdmin')
  isAdmin.value = sessionCookie.value === 'true'
})
