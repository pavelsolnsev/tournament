// Composable для синхронизации состояния турнира с базой данных через API.
// useFetch с фиксированным key — Nuxt один раз тянет state на SSR и передаёт payload на клиент без второго GET при обновлении страницы.
import type { SavedTournamentContext } from '~/composables/useTournamentWizard'

// Debounce-задержка: не сохраняем после каждой клавиши — ждём паузы в 800мс.
const SAVE_DEBOUNCE_MS = 800

// Поллинг запускается только после того как турнир запущен (state не null и не finished).
// До нажатия кнопки «Переход к турниру» поллинга нет — зритель сам обновил страницу и увидел данные.
const STATE_REFETCH_ACTIVE_MS = 15_000

/** Ключ Nuxt useFetch / refreshNuxtData — один и тот же, чтобы принудительное обновление попадало в тот же кэш. */
export const TOURNAMENT_STATE_NUXT_KEY = 'tournament-state'

// Что нужно мастеру турнира: один раз создаём useTournamentState() и передаём сюда — без второго подключения к тому же API.
export type TournamentStateSyncApi = {
  serverState: ComputedRef<SavedTournamentContext | null>
  isLoading: Ref<boolean>
  saveTournamentState: (state: SavedTournamentContext) => void
  saveTournamentStateNow: (state: SavedTournamentContext) => Promise<void>
}

export function useTournamentState() {
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  const { data, pending, refresh } = useFetch<{ state: SavedTournamentContext | null }>('/api/tournament/state', {
    key: TOURNAMENT_STATE_NUXT_KEY,
    default: () => ({ state: null }),
  })

  const serverState = computed(() => data.value?.state ?? null)

  let pollTimer: ReturnType<typeof setInterval> | null = null

  function stopPoll() {
    // Останавливаем таймер, чтобы не делать лишних запросов.
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  function startPoll(interval: number) {
    // Чистим старый таймер — не запускаем двойной поллинг.
    stopPoll()
    pollTimer = setInterval(() => {
      void refresh()
    }, interval)
  }

  function syncPoll() {
    // Поллинг только когда идёт live-матч — зритель видит изменения счёта и статистики в реальном времени.
    // upcoming / finished / null — поллинга нет, данные не меняются часто или страница только что открыта.
    if (serverState.value?.matchStatus === 'live') {
      startPoll(STATE_REFETCH_ACTIVE_MS)
    } else {
      stopPoll()
    }
  }

  if (import.meta.client) {
    onMounted(() => {
      // immediate: true — запускаем поллинг сразу при монтировании с нужным интервалом.
      watch(
        () => serverState.value?.matchStatus ?? null,
        () => syncPoll(),
        { immediate: true },
      )

      // При возврате на вкладку — немедленный refresh + пересинхронизация таймера.
      const onFocus = () => {
        void refresh()
        syncPoll()
      }
      window.addEventListener('focus', onFocus)
      onUnmounted(() => window.removeEventListener('focus', onFocus))
    })
  }

  onUnmounted(() => {
    stopPoll()
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
  })

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
    serverState,
    isLoading: pending,
    saveTournamentState,
    saveTournamentStateNow,
    refresh,
  }
}
