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
    '/tournament': { prerender: true },
    '/tournament/players': { prerender: true },
    '/tournament/teams': { prerender: true },
  },
  nitro: {
    preset: 'node-server',
    prerender: {
      // '/' убран из prerender — она должна рендериться динамически с учётом cookie.
      routes: ['/tournament', '/tournament/players', '/tournament/teams'],
    },
  },
})

