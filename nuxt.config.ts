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
    '/tournament': { prerender: true },
    '/tournament/players': { prerender: true },
    '/tournament/teams': { prerender: true },
  },
  nitro: {
    preset: 'node-server',
    prerender: {
      routes: ['/', '/tournament', '/tournament/players', '/tournament/teams'],
    },
  },
})

