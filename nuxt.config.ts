export default defineNuxtConfig({
  srcDir: 'app',
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],
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

