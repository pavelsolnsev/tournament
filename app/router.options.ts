import type { RouterConfig } from '@nuxt/schema'

// Скроллим якорь внутри #scroll-root (body фиксирован в nuxt.config), не полагаясь на window.
function scrollHashIntoScrollRoot(hash: string): boolean {
  const id = decodeURIComponent(hash.startsWith('#') ? hash.slice(1) : hash)
  const el = document.getElementById(id) ?? document.querySelector(hash)
  if (!el) return false

  const root = document.getElementById('scroll-root')
  if (!(root instanceof HTMLElement)) return false

  const rootRect = root.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  const paddingPx = 12
  const top = root.scrollTop + (elRect.top - rootRect.top) - paddingPx
  root.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  return true
}

// Роутер по умолчанию ищет якорь в document и возвращает предупреждение, если блок ещё не смонтирован.
// Ждём несколько тиков — итоги турнира приходят с API и появляются позже первого кадра.
export default {
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition

    if (to.hash) {
      return new Promise((resolve) => {
        let attempts = 0
        const maxAttempts = 40

        const tryScroll = () => {
          if (scrollHashIntoScrollRoot(to.hash)) {
            resolve(false)
            return
          }
          attempts += 1
          if (attempts >= maxAttempts) {
            resolve(false)
            return
          }
          setTimeout(tryScroll, 50)
        }

        void nextTick(() => {
          tryScroll()
        })
      })
    }

    if (to.path !== from.path) return { top: 0 }
    return false
  },
} satisfies RouterConfig
