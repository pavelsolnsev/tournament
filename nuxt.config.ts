export default defineNuxtConfig({
  srcDir: 'app',
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],
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

