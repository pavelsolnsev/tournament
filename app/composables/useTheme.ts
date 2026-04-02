// Управляет темой приложения: тёмная / светлая.
// Сохраняет выбор в localStorage и учитывает системные настройки при первом визите.

const STORAGE_KEY = 'theme'

// isDark живёт вне функции — один экземпляр на всё приложение (singleton).
// Начальное значение true — скрипт в nuxt.config ставит dark по умолчанию.
const isDark = ref(true)

export function useTheme() {
  // Инициализация темы — синхронизируем Vue-состояние с тем, что уже стоит на <html>.
  // Скрипт в nuxt.config уже поставил нужный класс — здесь просто читаем его.
  function initTheme() {
    // Читаем текущий класс <html> — скрипт анти-FOUC уже применил правильную тему.
    isDark.value = document.documentElement.classList.contains('dark')
  }

  // Применяет тему на элемент <html> через CSS-класс 'dark'.
  function applyTheme(dark: boolean) {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Переключает тему между тёмной и светлой.
  function toggleTheme() {
    isDark.value = !isDark.value
    applyTheme(isDark.value)
    // Сохраняем выбор пользователя навсегда, пока он не переключит снова.
    localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
  }

  return { isDark, initTheme, toggleTheme }
}
