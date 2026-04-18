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

    <main class="mx-auto w-full max-w-4xl flex-1 px-0 pt-[calc(theme(spacing.14)+env(safe-area-inset-top))] py-5 sm:py-8">

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
          class="group relative flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-4 transition-colors hover:border-emerald-400/60 dark:border-slate-700/70 dark:bg-slate-800/70 dark:hover:border-emerald-500/40 sm:gap-4 sm:px-5 sm:py-5"
        >
          <!-- Ссылка на весь блок (кроме кнопки удаления) -->
          <NuxtLink
            :to="`/tournaments/${tournament.id}`"
            class="absolute inset-0 z-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            :aria-label="archiveCardAriaLabel(tournament)"
          />

          <div class="relative z-10 min-w-0 flex-1 pointer-events-none">
            <!-- Заголовок и дата: на широком экране в одну линию -->
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <h2 class="min-w-0 text-base font-semibold leading-snug text-slate-900 transition-colors group-hover:text-emerald-700 dark:text-slate-50 dark:group-hover:text-emerald-400 sm:text-lg">
                {{ archiveCardTitle(tournament) }}
              </h2>
              <!-- Админ: вид как у зрителя; клик открывает нативный календарь (showPicker / click), ссылка карточки не перехватывает (z-10 контент над z-0 ссылкой). -->
              <div
                v-if="isAdmin"
                role="button"
                tabindex="0"
                aria-label="Изменить дату турнира в архиве"
                class="relative z-20 inline-flex min-h-7 max-w-full shrink-0 cursor-pointer items-center gap-1.5 self-start rounded-lg border border-slate-200/80 bg-slate-50 px-2 py-1 text-xs text-slate-600 pointer-events-auto hover:border-slate-300/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:border-slate-600/50 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:border-slate-500"
                @click.stop="(e) => void openArchiveDatePickerUi(e.currentTarget as HTMLElement)"
                @keydown.enter.prevent="(e) => void openArchiveDatePickerUi(e.currentTarget as HTMLElement)"
                @keydown.space.prevent="(e) => void openArchiveDatePickerUi(e.currentTarget as HTMLElement)"
              >
                <svg class="pointer-events-none h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span class="pointer-events-none whitespace-nowrap tabular-nums">{{ formatDate(tournament.tournament_date) || 'Указать дату' }}</span>
                <input
                  type="date"
                  data-archive-date-input
                  class="sr-only"
                  :value="archiveDateInputValue(tournament.tournament_date)"
                  :disabled="savingDateId === tournament.id"
                  :aria-label="`Дата турнира в архиве: ${formatDate(tournament.tournament_date) || 'не задана'}`"
                  @change="onArchiveDateInputChange(tournament, $event)"
                />
              </div>
              <div
                v-else-if="formatDate(tournament.tournament_date)"
                class="inline-flex max-w-full shrink-0 items-center gap-1.5 self-start rounded-lg border border-slate-200/80 bg-slate-50 px-2 py-1 text-xs text-slate-600 dark:border-slate-600/50 dark:bg-slate-900/50 dark:text-slate-400"
              >
                <svg class="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span class="whitespace-nowrap tabular-nums">{{ formatDate(tournament.tournament_date) }}</span>
              </div>
            </div>

            <!-- Чемпион и MVP: стек на узком экране, в ряд на sm+ -->
            <div
              v-if="championTeamLabel(tournament) || mvpPlayerLabel(tournament)"
              class="mt-4 flex min-w-0 flex-col gap-3 sm:mt-5 sm:flex-row sm:items-stretch"
            >
              <div
                v-if="championTeamLabel(tournament)"
                class="flex min-w-0 flex-1 gap-3 rounded-xl border border-slate-200/90 border-l-4 border-l-amber-400 bg-slate-50/90 px-3 py-3 dark:border-slate-600/50 dark:border-l-amber-500 dark:bg-slate-900/40"
              >
                <div class="shrink-0 self-center">
                  <AtomsTeamMarkerOrLogo
                    :team-name="championTeamLabel(tournament)"
                    :marker="championMarker(championTeamLabel(tournament))"
                    size="lg"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-200/90">
                    Чемпион
                  </p>
                  <p class="mt-0.5 truncate text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
                    {{ championTeamLabel(tournament) }}
                  </p>
                </div>
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-lg bg-amber-400/20 text-lg text-amber-900 ring-1 ring-amber-400/35 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/30"
                  aria-hidden="true"
                >🏆</span>
              </div>

              <div
                v-if="mvpPlayerLabel(tournament)"
                class="flex min-w-0 flex-1 gap-3 rounded-xl border border-slate-200/90 border-l-4 border-l-violet-500 bg-slate-50/90 px-3 py-3 dark:border-slate-600/50 dark:border-l-violet-400 dark:bg-slate-900/40"
              >
                <div class="relative shrink-0 self-center h-8 w-8">
                  <AtomsPlayerAvatar
                    :photo="tournament.mvp_photo"
                    :fallback-name="mvpPlayerLabel(tournament)"
                    size="md"
                  />
                  <div
                    v-if="mvpTeamLabel(tournament)"
                    class="pointer-events-none absolute -bottom-px -right-px flex h-3.5 w-3.5 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-slate-300/90 dark:bg-slate-900 dark:ring-slate-600/80"
                    aria-hidden="true"
                  >
                    <span class="inline-flex shrink-0 scale-[0.78]">
                      <AtomsTeamMarkerOrLogo
                        :team-name="mvpTeamLabel(tournament)"
                        :marker="championMarker(mvpTeamLabel(tournament))"
                        size="xs"
                      />
                    </span>
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-[10px] font-semibold uppercase tracking-wider text-violet-800 dark:text-violet-200/90">
                    MVP
                  </p>
                  <p class="mt-0.5 truncate text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
                    {{ mvpPlayerLabel(tournament) }}
                  </p>
                </div>
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-lg bg-violet-500/15 text-lg leading-none text-violet-900 ring-1 ring-violet-400/40 dark:bg-violet-500/20 dark:text-violet-100 dark:ring-violet-400/35"
                  aria-hidden="true"
                >⭐</span>
              </div>
            </div>
          </div>

          <!-- Кнопка удаления — только для администратора -->
          <button
            v-if="isAdmin"
            type="button"
            class="relative z-30 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 dark:text-slate-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
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
          <svg v-if="!isAdmin" class="relative my-auto h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-emerald-500 dark:text-slate-600 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
  mvp_team_name: string | null
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

