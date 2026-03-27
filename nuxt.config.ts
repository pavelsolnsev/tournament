export default defineNuxtConfig({
  srcDir: 'app',
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],
  app: {
    head: {
      // Подключаем фавиконки и PWA-иконки глобально для всех страниц сайта.
      link: [
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
      // Добавляем мета для iOS, чтобы ярлык на домашнем экране использовал иконку и веб-режим.
      meta: [
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Footboal Admin' },
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

