// Composable для синхронизации состояния турнира с базой данных через API.
// Заменяет cookie-персистентность — теперь состояние доступно с любого устройства.
import { useQuery } from '@tanstack/vue-query'
import type { SavedTournamentContext } from '~/composables/useTournamentWizard'

// Debounce-задержка: не сохраняем после каждой клавиши — ждём паузы в 800мс.
const SAVE_DEBOUNCE_MS = 800

export function useTournamentState() {
  // saveTimer живёт внутри composable — очищается при unmount компонента.
  // Раньше был на уровне модуля и утекал между перезагрузками/переходами.
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  // Загружаем состояние турнира с сервера.
  const query = useQuery({
    queryKey: ['tournament-state'],
    queryFn: () => $fetch<{ state: SavedTournamentContext | null }>('/api/tournament/state'),
    // Повторно проверяем состояние каждые 5 секунд — зритель видит изменения быстро.
    refetchInterval: 5_000,
    // При возврате на вкладку сразу обновляем — важно если пользователь долго не смотрел.
    refetchOnWindowFocus: true,
  })

  // Очищаем pending-таймер при уничтожении компонента, чтобы не было "ghostwrite" запросов.
  onUnmounted(() => {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
  })

  // Сохраняет состояние турнира на сервер.
  // Вызывается с debounce, чтобы не перегружать API.
  function saveTournamentState(state: SavedTournamentContext) {
    if (saveTimer) clearTimeout(saveTimer)

    saveTimer = setTimeout(async () => {
      try {
        await $fetch('/api/tournament/state', {
          method: 'PUT',
          body: { state },
        })
      } catch (err) {
        console.error('Failed to save tournament state:', err)
      }
    }, SAVE_DEBOUNCE_MS)
  }

  // Немедленно сохраняет состояние (без debounce) — для критических моментов.
  async function saveTournamentStateNow(state: SavedTournamentContext) {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    try {
      await $fetch('/api/tournament/state', {
        method: 'PUT',
        body: { state },
      })
    } catch (err) {
      console.error('Failed to save tournament state (immediate):', err)
    }
  }

  return {
    // Текущее состояние, загруженное с сервера.
    serverState: computed(() => query.data.value?.state ?? null),
    // Идёт ли загрузка состояния.
    isLoading: query.isLoading,
    query,
    saveTournamentState,
    saveTournamentStateNow,
  }
}
