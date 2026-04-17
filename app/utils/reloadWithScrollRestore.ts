// Simple10: Полная перезагрузка как F5, с сохранением позиции #scroll-root — восстановление в app.vue.
export function reloadWithScrollRestore(): void {
  if (!import.meta.client) return
  try {
    const root = document.getElementById('scroll-root')
    const top = root ? root.scrollTop : 0
    sessionStorage.setItem(
      'football-scroll-restore-v1',
      JSON.stringify({ path: window.location.pathname + window.location.search, top }),
    )
  } catch {
    /* игнорируем */
  }
  window.location.reload()
}
