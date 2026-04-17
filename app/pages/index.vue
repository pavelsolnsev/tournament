<template>
  <!-- h-full продолжает цепочку высоты от #scroll-root → landing → сюда. -->
  <div class="h-full">
    <!-- Режим берём из SSR cookie через useAdminAuth, чтобы не зависать на клиентском прелоудере. -->
      <!-- Ошибка API списка игроков — отдельно от падения Vue: зритель и админ видят кнопку «Повторить». -->
      <div
        v-if="playersFetchError"
        class="mx-auto mb-4 flex w-full max-w-4xl flex-col gap-2 rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-50 sm:px-6"
        role="alert"
      >
        <span>Не удалось загрузить данные.</span>
        <button
          type="button"
          class="self-start rounded-lg border border-amber-400/90 bg-white/80 px-3 py-1.5 text-sm font-medium text-amber-950 transition-colors hover:bg-amber-100/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 dark:border-amber-600 dark:bg-amber-900/50 dark:text-amber-50 dark:hover:bg-amber-900/80"
          @click="() => void refreshPlayers()"
        >
          Повторить
        </button>
      </div>
      <!-- Режим администратора -->
      <template v-if="isAdmin">
        <!-- min-h-full растягивает до высоты #scroll-root (= весь экран). -->
        <div class="flex min-h-full flex-col">
          <!-- Шапка администратора — светлая/тёмная тема через dark: классы. -->
          <header class="absolute inset-x-0 top-0 z-20 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
            <div class="mx-auto flex w-full min-w-0 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6 h-14">
              <span class="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <span class="inline-block h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" aria-hidden="true" />
                {{ adminRole === 'limited' ? 'Режим судьи' : 'Администратор' }}
              </span>
              <!-- Кнопки в шапке: обновить + пожелания + тема + выход (как у зрителя). -->
              <div class="flex items-center gap-1">
                <AtomsHeaderRefreshButton :busy="adminHeaderRefreshing" @click="handleAdminHeaderRefresh" />
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
            </div>
          </header>

          <!-- flex-1 растягивает main; pt — отступ под абсолютный header. Контент идёт сверху. -->
          <main class="mx-auto flex w-full min-w-0 max-w-4xl flex-1 flex-col px-4 sm:px-6 pt-[calc(theme(spacing.14)+env(safe-area-inset-top))]">
            <div v-if="!wizard.stateRestored.value" class="flex items-center gap-3 py-8 text-sm text-slate-600 dark:text-slate-400">
              <div class="h-9 w-9 shrink-0 animate-spin rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-emerald-500" />
              <span>Загрузка…</span>
            </div>

            <section v-else class="flex w-full flex-col gap-6 py-5 sm:py-8">
              <!-- На шаге 0 крошку не показываем: заголовок уже «Выберите игроков», подпись «Игроки» лишняя. -->
              <nav v-if="!isLimitedAdmin && wizard.step.value > 0" aria-label="Шаги мастера">
                <ol class="flex min-w-0 flex-wrap items-center gap-1">
                  <li
                    v-for="(crumb, idx) in breadcrumbs.filter(c => c.step <= wizard.step.value)"
                    :key="crumb.step"
                    class="flex items-center gap-1"
                  >
                    <!-- Разделитель между шагами -->
                    <span
                      v-if="idx > 0"
                      class="select-none text-slate-400 dark:text-slate-700"
                      aria-hidden="true"
                    >/</span>

                    <!-- Пройденный шаг — кликабельный -->
                    <button
                      v-if="crumb.step < wizard.step.value"
                      type="button"
                      class="inline-flex items-center rounded-lg px-2 py-1 text-sm font-medium
                             text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                      @click="wizard.step.value = crumb.step as 0 | 1 | 2"
                    >
                      {{ crumb.label }}
                    </button>

                    <!-- Текущий шаг — не кликабельный, выделен -->
                    <span
                      v-else
                      class="inline-flex items-center rounded-lg px-2 py-1 text-sm font-semibold text-slate-800 dark:text-slate-100"
                      aria-current="step"
                    >
                      {{ crumb.label }}
                    </span>
                  </li>
                </ol>
              </nav>

              <template v-if="!isLimitedAdmin && (wizard.step.value === 0 || wizard.step.value === 1)">
                <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-50 sm:text-3xl">
                  {{ wizard.step.value === 0 ? 'Выберите игроков' : 'Команды' }}
                </h1>

                <OrganismsTournamentStepTeams
                  v-if="wizard.step.value === 1"
                  :selected-players="wizard.selectedPlayers.value"
                  :team-options="wizard.assignment.teamOptions"
                  :get-team="wizard.assignment.getTeam"
                  :get-team-color="wizard.assignment.getTeamColor"
                  :new-team-name="wizard.assignment.newTeamName"
                  :confirmed-team-names="wizard.assignment.confirmedTeamNames"
                  :confirmed-teams-count="wizard.confirmedTeamsList.value.length"
                  :auto-distributed-names="wizard.assignment.autoDistributedNames"
                  @update:new-team-name="(v) => { wizard.assignment.newTeamName.value = v }"
                  @set-team="wizard.assignment.setTeam"
                  @set-team-color="wizard.assignment.setTeamColor"
                  @add-new-team="wizard.onAddNewTeam"
                  @remove-from-team="wizard.assignment.removeFromTeam"
                  @confirm-team="wizard.assignment.confirmTeam"
                  @unconfirm-team="wizard.assignment.unconfirmTeam"
                  @remove-team="wizard.assignment.removeTeam"
                  @back-to-players="wizard.step.value = 0"
                  @go-to-standings="goToStandings"
                  @auto-distribute="(count) => wizard.assignment.autoDistribute(wizard.selectedPlayers.value, count)"
                  @remove-player="wizard.removePlayer"
                />

                <OrganismsTournamentStepPlayers
                  v-else
                  :players="wizard.players.value ?? []"
                  :selected-players="wizard.selectedPlayers.value"
                  :available-players="wizard.availablePlayers.value"
                  :filtered-available-players="wizard.filteredAvailablePlayers.value"
                  :player-search="wizard.playerSearch.value"
                  :venue-label="wizard.venueLabel.value"
                  :format-label="wizard.formatLabel.value"
                  :tournament-date="wizard.tournamentDate.value"
                  @select-player="wizard.selectPlayer"
                  @remove-player="wizard.removePlayer"
                  @update:player-search="(v) => { wizard.playerSearch.value = v }"
                  @update:venue-label="(v) => { wizard.venueLabel.value = v }"
                  @update:format-label="(v) => { wizard.formatLabel.value = v }"
                  @update:tournament-date="(v) => { wizard.tournamentDate.value = v }"
                  @refresh-players="wizard.refreshPlayers()"
                  @go-to-teams="wizard.goToTeams()"
                />
              </template>

              <OrganismsTournamentStepStandings
                v-if="isLimitedAdmin || wizard.step.value === 2"
                :tournament-name="wizard.tournamentName.value"
                :tournament-date="wizard.tournamentDate.value"
                :venue-label="wizard.venueLabel.value"
                :format-label="wizard.formatLabel.value"
                :teams="wizard.confirmedTeamsList.value"
                :team-colors="wizard.assignment.teamColors.value"
                :players="wizard.players.value ?? []"
                :assignment-by-player-id="wizard.assignment.assignment.value"
                :initial-snapshot="wizard.standingsSnapshot.value"
                :show-clear-tournament-confirm="showClearTournamentConfirm"
                :clear-tournament-seconds-left="clearTournamentSeconds"
                :clear-tournament-busy="clearTournamentBusy"
                @update:snapshot="wizard.saveStandingsSnapshot"
                @update:match-status="wizard.updateMatchStatus"
                @tournament-finished="handleTournamentFinished"
                @clear-tournament="canClearTournament && (showClearTournamentConfirm = true)"
                @cancel-clear-tournament="cancelClearTournament"
                @confirm-clear-tournament="confirmClearTournament"
              />

              <!-- Сброс турнира — показываем внизу только на шагах 0 и 1.
                   На шаге 2 (Таблица) кнопка «Очистить данные» перенесена внутрь блока «Управление». -->
              <div
                v-if="wizard.step.value !== 2 && canClearTournament"
                ref="clearTournamentBottomAnchor"
                class="flex flex-col gap-2 dark:border-slate-700 sm:items-end"
              >
                <button
                  v-if="!showClearTournamentConfirm"
                  type="button"
                  class="self-end inline-flex items-center gap-2 rounded-xl border border-red-300/70 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 sm:px-4 sm:text-sm"
                  @click="showClearTournamentConfirm = true"
                >
                  Очистить данные
                </button>
                <MoleculesDangerConfirmInline
                  v-else
                  :open="true"
                  :seconds-left="clearTournamentSeconds"
                  :busy="clearTournamentBusy"
                  title="Сбросить турнир? Игроки в турнире, команды, таблица и статус матча обнулятся. Список игроков в базе не трогаем."
                  cancel-text="Отмена"
                  confirm-text="Очистить всё"
                  busy-text="Очищаем…"
                  aria-label="Подтверждение полного сброса турнира"
                  @cancel="cancelClearTournament"
                  @confirm="confirmClearTournament"
                />
              </div>
            </section>
          </main>
        <!-- Модальное окно пожеланий — доступно и администратору. -->
        <MoleculesFeedbackModal />
        </div>
      </template>

    <!-- Режим зрителя -->
    <OrganismsViewerTournamentViewer
      v-else
      :state="viewerState"
      :players="allPlayers"
      :on-refresh="refreshAll"
    />

