// Показываем один общий «сбой приложения» если на клиенте поймали критическую ошибку.
// useState — одно и то же значение в плагине и в app.vue, без дублирования ref.
export function useAppClientFault() {
  const faultMessage = useState<string | null>('app-client-fault', () => null)

  // Записываем только первую ошибку — чтобы не мигать текстом при цепочке сбоев.
  function setClientFault(message: string) {
    if (faultMessage.value) return
    const trimmed = message.trim().slice(0, 500)
    faultMessage.value = trimmed || 'Неизвестная ошибка'
  }

  function clearClientFault() {
    faultMessage.value = null
  }

  return { faultMessage, setClientFault, clearClientFault }
}