// id турнира, для которого сохраняем дату — блокируем поле даты на время запроса.
const savingDateId = ref<string | null>(null)

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
  if (mvp) {
    const mvpTeam = mvpTeamLabel(t)
    parts.push(mvpTeam ? `MVP: ${mvp}, команда ${mvpTeam}` : `MVP: ${mvp}`)
  }
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

// Команда MVP из assignment — для значка на аватаре; пусто, если в снапшоте не было привязки.
function mvpTeamLabel(t: ArchiveListRow): string {
  return (t.mvp_team_name ?? '').trim()
}

// YYYY-MM-DD для input type=date — только если строка валидна.
function archiveDateInputValue(raw: string | undefined): string {
  const t = (raw ?? '').trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : ''
}

// Открываем системный выбор даты — overlay-ссылка иначе перехватывала бы клик.
async function openArchiveDatePickerUi(host: HTMLElement) {
  const input = host.querySelector('input[data-archive-date-input]') as HTMLInputElement | null
  if (!input || input.disabled) return
  if (typeof input.showPicker === 'function') {
    try {
      await input.showPicker()
    } catch {
      input.click()
    }
  } else {
    input.click()
  }
}

// Сохраняем дату архива на сервер и обновляем список без перезагрузки.
async function onArchiveDateInputChange(row: ArchiveListRow, ev: Event) {
  const el = ev.target as HTMLInputElement
  const next = el.value
  const prev = archiveDateInputValue(row.tournament_date)
  if (!next || next === prev) return

  savingDateId.value = row.id
  try {
    await $fetch(`/api/tournaments/${row.id}`, {
      method: 'PATCH',
      body: { tournament_date: next },
    })
    if (tournaments.value) {
      const found = tournaments.value.find((t) => t.id === row.id)
      if (found) found.tournament_date = next
    }
  } catch {
    el.value = prev
    alert('Не удалось сохранить дату. Попробуйте ещё раз.')
  } finally {
    savingDateId.value = null
  }
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

// Форматируем дату из YYYY-MM-DD в «12 апреля 2025» — парсим как локальную дату, без сдвига из-за UTC.
function formatDate(dateStr: string): string {
  const t = (dateStr ?? '').trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return ''
  const y = Number(t.slice(0, 4))
  const m = Number(t.slice(5, 7))
  const d = Number(t.slice(8, 10))
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>
