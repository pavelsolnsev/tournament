export default defineNuxtPlugin(() => {
  const w = window as any

  // Инициализируем очередь команд до загрузки скрипта — чтобы ym() работал сразу.
  w.ym =
    w.ym ||
    function (...args: unknown[]) {
      ;(w.ym.a = w.ym.a || []).push(args)
    }
  w.ym.l = Date.now()

  // Загружаем тег Метрики асинхронно — не блокируем рендер.
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://mc.yandex.ru/metrika/tag.js?id=109049482'
  document.head.appendChild(s)

  // Инициализируем счётчик с нужными опциями.
  w.ym(109049482, 'init', {
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
