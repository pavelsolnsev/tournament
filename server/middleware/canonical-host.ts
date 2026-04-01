// Nitro server middleware: keep a single canonical host in dev.
// Reason: cookies are host-bound. Switching between 127.0.0.1 and localhost
// makes `admin_session` appear "lost" after refresh, so SSR falls back to viewer mode.
export default defineEventHandler((event) => {
  if (process.env.NODE_ENV === 'production') return

  const host = event.node.req.headers.host ?? ''

  // Redirect 127.0.0.1 → localhost (keep port).
  if (host.startsWith('127.0.0.1')) {
    const [, port] = host.split(':')
    const targetHost = port ? `localhost:${port}` : 'localhost'
    const url = getRequestURL(event)
    const location = `${url.protocol}//${targetHost}${url.pathname}${url.search}`

    setResponseStatus(event, 307)
    setHeader(event, 'location', location)
    return 'Redirecting...'
  }
})

