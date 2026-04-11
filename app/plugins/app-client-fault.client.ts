import { useAppClientFault } from '~/composables/useAppClientFault'

// Плагин только на клиенте: ловим падения Vue и необработанные промисы — иначе пользователь видит «пустой фон» без объяснения.
export default defineNuxtPlugin((nuxtApp) => {
  const { setClientFault } = useAppClientFault()

  // Ошибки рендера/сетапа Vue часто не доходят до window.onerror — перехватываем здесь.
  nuxtApp.vueApp.config.errorHandler = (err) => {
    const msg = err instanceof Error ? err.message : String(err)
    setClientFault(msg)
  }

  window.addEventListener('error', (event) => {
    const el = event.target
    // Ресурсные ошибки: только скрипты и стили ломают приложение; картинки и шрифты не закрываем весь экран.
    if (el && el !== window && el instanceof HTMLElement) {
      if (el.tagName === 'SCRIPT' || el.tagName === 'LINK') {
        setClientFault('Файл страницы не загрузился')
      }
      return
    }
    const msg = event.message?.trim() || 'Ошибка скрипта'
    setClientFault(msg)
  })

  window.addEventListener('unhandledrejection', (event) => {
    const r = event.reason
    const msg = r instanceof Error ? r.message : String(r)
    setClientFault(msg.trim() || 'Ошибка')
  })
})
