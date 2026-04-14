<template>
  <div class="flex min-h-full flex-col bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">

    <header class="absolute inset-x-0 top-0 z-20 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div class="mx-auto flex w-full min-w-0 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6 h-14">

        <!-- Режим администратора: только зелёная точка + подпись (как на главной) -->
        <template v-if="isAdmin">
          <span class="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <span class="inline-block h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" aria-hidden="true" />
            Администратор
          </span>
          <div class="flex items-center gap-1">
            <AtomsFeedbackButton />
            <AtomsThemeToggle />
            <button
              type="button"
              class="inline-flex h-11 items-center rounded-xl border border-slate-300/60 dark:border-slate-700/60 bg-slate-100/60 dark:bg-slate-800/60 px-4 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-slate-100 active:bg-slate-200 dark:active:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              @click="logout"
            >
              Выйти
            </button>
          </div>
        </template>

        <!-- Режим зрителя: лого + название + кнопка Войти -->
        <template v-else>
          <div class="flex min-w-0 flex-1 items-center gap-1 sm:gap-1.5">
            <img
              src="/favicon-96x96.png"
              srcset="/favicon-96x96.png 1x, /icon-192.png 2x"
              alt=""
              width="36"
              height="36"
              decoding="async"
              class="h-8 w-8 shrink-0 flex-none object-contain sm:h-9 sm:w-9"
            />
            <h1 class="truncate text-base font-bold text-slate-800 dark:text-slate-50 sm:text-lg leading-tight">
              Архив турниров
            </h1>
          </div>
          <div class="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <AtomsFeedbackButton />
            <AtomsThemeToggle />
            <button
              type="button"
              class="inline-flex h-11 items-center gap-1 rounded-xl px-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:text-slate-700 dark:hover:text-slate-200 active:bg-slate-200 dark:active:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 sm:gap-2 sm:px-3"
              aria-label="Войти как администратор"
              @click="onAdminEnter"
            >
              <span aria-hidden="true">🔐</span>
              Войти
            </button>
          </div>
        </template>

      </div>
    </header>

    <main class="mx-auto w-full max-w-4xl flex-1 px-3 sm:px-6 pt-[calc(theme(spacing.14)+env(safe-area-inset-top))] py-5 sm:py-8">

      <!-- Хлебные крошки: Турнир / Архив -->
      <nav aria-label="Навигация" class="mb-5">
        <ol class="flex min-w-0 flex-wrap items-center gap-1">
          <li class="flex items-center gap-1">
            <NuxtLink
              to="/"
              class="inline-flex items-center rounded-lg px-2 py-1 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            >
              Главная
            </NuxtLink>
          </li>
          <li class="flex items-center gap-1">
            <span class="select-none text-slate-400 dark:text-slate-700" aria-hidden="true">/</span>
            <span class="inline-flex items-center rounded-lg px-2 py-1 text-sm font-semibold text-slate-800 dark:text-slate-100" aria-current="page">
              Архив
            </span>
          </li>
        </ol>
      </nav>

      <!-- Состояние загрузки -->
      <div v-if="status === 'pending'" class="flex flex-col gap-3">
        <div
          v-for="i in 4"
          :key="i"
          class="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
        />
      </div>

      <!-- Ошибка загрузки -->
      <div
        v-else-if="status === 'error'"
        class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-red-300 dark:border-red-800/50 px-6 py-12 text-center"
      >
        <span class="text-4xl" aria-hidden="true">⚠️</span>
        <p class="text-sm text-slate-600 dark:text-slate-400">Не удалось загрузить архив. Попробуйте обновить страницу.</p>
      </div>

      <!-- Пустой архив -->
      <div
        v-else-if="!tournaments || tournaments.length === 0"
        class="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700/60 px-6 py-16 text-center"
      >
        <span class="text-5xl" aria-hidden="true">🏆</span>
        <div class="flex flex-col gap-1.5">
          <p class="text-base font-semibold text-slate-700 dark:text-slate-300">Архив пока пуст</p>
          <p class="text-sm text-slate-500 dark:text-slate-500 leading-relaxed">
            После завершения первого турнира его итоги появятся здесь.
          </p>
        </div>
      </div>

      <!-- Список турниров -->
      <div v-else class="flex flex-col gap-3">
        <div
          v-for="tournament in localTournaments"
          :key="tournament.id"
          class="group relative flex items-start gap-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-700/70 bg-white/95 dark:bg-slate-800/70 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/60 dark:hover:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-100/60 dark:hover:shadow-emerald-950/20"
        >
          <!-- Ссылка на весь блок (кроме кнопки удаления) -->
          <NuxtLink
            :to="`/tournaments/${tournament.id}`"
            class="absolute inset-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            :aria-label="archiveCardAriaLabel(tournament)"
          />

          <!-- Сначала крупный заголовок, ниже дата и награды отдельными бейджами. -->
          <div class="relative min-w-0 flex-1 pointer-events-none">
            <p class="whitespace-normal break-words text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors sm:text-base">
              {{ archiveCardTitle(tournament) }}
            </p>
            <!-- Дату оформляем отдельной плашкой, чтобы она не спорила с заголовком. -->
            <div class="mt-1 inline-flex max-w-full items-center gap-1 rounded-lg bg-slate-100/80 dark:bg-slate-700/35 px-1.5 py-0.5 text-[11px] text-slate-600 dark:text-slate-300 sm:gap-1.5 sm:px-2 sm:py-1 sm:text-xs">
              <svg class="h-3 w-3 shrink-0 text-slate-500 dark:text-slate-400 sm:h-3.5 sm:w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span class="truncate">{{ formatDate(tournament.tournament_date) }}</span>
            </div>

            <!-- Бейджи наград рядом: так глазу легче быстро считать главное по турниру. -->
            <div class="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5 sm:mt-2 sm:gap-2">
              <div
                v-if="championTeamLabel(tournament)"
                class="inline-flex min-w-0 max-w-full items-center gap-1 rounded-lg border border-amber-200/80 dark:border-amber-500/30 bg-amber-50/90 dark:bg-amber-500/10 px-2 py-1 sm:gap-1.5 sm:rounded-xl sm:px-2.5 sm:py-1.5"
              >
                <AtomsTeamMarkerOrLogo
                  :team-name="championTeamLabel(tournament)"
                  :marker="championMarker(championTeamLabel(tournament))"
                  size="xs"
                />
                <span class="min-w-0 text-[11px] leading-snug text-amber-900 dark:text-amber-100 sm:text-xs">
                  <span class="font-semibold uppercase tracking-wide text-[9px] text-amber-700/90 dark:text-amber-300/90 sm:text-[10px]">Чемпион</span>
                  {{ ' ' }}
                  <span class="font-semibold text-slate-800 dark:text-slate-100">{{ championTeamLabel(tournament) }}</span>
                </span>
              </div>

              <!-- MVP считается на сервере так же, как при завершении турнира; фото из архива игроков. -->
              <div
                v-if="mvpPlayerLabel(tournament)"
                class="inline-flex min-w-0 max-w-full items-center gap-1 rounded-lg border border-emerald-200/80 dark:border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-500/10 px-2 py-1 sm:gap-1.5 sm:rounded-xl sm:px-2.5 sm:py-1.5"
              >
                <AtomsPlayerAvatar
                  :photo="tournament.mvp_photo"
                  :fallback-name="mvpPlayerLabel(tournament)"
                  size="xs"
                />
                <span class="min-w-0 text-[11px] leading-snug text-emerald-900 dark:text-emerald-100 sm:text-xs">
                  <span class="font-semibold uppercase tracking-wide text-[9px] text-emerald-700/90 dark:text-emerald-300/90 sm:text-[10px]">MVP</span>
                  {{ ' ' }}
                  <span class="font-semibold text-slate-800 dark:text-slate-100">{{ mvpPlayerLabel(tournament) }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Кнопка удаления — только для администратора -->
          <button
            v-if="isAdmin"
            type="button"
            class="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 dark:text-slate-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
            :aria-label="`Удалить запись: ${archiveCardTitle(tournament)}`"
            :disabled="deletingId === tournament.id"
            @click.prevent="deleteTournament(tournament.id)"
          >
            <!-- Спиннер во время удаления -->
            <svg v-if="deletingId === tournament.id" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <!-- Иконка корзины -->
            <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>

          <!-- Стрелка вправо — только не для администратора -->
          <svg v-if="!isAdmin" class="relative my-auto h-4 w-4 shrink-0 text-slate-400 dark:text-slate-600 group-hover:text-emerald-500 transition-colors pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>

    </main>

    <!-- Модальное окно входа администратора — то же что на главной -->
    <OrganismsAdminLoginModal
      v-if="showLoginModal"
      @close="showLoginModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { useAdminAuth } from '~/composables/useAdminAuth'
import { useTeamColors } from '~/composables/useTeamColors'
import { resolveTeamColorIndex } from '~/utils/teamNames'

// Мета-теги страницы — для SEO и вкладки браузера.
useHead({ title: 'Архив турниров' })

// Тип строки списка — совпадает с ответом GET /api/tournaments (в т.ч. чемпион из snapshot).
type ArchiveListRow = {
  id: string
  tournament_name: string
  tournament_date: string
  venue_label: string
  format_label: string
  created_at: string
  champion_team_name: string | null
  mvp_player_id: number | null
  mvp_player_name: string | null
  mvp_photo: string | null
}

// Загружаем список всех завершённых турниров из API.
const { data: tournaments, status } = await useFetch<ArchiveListRow[]>('/api/tournaments')

// Маркер цвета для команды без карты цветов в списке — как запасной вариант для эмодзи.
const { getMarkerByIndex } = useTeamColors()

// Локальная копия списка — чтобы удалять записи без перезагрузки страницы.
const localTournaments = computed(() => tournaments.value ?? [])

// Логика входа/выхода администратора.
const showLoginModal = ref(false)
const { isAdmin, restoreSession, logout } = useAdminAuth()

function onAdminEnter() {
  if (restoreSession()) return
  showLoginModal.value = true
}

// id турнира, который сейчас удаляется — для спиннера на кнопке.
const deletingId = ref<string | null>(null)

// Строка заголовка карточки: место и формат; если пусто — сохранённое имя турнира или «Турнир».
function archiveCardTitle(t: {
  venue_label?: string
  format_label?: string
  tournament_name?: string
}): string {
  const venue = (t.venue_label ?? '').trim()
  const format = (t.format_label ?? '').trim()
  if (venue && format) return `${venue} · ${format}`
  if (venue) return venue
  if (format) return format
  return (t.tournament_name ?? '').trim() || 'Турнир'
}

// Подпись для скринридера — добавляем чемпиона, если сервер его вытащил из снапшота.
function archiveCardAriaLabel(t: ArchiveListRow): string {
  const base = archiveCardTitle(t)
  const parts = [base]
  const champ = championTeamLabel(t)
  if (champ) parts.push(`Чемпион: ${champ}`)
  const mvp = mvpPlayerLabel(t)
  if (mvp) parts.push(`MVP: ${mvp}`)
  return parts.join('. ')
}

// Имя чемпиона без лишних пробелов — пустая строка значит блок не показываем.
function championTeamLabel(t: ArchiveListRow): string {
  return (t.champion_team_name ?? '').trim()
}

// Эмодзи-маркер для чемпиона, если нет файла логотипа в teamLogos.
function championMarker(teamName: string): string {
  const idx = resolveTeamColorIndex(teamName, null, 0)
  return getMarkerByIndex(idx)
}

// Подпись MVP с сервера — пусто, если не удалось посчитать.
function mvpPlayerLabel(t: ArchiveListRow): string {
  return (t.mvp_player_name ?? '').trim()
}

// Удаляем турнир — спрашиваем подтверждение, затем DELETE в API.
async function deleteTournament(id: string) {
  const row = localTournaments.value.find(entry => entry.id === id)
  const name = row ? archiveCardTitle(row) : 'этот турнир'
  if (!confirm(`Удалить «${name}» из архива? Это действие нельзя отменить.`)) return

  deletingId.value = id
  try {
    await $fetch(`/api/tournaments/${id}`, { method: 'DELETE' })
    // Убираем турнир из реактивного массива после успешного удаления.
    if (tournaments.value) {
      tournaments.value = tournaments.value.filter(t => t.id !== id)
    }
  } catch {
    alert('Не удалось удалить турнир. Попробуйте ещё раз.')
  } finally {
    deletingId.value = null
  }
}

// Форматируем дату из YYYY-MM-DD в «12 апреля 2025» — читаемо для пользователя.
function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>
