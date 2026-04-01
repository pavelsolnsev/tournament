// Серверный плагин — синхронизирует isAdmin из cookie на КАЖДОМ SSR-запросе.
// Это критично: иначе useState может сохранить старое значение между запросами в dev.
export default defineNuxtPlugin({
  name: 'admin-auth',
  enforce: 'pre',
  setup() {
    const sessionCookie = useCookie<string>('admin_session')
    const isAdmin = useState<boolean>('isAdmin', () => false)
    isAdmin.value = sessionCookie.value === 'true'
  },
})