</div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import { computed } from 'vue'
import { useAdminAuth } from '~/composables/useAdminAuth'
import { useTournamentWizard } from '~/composables/useTournamentWizard'
import { TOURNAMENT_STATE_NUXT_KEY, useTournamentState } from '~/composables/useTournamentState'

definePageMeta({ layout: 'landing' })

// Абсолютный URL страницы — для og:url и canonical (картинки в шаринге не задаём — только текст).
const requestURL = useRequestURL()
const canonicalHref = requestURL.href.split('#')[0]

// Мета для поиска и шаринга: описание и Open Graph/Twitter без og:image — превью в соцсетях текстовое.
useSeoMeta({
  title: 'РФОИ',
  description:
    'Веб-приложение для футбольных турниров: распределение игроков по командам, матчи и турнирная таблица. Режим администратора и просмотр для зрителей.',
  ogSiteName: 'РФОИ',
  ogTitle: 'РФОИ — турниры, команды и таблица',
  ogDescription:
    'Составы команд, матчи и турнирная таблица в одном месте — для организатора и зрителей.',
  ogType: 'website',
  ogUrl: canonicalHref,
  ogLocale: 'ru_RU',
  twitterCard: 'summary',
  twitterTitle: 'РФОИ — турниры, команды и таблица',
  twitterDescription:
    'Составы команд, матчи и турнирная таблица — для организатора и зрителей.',
  // Разрешаем индексацию главной и обход ссылок ботами (если позже закроете сайт — поменяйте на noindex).
  robots: 'index, follow',
})

