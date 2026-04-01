export default defineNuxtConfig({
  srcDir: 'app',
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],
  app: {
    head: {
      // Добавляем базовые классы на body, чтобы фон сразу был "как на сайте".
      bodyAttrs: {
        class: 'bg-slate-900 text-slate-100',
      },
      // Подключаем фавиконки и PWA-иконки глобально для всех страниц сайта.
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },

        // Splash-экраны для iOS — каждый файл соответствует точному разрешению экрана устройства.
        // iOS выбирает нужный сам по media-запросу и показывает его ДО загрузки WebView.
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-se.png',         media: '(device-width:320px) and (device-height:568px) and (-webkit-device-pixel-ratio:2)' },
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-8.png',          media: '(device-width:375px) and (device-height:667px) and (-webkit-device-pixel-ratio:2)' },
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-8plus.png',      media: '(device-width:414px) and (device-height:736px) and (-webkit-device-pixel-ratio:3)' },
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-x.png',          media: '(device-width:375px) and (device-height:812px) and (-webkit-device-pixel-ratio:3)' },
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-xr.png',         media: '(device-width:414px) and (device-height:896px) and (-webkit-device-pixel-ratio:2)' },
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-xs-max.png',     media: '(device-width:414px) and (device-height:896px) and (-webkit-device-pixel-ratio:3)' },
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-12-mini.png',    media: '(device-width:375px) and (device-height:812px) and (-webkit-device-pixel-ratio:3) and (device-width:360px)' },
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-12.png',         media: '(device-width:390px) and (device-height:844px) and (-webkit-device-pixel-ratio:3)' },
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-12-pro-max.png', media: '(device-width:428px) and (device-height:926px) and (-webkit-device-pixel-ratio:3)' },
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-14-pro.png',     media: '(device-width:393px) and (device-height:852px) and (-webkit-device-pixel-ratio:3)' },
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-14-pro-max.png', media: '(device-width:430px) and (device-height:932px) and (-webkit-device-pixel-ratio:3)' },
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-15.png',         media: '(device-width:393px) and (device-height:852px) and (-webkit-device-pixel-ratio:3)' },
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-15-plus.png',    media: '(device-width:430px) and (device-height:932px) and (-webkit-device-pixel-ratio:3)' },
      ],
      // Добавляем мета для iOS, чтобы ярлык на домашнем экране использовал иконку и веб-режим.
      meta: [
        // Задаём общий цвет темы, чтобы не было белой подложки во время загрузки.
        { name: 'theme-color', content: '#0f172a' },
        { name: 'color-scheme', content: 'dark' },
        // viewport-fit=cover нужен для safe-area на iPhone с чёлкой.
        // user-scalable и maximum-scale убраны — они блокируют скролл колёсиком на десктопе
        // и ухудшают доступность (запрет зума).
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Footboal Admin' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      // Принудительно задаём тёмный фон сразу, ещё до загрузки Tailwind CSS (убирает "белую вспышку").
      style: [
        { innerHTML: 'html,body,#__nuxt{background:#0f172a;color:#f8fafc;} body{margin:0;}' },
      ],
    },
  },
  devtools: {
    // Отключаем Nuxt DevTools, чтобы убрать предупреждения про non-props attrs из оверлеев.
    enabled: false,
  },
  typescript: {
    strict: true,
    typeCheck: false,
  },
  routeRules: {
    // Главная страница — SSR, чтобы сервер мог читать cookie admin_session при каждом запросе.
    '/': { ssr: true },
  },
  nitro: {
    preset: 'node-server',
    prerender: {
      // В проекте сейчас только главная страница index.vue.
      // Не пререндерим отсутствующие маршруты, чтобы build не падал с 404.
      routes: [],
    },
  },
})

