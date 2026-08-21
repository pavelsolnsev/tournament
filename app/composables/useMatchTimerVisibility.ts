import { onMounted } from 'vue'

// Ключ в localStorage: '1' — таймер скрыт, '0' — открыт.
const STORAGE_KEY = 'match-timer-collapsed'

/**
 * Показ панели таймера матча.
 *
 * Изначально таймер скрыт — на экране ведения турнира и так плотно.
 * Как только ведущий открыл или свернул его, выбор запоминается в localStorage,
 * поэтому переживает перезагрузку страницы, новую вкладку и переход в другой раздел.
 */
export function useMatchTimerVisibility() {
  // Общее состояние для всех трёх мест: сама панель, кнопка «Открыть таймер» и отступ снизу.
  const isCollapsed = useState<boolean>('match-timer-bar-collapsed', () => true)
  // Восстанавливаем сохранённый выбор один раз за загрузку, а не в каждом компоненте.
  const restored = useState<boolean>('match-timer-bar-restored', () => false)

  // Читаем хранилище только после монтирования: на сервере его нет,
  // а чтение прямо в setup рассинхронизировало бы разметку при гидрации.
  onMounted(() => {
    if (restored.value) return
    restored.value = true
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === '0') isCollapsed.value = false
      else if (saved === '1') isCollapsed.value = true
    } catch {
      // Приватный режим или запрет хранилища — просто остаёмся на «скрыт».
    }
  })

  // Сохраняем выбор ведущего. Если хранилище недоступно, таймер работает как раньше — без запоминания.
  function persist(collapsed: boolean) {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
    } catch {
      // Ничего не делаем: не сохранить выбор не страшно.
    }
  }

  function showTimer() {
    isCollapsed.value = false
    persist(false)
  }

  function hideTimer() {
    isCollapsed.value = true
    persist(true)
  }

  return { isCollapsed, showTimer, hideTimer }
}
