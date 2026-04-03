export default defineNuxtConfig({
  srcDir: 'app',
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],
  app: {
    head: {
      // Язык документа для поисковиков и скринридеров (контент интерфейса на русском).
      htmlAttrs: { lang: 'ru' },
      // Короткий заголовок по умолчанию; главная страница задаёт полный через useSeoMeta.
      title: 'РФОИ',
      // Базовый класс на body убран — тема управляется через класс на <html>.
      bodyAttrs: {},
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
        // Задаём поддержку обеих цветовых схем — браузер выберет нужный theme-color.
        { name: 'theme-color', content: '#0f172a', media: '(prefers-color-scheme: dark)' },
        { name: 'theme-color', content: '#f8fafc', media: '(prefers-color-scheme: light)' },
        { name: 'color-scheme', content: 'dark light' },
        // viewport-fit=cover — safe-area. minimum/maximum-scale + user-scalable=no — зум жестами и двойным тапом (в т.ч. Safari iOS).
        { name: 'viewport', content: 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Football Admin' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      // Принудительно задаём фон сразу, ещё до загрузки Tailwind CSS (убирает "вспышку").
      // CSS переменные задают цвета для обеих тем — браузер применяет правильный сразу.
      style: [
        // position:fixed на body — единственный способ заблокировать rubber-band на iOS и Chrome.
        // Скролл живёт только в #scroll-root внутри app.vue.
        // По умолчанию светлый фон — скрипт выше добавит 'dark' если нужно.
        { innerHTML: `*{box-sizing:border-box;touch-action:manipulation}#scroll-root{touch-action:pan-y}html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;-webkit-text-size-adjust:100%;text-size-adjust:100%;}body{position:fixed;touch-action:none}html{background:#f8fafc;color:#0f172a;touch-action:manipulation}html.dark{background:#0f172a;color:#f8fafc;}` },
      ],
      // Скрипт запускается ДО рендера: читает localStorage или системные настройки
      // и сразу ставит класс 'dark' на <html>, чтобы не было мигания при загрузке.
      // По умолчанию (если нет сохранения) — тёмная тема, как было раньше.
      script: [
        {
          innerHTML: `(function(){try{var s=localStorage.getItem('theme');var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s===null&&prefersDark)||s===null){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`,
          type: 'text/javascript',
        },
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

