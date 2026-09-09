// Composable для синхронизации состояния турнира с базой данных через API.
// useFetch с фиксированным key — Nuxt один раз тянет state на SSR и передаёт payload на клиент без второго GET при обновлении страницы.
import type { SavedTournamentContext } from '~/composables/useTournamentWizard'

// Debounce-задержка: не сохраняем после каждой клавиши — ждём паузы в 800мс.
const SAVE_DEBOUNCE_MS = 800

// Поллинг запускается только после того как турнир запущен (state не null и не finished).
// До нажатия кнопки «Переход к турниру» поллинга нет — зритель сам обновил страницу и увидел данные.
const STATE_REFETCH_ACTIVE_MS = 15_000

// Судья и админ ведут один матч с разных устройств — им нужен более частый обмен,
// а между матчами хватает медленного фона, чтобы поймать «матч завершён» с другого устройства.
const ADMIN_LIVE_REFETCH_MS = 5_000
const ADMIN_IDLE_REFETCH_MS = 15_000

/** Ключ Nuxt useFetch / refreshNuxtData — один и тот же, чтобы принудительное обновление попадало в тот же кэш. */
export const TOURNAMENT_STATE_NUXT_KEY = 'tournament-state'

// Что нужно мастеру турнира: один раз создаём useTournamentState() и передаём сюда — без второго подключения к тому же API.
export type TournamentStateSyncApi = {
  serverState: ComputedRef<SavedTournamentContext | null>
  isLoading: Ref<boolean>
  saveTournamentState: (state: SavedTournamentContext) => void
  saveTournamentStateNow: (state: SavedTournamentContext) => Promise<void>
  /** Сбрасывает отложенный PUT (debounce) — нужен перед полным сбросом и при синхронизации с другой вкладкой. */
  cancelPendingSave: () => void
  /** Перечитать state из БД (после отметки оплаты, смены из ВК). */
  refresh: () => Promise<void>
  /** Один refetch + пересчёт live-поллинга — при возврате на вкладку (без дубля с `visibility` на странице). */
  resyncAfterTabBecameVisible: () => Promise<void>
}

export function useTournamentState(): TournamentStateSyncApi {
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

  function cancelPendingSave() {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
  }

  /** Вкладка на экране? В фоне не поллим: при возврате всё равно делаем refetch по visibilitychange. */
  function isTabVisible(): boolean {
    if (!import.meta.client) return false
    return document.visibilityState === 'visible'
  }

  /**
   * Турнир реально в работе: набирают состав, разводят по командам или ведут таблицу.
   * Пустой мастер и уже сброшенный турнир не поллим — незачем стучаться в базу сутками.
   */
  function tournamentIsActive(): boolean {
    const s = serverState.value
    if (!s) return false
    if (s.matchStatus === 'live') return true
    if (s.standingsSnapshot != null) return true
    if (Number(s.step) > 0) return true
    return Array.isArray(s.selectedIds) && s.selectedIds.length > 0
  }

  function syncPoll() {
    // Вкладка свёрнута или экран погас — таймер не крутим (батарея и мобильный трафик).
    if (!isTabVisible()) {
      stopPoll()
      return
    }
    // Идёт матч: зритель видит счёт в реальном времени, админ и судья — ещё и отметки друг друга.
    if (serverState.value?.matchStatus === 'live') {
      startPoll(isAdmin() ? ADMIN_LIVE_REFETCH_MS : STATE_REFETCH_ACTIVE_MS)
      return
    }
    // Матч не идёт: у админа и судьи держим редкий фон, но только пока турнир в работе.
    if (isAdmin() && tournamentIsActive()) {
      startPoll(ADMIN_IDLE_REFETCH_MS)
      return
    }
    stopPoll()
  }

  async function resyncAfterTabBecameVisible() {
    await refresh()
    syncPoll()
  }

  if (import.meta.client) {
    onMounted(() => {
      // immediate: true — запускаем поллинг сразу при монтировании с нужным интервалом.
      watch(
        () => [serverState.value?.matchStatus ?? null, tournamentIsActive()] as const,
        () => syncPoll(),
        { immediate: true },
      )
      // Ушли со вкладки — гасим таймер, вернулись — поднимаем обратно.
      document.addEventListener('visibilitychange', syncPoll)
    })
  }

  onUnmounted(() => {
    stopPoll()
    cancelPendingSave()
    if (import.meta.client) {
      document.removeEventListener('visibilitychange', syncPoll)
    }
  })

  // Проверяем куку admin_session на клиенте — не делаем PUT если пользователь не администратор.
  // Это предотвращает лишний запрос и 403 в консоли браузера у зрителей.
  function isAdmin(): boolean {
    if (!import.meta.client) return false
    // Simple10: Админ — это либо full, либо limited.
    return document.cookie.split(';').some((c) => {
      const trimmed = c.trim()
      return trimmed.startsWith('admin_session=full') || trimmed.startsWith('admin_session=limited')
    })
  }

  function saveTournamentState(state: SavedTournamentContext) {
    cancelPendingSave()

    saveTimer = setTimeout(async () => {
      if (!isAdmin()) return
      try {
        await $fetch('/api/tournament/state', {
          method: 'PUT',
          body: { state },
        })
        // Подтягиваем тот же state в useFetch, иначе мастер думает, что на сервере старый selectedIds (бот/UI расходятся).
        await refresh()
      } catch (err) {
        console.error('Failed to save tournament state:', err)
      }
    }, SAVE_DEBOUNCE_MS)
  }

  async function saveTournamentStateNow(state: SavedTournamentContext) {
    cancelPendingSave()
    if (!isAdmin()) {
      throw new Error('Tournament state: admin session required')
    }
    try {
      await $fetch('/api/tournament/state', {
        method: 'PUT',
        body: { state },
      })
      await refresh()
    } catch (err) {
      console.error('Failed to save tournament state (immediate):', err)
      throw err
    }
  }

  return {
    serverState,
    isLoading: pending,
    saveTournamentState,
    saveTournamentStateNow,
    cancelPendingSave,
    refresh,
    resyncAfterTabBecameVisible,
  }
}
