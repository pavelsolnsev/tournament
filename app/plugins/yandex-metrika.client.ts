// Счётчик Метрики: сама функция вызова плюс служебные поля, которые дописывает тег —
// `a` это очередь вызовов до загрузки скрипта, `l` отметка времени старта.
type YandexMetrikaFn = {
  (...args: unknown[]): void
  a?: unknown[][]
  l?: number
}

type WindowWithYm = Window & { ym?: YandexMetrikaFn }

export default defineNuxtPlugin(() => {
  const w = window as WindowWithYm

  // Инициализируем очередь команд до загрузки скрипта — чтобы ym() работал сразу.
  const ym: YandexMetrikaFn
    = w.ym
      ?? function (...args: unknown[]) {
        ;(ym.a = ym.a ?? []).push(args)
      }
  ym.l = Date.now()
  w.ym = ym

  // Загружаем тег Метрики асинхронно — не блокируем рендер.
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://mc.yandex.ru/metrika/tag.js?id=109049482'
  document.head.appendChild(s)

  // Инициализируем счётчик с нужными опциями.
  ym(109049482, 'init', {
    webvisor: true,
    clickmap: true,
    ecommerce: 'dataLayer',
    referrer: document.referrer,
    url: location.href,
    accurateTrackBounce: true,
    trackLinks: true,
  })

  // noscript-пиксель для браузеров без JS.
  useHead({
    noscript: [
      {
        innerHTML:
          '<div><img src="https://mc.yandex.ru/watch/109049482" style="position:absolute;left:-9999px;" alt=""/></div>',
      },
    ],
  })
})
