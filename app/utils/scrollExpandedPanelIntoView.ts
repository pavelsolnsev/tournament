// Прокрутка к только что раскрытому блоку (после Vue Transition @after-enter).
export function scrollExpandedPanelIntoView(el: Element) {
  if (import.meta.server) return
  const node = el as HTMLElement
  // Ждём кадр отрисовки после max-height анимации — иначе границы элемента ещё старые.
  requestAnimationFrame(() => {
    // nearest — как можно меньше крутим, но блок оказывается в зоне видимости скролла.
    node.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  })
}
