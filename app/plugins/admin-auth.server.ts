// Серверный плагин — синхронизирует isAdmin из cookie на КАЖДОМ SSR-запросе.
// Это критично: иначе useState может сохранить старое значение между запросами в dev.
export default defineNuxtPlugin({
  name: 'admin-auth',
  enforce: 'pre',
  setup() {
    const sessionCookie = useCookie<string>('admin_session')
    // Simple10: В cookie admin_session теперь лежит роль: full или limited.
    const adminRole = useState<'full' | 'limited' | null>('adminRole', () => null)
    const isAdmin = useState<boolean>('isAdmin', () => false)

    adminRole.value = sessionCookie.value === 'full' || sessionCookie.value === 'limited'
      ? (sessionCookie.value as 'full' | 'limited')
      : null
    isAdmin.value = adminRole.value !== null
  },
})
