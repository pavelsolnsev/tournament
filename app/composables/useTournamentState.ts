// Composable для синхронизации состояния турнира с базой данных через API.
// useFetch с фиксированным key — Nuxt один раз тянет state на SSR и передаёт payload на клиент без второго GET при обновлении страницы.
import type { SavedTournamentContext } from '~/composables/useTournamentWizard'

// Debounce-задержка: не сохраняем после каждой клавиши — ждём паузы в 800мс.
const SAVE_DEBOUNCE_MS = 800

// Интервал поллинга в live-режиме — каждые 15 секунд.
const STATE_REFETCH_LIVE_MS = 15_000

// Интервал поллинга когда матч ещё не начат или уже завершён.
// Реже, чтобы не нагружать сервер, но зритель всё равно получит переход в live.
const STATE_REFETCH_IDLE_MS = 10_000

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

  // Постоянный поллинг на клиенте — зритель всегда получает актуальный state.
  // В live — каждые 15 с, в остальных статусах — каждые 10 с (реже, но переход upcoming→live не пропустим).
  let pollTimer: ReturnType<typeof setInterval> | null = null

  function startPoll() {
    if (pollTimer) clearInterval(pollTimer)
    const interval = serverState.value?.matchStatus === 'live'
      ? STATE_REFETCH_LIVE_MS
      : STATE_REFETCH_IDLE_MS
    pollTimer = setInterval(() => {
      void refresh()
    }, interval)
  }

  if (import.meta.client) {
    onMounted(() => {
      // Запускаем поллинг сразу при монтировании — не ждём live.
      startPoll()

      // Когда статус меняется (например upcoming → live) — перезапускаем таймер с нужным интервалом.
      watch(() => serverState.value?.matchStatus, () => {
        startPoll()
      })

      // При возврате на вкладку — немедленный refresh + перезапуск таймера.
      const onFocus = () => {
        void refresh()
        startPoll()
      }
      window.addEventListener('focus', onFocus)
      onUnmounted(() => window.removeEventListener('focus', onFocus))
    })
  }

  onUnmounted(() => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
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
