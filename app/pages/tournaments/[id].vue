<template>
  <div class="flex min-h-full flex-col bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">

    <header class="absolute inset-x-0 top-0 z-20 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pt-[env(safe-area-inset-top)] print:hidden">
      <div class="mx-auto flex w-full min-w-0 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6 h-14">

        <!-- Режим администратора: зелёная точка + подпись (как на главной) -->
        <template v-if="isAdmin">
          <span class="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <span class="inline-block h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" aria-hidden="true" />
            Администратор
          </span>
          <div class="flex items-center gap-1">
            <!-- Копировать ссылку — только иконка (подпись в aria-label) -->
            <button
              type="button"
              class="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:text-slate-700 dark:hover:text-slate-200 active:bg-slate-200 dark:active:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              :class="copied && 'text-emerald-600 dark:text-emerald-400'"
              :aria-label="copied ? 'Ссылка скопирована' : 'Скопировать ссылку'"
              @click="copyLink"
            >
              <svg v-if="copied" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <svg v-else class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            </button>
            <AtomsFeedbackButton />
            <AtomsThemeToggle />
            <!-- Удалить турнир -->
            <button
              type="button"
              class="inline-flex h-11 w-11 items-center justify-center rounded-xl text-red-500 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 disabled:opacity-50"
              :disabled="isDeleting"
              aria-label="Удалить турнир из архива"
              @click="deleteTournament"
            >
              <svg v-if="isDeleting" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <svg v-else class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
            <!-- Выйти — точно как на главной -->
            <button
              type="button"
              class="inline-flex h-11 items-center rounded-xl border border-slate-300/60 dark:border-slate-700/60 bg-slate-100/60 dark:bg-slate-800/60 px-4 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-800 dark:hover:text-slate-100 active:bg-slate-200 dark:active:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              @click="logout"
            >
              Выйти
            </button>
          </div>
        </template>

        <!-- Режим зрителя: лого + название турнира + кнопки -->
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
            <div class="min-w-0 flex-1">
              <p class="truncate text-base font-bold text-slate-800 dark:text-slate-50 sm:text-lg leading-tight">
                {{ tournament?.tournamentName || 'Турнир' }}
              </p>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              class="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:text-slate-700 dark:hover:text-slate-200 active:bg-slate-200 dark:active:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              :class="copied && 'text-emerald-600 dark:text-emerald-400'"
              :aria-label="copied ? 'Ссылка скопирована' : 'Скопировать ссылку'"
              @click="copyLink"
            >
              <svg v-if="copied" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <svg v-else class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            </button>
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

    <!-- px только у хлебных крошек/ошибок; итоги турнира тянем на всю ширину max-w-4xl без второй «коробки». -->
    <main class="mx-auto w-full max-w-4xl flex-1 px-0 py-5 sm:py-8 pt-[calc(theme(spacing.14)+env(safe-area-inset-top))] print:!pt-6 print:max-w-none">

      <!-- Хлебные крошки: Турнир / Архив / Название турнира -->
      <nav aria-label="Навигация" class="mb-5 px-3 sm:px-6 print:hidden">
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
            <NuxtLink
              to="/tournaments"
              class="inline-flex items-center rounded-lg px-2 py-1 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            >
              Архив
            </NuxtLink>
          </li>
          <li class="flex min-w-0 items-center gap-1">
            <span class="select-none text-slate-400 dark:text-slate-700" aria-hidden="true">/</span>
            <span class="inline-flex min-w-0 items-center rounded-lg px-2 py-1 text-sm font-semibold text-slate-800 dark:text-slate-100 truncate" aria-current="page">
              {{ tournament?.tournamentName || 'Турнир' }}
            </span>
          </li>
        </ol>
      </nav>

      <!-- Ошибка 404 -->
      <div
        v-if="error?.statusCode === 404"
        class="mx-3 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700/60 px-6 py-16 text-center sm:mx-6"
      >
        <span class="text-5xl" aria-hidden="true">🏆</span>
        <div class="flex flex-col gap-1.5">
          <p class="text-base font-semibold text-slate-700 dark:text-slate-300">Турнир не найден</p>
          <p class="text-sm text-slate-500 dark:text-slate-500">Возможно, ссылка устарела или неверна.</p>
        </div>
        <NuxtLink
          to="/tournaments"
          class="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        >
          К архиву турниров
        </NuxtLink>
      </div>

      <!-- Другая ошибка -->
      <div
        v-else-if="error"
        class="mx-3 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-red-300 dark:border-red-800/50 px-6 py-12 text-center sm:mx-6"
      >
        <span class="text-4xl" aria-hidden="true">⚠️</span>
        <p class="text-sm text-slate-600 dark:text-slate-400">Не удалось загрузить турнир. Попробуйте обновить страницу.</p>
      </div>

      <!-- Итоги турнира — тот же компонент что зритель видит на главной -->
      <div
        v-else-if="tournament && tournamentSummary"
        class="w-full overflow-visible bg-transparent print:shadow-none"
      >
        <OrganismsViewerTournamentSummary
          :summary="tournamentSummary"
          :tournament-date="tournament.tournamentDate"
          :venue-label="tournament.venueLabel"
          :format-label="tournament.formatLabel"
          :team-colors="teamColors"
          :players="players"
          :assignment-by-player-id="assignmentByPlayerId"
          :aggregate-player-stats="tournament.snapshot.aggregatePlayerStats"
          :player-rating-deltas="tournament.snapshot.playerRatingDeltas"
          :played-matches-list="tournament.snapshot.playedMatchesList"
        />
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
import { useTournamentSummary } from '~/composables/useTournamentSummary'
import { normalizeTeamColorsMap, normalizeTeamName } from '~/utils/teamNames'
import { useAdminAuth } from '~/composables/useAdminAuth'

