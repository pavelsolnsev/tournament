// Раз в 20 с говорим серверу «вкладка открыта» — так считается онлайн (вместе с первым вызовом сразу при входе).
const PING_MS = 20_000

export default defineNuxtPlugin(() => {
  const ping = () => {
    $fetch('/api/presence/ping', { method: 'POST' }).catch(() => {})
  }
  ping()
  const timer = setInterval(ping, PING_MS)
  // В dev при HMR снимаем интервал, чтобы не копились таймеры.
  import.meta.hot?.dispose(() => clearInterval(timer))
})