// Один канонический URL без хеша — чтобы поиск не плодил дубли.
useHead({
  link: [{ rel: 'canonical', href: canonicalHref }],
})

const { isAdmin, adminRole, logout, restoreSession } = useAdminAuth()

// Simple10: «Очистить данные» — опасная операция, доступна только полному админу.
const canClearTournament = computed(() => adminRole.value === 'full')

// Simple10: Ограниченный админ (limited) должен видеть только раздел «Таблица».
const isLimitedAdmin = computed(() => adminRole.value === 'limited')

// Канал между вкладками админки: после «Завершить турнир» / «Очистить данные» остальные вкладки подтягивают state из БД.
const ADMIN_TOURNAMENT_BC = 'football-tournament-admin-sync'
let adminTournamentBc: BroadcastChannel | null = null

// После гидрации мягко подтверждаем сессию из cookie — это убирает редкие рассинхроны между SSR и клиентом.
onMounted(() => {
  restoreSession()
})

const clearTournamentBottomAnchor = useTemplateRef<HTMLDivElement>('clearTournamentBottomAnchor')

// Крутилка на кнопке «Обновить» в шапке админки — пока тянем турнир и список игроков с сервера.
const adminHeaderRefreshing = ref(false)

const tournamentState = useTournamentState()
const wizard = useTournamentWizard({
  serverState: tournamentState.serverState,
  isLoading: tournamentState.isLoading,
  saveTournamentState: tournamentState.saveTournamentState,
  saveTournamentStateNow: tournamentState.saveTournamentStateNow,
})

const viewerState = computed(() => tournamentState.serverState.value)

// Ручное обновление из шапки: свежий state турнира + игроки, потом мастер подстраивается под serverState.
async function handleAdminHeaderRefresh() {
  if (adminHeaderRefreshing.value) return
  adminHeaderRefreshing.value = true
  try {
    await Promise.all([tournamentState.refresh(), refreshPlayers()])
    await nextTick()
    wizard.reapplyFromServer()
  } finally {
    await new Promise((r) => setTimeout(r, 600))
    adminHeaderRefreshing.value = false
  }
}

// Когда вкладка снова видна — подтягиваем турнир из БД (другая вкладка могла завершить турнир).
function onAdminVisibilitySync() {
  if (document.visibilityState !== 'visible') return
  if (!isAdmin.value) return
  void syncWizardFromServerAfterExternalChange()
}