const route = useRoute()
const id = route.params.id as string

// Загружаем данные турнира по id из URL.
const { data: tournament, error } = await useFetch(`/api/tournaments/${id}`)

// Абсолютный URL страницы — для canonical и Open Graph (превью в соцсетях).
const requestURL = useRequestURL()
const pageCanonical = computed(() => `${requestURL.origin}/tournaments/${id}`)
const ogImageAbsolute = computed(() => `${requestURL.origin}/icon-192.png`)

// Нормализуем цвета команд — как в TournamentViewer.
const teamColors = computed(() =>
  normalizeTeamColorsMap(tournament.value?.teamColors ?? {}),
)

// Нормализуем назначение игроков — ключи из JSON могут быть строками, нужны числа.
const assignmentByPlayerId = computed<Record<number, string>>(() => {
  const raw = tournament.value?.assignmentByPlayerId ?? {}
  const out: Record<number, string> = {}
  for (const [idStr, team] of Object.entries(raw)) {
    const n = normalizeTeamName(String(team))
    if (n) out[Number(idStr)] = n
  }
  return out
})

// Список игроков — нужен для составов и наград.
const players = computed(() => tournament.value?.players ?? [])

// Вычисляем итоги — те же вычисления что и у зрителя на главной.
const tournamentSummary = computed(() => {
  const t = tournament.value
  if (!t?.snapshot || t.snapshot.playedMatchesList.length === 0) return null
  return useTournamentSummary({
    players: players.value,
    assignmentByPlayerId: assignmentByPlayerId.value,
    aggregatePlayerStats: t.snapshot.aggregatePlayerStats,
    playedMatchesList: t.snapshot.playedMatchesList,
    standingsRows: t.snapshot.standingsRows,
    playerRatingDeltas: t.snapshot.playerRatingDeltas,
    teamColors: teamColors.value,
  })
})

// Текст для соцсетей и поиска: название, чемпион по таблице, сухие цифры.
const tournamentSeoDescription = computed(() => {
  const t = tournament.value
  if (!t) return 'Итоги турнира РФОИ — таблица, награды и матчи в архиве.'
  const sum = tournamentSummary.value
  if (!sum) {
    return `«${t.tournamentName}» — карточка турнира в архиве РФОИ.`
  }
  const sorted = [...sum.standingsRows].sort((a, b) => a.place - b.place)
  const champ = sorted[0]?.teamName
  const { totalMatches, totalGoals, avgGoalsPerMatch } = sum.stats
  const avg = Number.isInteger(avgGoalsPerMatch) ? String(avgGoalsPerMatch) : avgGoalsPerMatch.toFixed(1)
  const bits = [
    `Итоги турнира «${t.tournamentName}».`,
    champ ? `Чемпион: ${champ}.` : '',
    `${totalMatches} матчей, ${totalGoals} голов, в среднем ${avg} за матч.`,
  ]
  return bits.filter(Boolean).join(' ')
})

const tournamentPageTitle = computed(() => tournament.value?.tournamentName || 'Итоги турнира')

useSeoMeta({
  title: tournamentPageTitle,
  description: tournamentSeoDescription,
  ogSiteName: 'РФОИ',
  ogTitle: tournamentPageTitle,
  ogDescription: tournamentSeoDescription,
  ogType: 'article',
  ogUrl: pageCanonical,
  ogLocale: 'ru_RU',
  ogImage: ogImageAbsolute,
  twitterCard: 'summary_large_image',
  twitterTitle: tournamentPageTitle,
  twitterDescription: tournamentSeoDescription,
  robots: 'index, follow',
})

useHead({
  link: [{ rel: 'canonical', href: pageCanonical }],
})

// Состояние кнопки «Копировать ссылку» — на 2 секунды меняет иконку на галочку.
const copied = ref(false)

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    // Через 2 секунды возвращаем кнопку в исходное состояние.
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Если буфер обмена недоступен — ничего не делаем.
  }
}

// Логика входа/выхода администратора.
const showLoginModal = ref(false)
const { isAdmin, restoreSession, logout } = useAdminAuth()

function onAdminEnter() {
  if (restoreSession()) return
  showLoginModal.value = true
}

// Удаление турнира — с подтверждением, затем редирект на архив.
const isDeleting = ref(false)

async function deleteTournament() {
  const name = tournament.value?.tournamentName || 'этот турнир'
  if (!confirm(`Удалить «${name}» из архива? Это действие нельзя отменить.`)) return

  isDeleting.value = true
  try {
    await $fetch(`/api/tournaments/${id}`, { method: 'DELETE' })
    // После удаления возвращаемся в архив.
    await navigateTo('/tournaments')
  } catch {
    alert('Не удалось удалить турнир. Попробуйте ещё раз.')
    isDeleting.value = false
  }
}
</script>