// Обновляем кэш Nuxt и перезаливаем refs мастера из serverState — без этого вторая вкладка остаёт со старым UI.
async function syncWizardFromServerAfterExternalChange() {
  if (!isAdmin.value) return
  await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
  await nextTick()
  wizard.reapplyFromServer()
}

// Сообщаем всем вкладкам админки: в БД уже новое состояние турнира, перечитайте.
function broadcastAdminTournamentStateChanged() {
  if (!import.meta.client || !isAdmin.value) return
  try {
    adminTournamentBc?.postMessage({ type: 'tournament-state-sync', ts: Date.now() })
  } catch {
    /* BroadcastChannel может быть недоступен — тогда остаётся sync по visibility */
  }
}

onMounted(() => {
  if (!import.meta.client) return
  const match = document.cookie.match(/(?:^|; )admin_session=([^;]*)/)
  const cookieValue = match ? decodeURIComponent(match[1] ?? '') : ''
  // Simple10: В cookie admin_session теперь роль: full или limited.
  if (cookieValue !== 'full' && cookieValue !== 'limited') return
  if (typeof BroadcastChannel !== 'undefined') {
    adminTournamentBc = new BroadcastChannel(ADMIN_TOURNAMENT_BC)
    adminTournamentBc.onmessage = () => {
      void syncWizardFromServerAfterExternalChange()
    }
  }
  document.addEventListener('visibilitychange', onAdminVisibilitySync)
})


// Панель «Очистить данные» — обратный отсчёт как у очистки пожеланий.
const showClearTournamentConfirm = ref(false)
const clearTournamentBusy = ref(false)
const clearTournamentSeconds = ref(3)
let clearTournamentCountdown: ReturnType<typeof setInterval> | null = null

function startClearTournamentCountdown() {
  clearTournamentSeconds.value = 3
  clearTournamentCountdown = setInterval(() => {
    clearTournamentSeconds.value -= 1
    if (clearTournamentSeconds.value <= 0 && clearTournamentCountdown) {
      clearInterval(clearTournamentCountdown)
      clearTournamentCountdown = null
    }
  }, 1000)
}

watch(showClearTournamentConfirm, (open) => {
  if (open) startClearTournamentCountdown()
  else {
    if (clearTournamentCountdown) {
      clearInterval(clearTournamentCountdown)
      clearTournamentCountdown = null
    }
    clearTournamentSeconds.value = 3
  }
})

// На шагах 0–1 после «Очистить данные» прокручиваем к панели подтверждения внизу страницы.
watch(
  showClearTournamentConfirm,
  (open) => {
    if (!open || wizard.step.value === 2) return
    void nextTick(() => {
      clearTournamentBottomAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    })
  },
  { flush: 'post' },
)

onUnmounted(() => {
  if (clearTournamentCountdown) clearInterval(clearTournamentCountdown)
  document.removeEventListener('visibilitychange', onAdminVisibilitySync)
  adminTournamentBc?.close()
  adminTournamentBc = null
})

function cancelClearTournament() {
  showClearTournamentConfirm.value = false
}

async function confirmClearTournament() {
  clearTournamentBusy.value = true
  try {
    await wizard.resetWizard()
    await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
    broadcastAdminTournamentStateChanged()
  } finally {
    clearTournamentBusy.value = false
    showClearTournamentConfirm.value = false
  }
}

const { data: allPlayers, error: playersFetchError, refresh: refreshPlayers } = useFetch<Player[]>('/api/players', {
  default: () => [],
})

// Simple10: Для кнопки «Обновить» делаем единый рефреш: и состояние турнира, и список игроков — так у зрителя и админа всегда «всё свежее».
async function refreshAll() {
  await Promise.all([tournamentState.refresh(), refreshPlayers()])
}

// Шаги мастера для хлебной крошки.
const breadcrumbs = [
  { step: 0, label: 'Игроки' },
  { step: 1, label: 'Команды' },
  { step: 2, label: 'Таблица' },
] as const

// Переход на шаг «Турнирная таблица» с немедленным обновлением state у зрителя.
// Вызывается при клике на кнопку «Переход к турниру» — так зритель сразу видит актуальные команды и составы.
async function goToStandings() {
  wizard.step.value = 2
  // Принудительно инвалидируем кэш state — следующий опрос зрителя вернёт свежие данные.
  await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
}

// После «Завершить турнир»: статус finished уже в мастере — сохраняем для зрителей, затем сразу сбрасываем мастер (выбор игроков), без промежуточной плашки.
async function handleTournamentFinished() {
  await nextTick()
  await wizard.saveCurrentTournamentStateNow()
  await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
  await wizard.resetWizard()
  await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
  broadcastAdminTournamentStateChanged()
}
</script>
