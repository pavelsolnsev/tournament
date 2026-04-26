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
                <AtomsHeaderRefreshButton :busy="false" @click="reloadWithScrollRestore" />
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
            <!-- До onMounted держим тот же узел, что на SSR: иначе pending useFetch на сервере и payload на клиенте дают разный v-if и ломают гидрацию. -->
            <div v-if="!adminClientShellReady || !wizard.stateRestored.value" class="flex flex-1 items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-400">
              <div
                class="app-loader-ring h-9 w-9 shrink-0 rounded-full border-2 border-slate-300 border-t-emerald-500 dark:border-slate-700 dark:border-t-emerald-400"
                aria-hidden="true"
              />
              <span>Загрузка…</span>
            </div>

            <section v-else class="flex w-full flex-col gap-6 py-5 sm:py-8">
              <!-- Все три крошки всегда: можно вернуться на «Игроки» с «Таблицы» и сразу увидеть «Таблица» на шаге «Команды». -->
              <nav v-if="!isLimitedAdmin" aria-label="Шаги мастера">
                <ol class="flex min-w-0 flex-wrap items-center gap-1">
                  <li
                    v-for="(crumb, idx) in breadcrumbs"
                    :key="crumb.step"
                    class="flex items-center gap-1"
                  >
                    <span
                      v-if="idx > 0"
                      class="select-none text-slate-400 dark:text-slate-700"
                      aria-hidden="true"
                    >/</span>

                    <button
                      v-if="crumb.step !== wizard.step.value"
                      type="button"
                      class="inline-flex items-center rounded-lg px-2 py-1 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                      :class="isBreadcrumbStepEnabled(crumb.step)
                        ? 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200'
                        : 'cursor-not-allowed text-slate-400 opacity-60 dark:text-slate-600'"
                      :disabled="!isBreadcrumbStepEnabled(crumb.step)"
                      :title="breadcrumbDisabledTitle(crumb.step)"
                      @click="navigateBreadcrumb(crumb.step)"
                    >
                      {{ crumb.label }}
                    </button>

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

                <OrganismsTournamentStepVkListStartPanel
                  v-if="wizard.step.value === 0"
                  :clear-tournament-busy="clearTournamentBusy"
                  @cancel-tournament="handleVkCancelTournament"
                />

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
                  :tournament-sync-busy="tournamentSyncBusy"
                  @sync-tournament-from-server="onTournamentSyncFromRosterPanel"
                  :paid-player-ids="paidPlayerIdsView"
                  :vk-list-tournament="wizard.vkListTournament.value"
                  :vk-team-label-by-player-id="wizard.vkTeamLabelByPlayerId.value"
                  :vk-team-slots="wizard.vkTeamSlots.value"
                  @set-player-vk-team="(id, t) => wizard.setPlayerVkTeam(id, t)"
                  @add-vk-team-slot="(n) => wizard.addVkTeamSlot(n)"
                  @remove-vk-team-slot="(v, l) => wizard.removeVkTeamSlot(l)"
                  @toggle-player-paid="onTogglePlayerPaid"
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
                :fetch-remote-standings-snapshot="fetchRemoteStandingsSnapshotForMerge"
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
                  :subtitle="clearTournamentError || undefined"
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
      :on-refresh="reloadWithScrollRestore"
    />

</div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import { computed, watch } from 'vue'
import { useAdminAuth } from '~/composables/useAdminAuth'
import { useTournamentWizard } from '~/composables/useTournamentWizard'
import { useTournamentWizardBreadcrumbs } from '~/composables/useTournamentWizardBreadcrumbs'
import { useAdminTournamentPlayerPaidSync } from '~/composables/useAdminTournamentPlayerPaidSync'
import { useIndexPageSeo } from '~/composables/useIndexPageSeo'
import { TOURNAMENT_STATE_NUXT_KEY, useTournamentState } from '~/composables/useTournamentState'
import { reloadWithScrollRestore } from '~/utils/reloadWithScrollRestore'
import { isTournamentVisuallyCleared } from '~/utils/tournamentClearVerify'

definePageMeta({ layout: 'landing' })

useIndexPageSeo()

const { isAdmin, adminRole, logout, restoreSession } = useAdminAuth()

// Simple10: «Очистить данные» — опасная операция, доступна только полному админу.
const canClearTournament = computed(() => adminRole.value === 'full')

// Simple10: Ограниченный админ (limited) должен видеть только раздел «Таблица».
const isLimitedAdmin = computed(() => adminRole.value === 'limited')

// Канал между вкладками админки: после «Завершить турнир» / «Очистить данные» остальные вкладки подтягивают state из БД.
const ADMIN_TOURNAMENT_BC = 'football-tournament-admin-sync'
let adminTournamentBc: BroadcastChannel | null = null

// Флаг: клиент прошёл mount — до этого админский main совпадает с SSR (спиннер), чтобы не было hydration mismatch.
const adminClientShellReady = ref(false)

// После гидрации мягко подтверждаем сессию из cookie — это убирает редкие рассинхроны между SSR и клиентом.
onMounted(() => {
  adminClientShellReady.value = true
  restoreSession()
})

const clearTournamentBottomAnchor = useTemplateRef<HTMLDivElement>('clearTournamentBottomAnchor')

const tournamentState = useTournamentState()

// Перед «Завершить матч» / «Следующий матч» подмешиваем отметки из БД с других устройств.
async function fetchRemoteStandingsSnapshotForMerge() {
  await tournamentState.refresh()
  return tournamentState.serverState.value?.standingsSnapshot ?? null
}

const wizard = useTournamentWizard(tournamentState)

/** Пустой мастер: без таймерных GET /api/tournament/state; после появления состава или vkListTournament — поллинг включается. */
const rosterSyncRelevant = computed(
  () => wizard.vkListTournament.value === true || wizard.selectedPlayers.value.length > 0,
)

const viewerState = computed(() => tournamentState.serverState.value)

// Один refetch на возврате на вкладку: и зритель, и админ; для админа — ещё reapply (как в syncWizardFromServerAfterExternalChange).
function onTabVisibilitySync() {
  if (document.visibilityState !== 'visible') return
  tournamentState.cancelPendingSave()
  void (async () => {
    await tournamentState.resyncAfterTabBecameVisible()
    if (isAdmin.value) {
      await nextTick()
      wizard.reapplyFromServer()
    }
  })()
}

// Обновляем кэш Nuxt и перезаливаем refs мастера из serverState — без этого вторая вкладка остаёт со старым UI.
async function syncWizardFromServerAfterExternalChange() {
  if (!isAdmin.value) return
  // Иначе отложенный PUT этой вкладки может перезаписать то, что только что сделала другая.
  tournamentState.cancelPendingSave()
  await tournamentState.refresh()
  await nextTick()
  wizard.reapplyFromServer()
}

const tournamentSyncBusy = ref(false)

async function onTournamentSyncFromRosterPanel() {
  if (!isAdmin.value || tournamentSyncBusy.value) return
  tournamentSyncBusy.value = true
  try {
    await syncWizardFromServerAfterExternalChange()
  } finally {
    tournamentSyncBusy.value = false
  }
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

const { paidPlayerIdsView, onTogglePlayerPaid } = useAdminTournamentPlayerPaidSync({
  wizard: {
    paidPlayerIds: wizard.paidPlayerIds,
    setPlayerPaid: wizard.setPlayerPaid,
    step: wizard.step,
    rosterSyncRelevant,
  },
  isAdmin,
  isLimitedAdmin,
  syncWizardFromServerAfterExternalChange,
  broadcastAdminTournamentStateChanged,
})

let adminRosterPoll: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (!import.meta.client) return
  document.addEventListener('visibilitychange', onTabVisibilitySync)
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
})

// Шаг «Игроки»: периодически тянем state только при rosterSyncRelevant; в пустом мастере — только sync по вкладке / BroadcastChannel / после сохранений.
const ADMIN_ROSTER_POLL_MS = 12_000

watch(
  [isAdmin, isLimitedAdmin, () => wizard.step.value, rosterSyncRelevant],
  () => {
    if (adminRosterPoll) {
      clearInterval(adminRosterPoll)
      adminRosterPoll = null
    }
    if (!import.meta.client) return
    if (!isAdmin.value || isLimitedAdmin.value) return
    if (wizard.step.value !== 0) return
    if (!rosterSyncRelevant.value) return
    adminRosterPoll = setInterval(() => {
      void tournamentState.refresh()
    }, ADMIN_ROSTER_POLL_MS)
  },
  { immediate: true },
)


// Панель «Очистить данные» — обратный отсчёт как у очистки пожеланий.
const showClearTournamentConfirm = ref(false)
const clearTournamentBusy = ref(false)
const clearTournamentError = ref<string | null>(null)
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
  if (open) {
    clearTournamentError.value = null
    startClearTournamentCountdown()
  }
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
  if (adminRosterPoll) {
    clearInterval(adminRosterPoll)
    adminRosterPoll = null
  }
  document.removeEventListener('visibilitychange', onTabVisibilitySync)
  adminTournamentBc?.close()
  adminTournamentBc = null
})

function cancelClearTournament() {
  showClearTournamentConfirm.value = false
}

async function handleVkCancelTournament() {
  if (!canClearTournament.value) return
  clearTournamentBusy.value = true
  clearTournamentError.value = null
  try {
    tournamentState.cancelPendingSave()
    await $fetch('/api/tournament/vk-unlink-and-reset', {
      method: 'POST',
      credentials: 'include',
    })
    await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
    await tournamentState.refresh()
    await nextTick()
    wizard.reapplyFromServer()
    broadcastAdminTournamentStateChanged()
    if (import.meta.client) {
      window.dispatchEvent(new CustomEvent('football-vk-status-refresh'))
      window.dispatchEvent(new CustomEvent('football-vk-status-schedule-followup'))
    }
  } catch (e) {
    if (import.meta.dev) console.error('[vk-unlink-and-reset]', e)
    clearTournamentError.value =
      (e as { data?: { statusMessage?: string }; statusMessage?: string })?.data?.statusMessage
      ?? (e as { statusMessage?: string })?.statusMessage
      ?? 'Не удалось отменить матч. Попробуйте ещё раз.'
  } finally {
    clearTournamentBusy.value = false
  }
}

async function confirmClearTournament() {
  clearTournamentBusy.value = true
  clearTournamentError.value = null
  const maxAttempts = 5
  let lastError: unknown
  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        tournamentState.cancelPendingSave()
        await wizard.resetWizard()
        await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
        await tournamentState.refresh()
        await nextTick()
        if (!isTournamentVisuallyCleared(tournamentState.serverState.value)) {
          throw new Error('clear-verify: server state not empty after reset')
        }
        broadcastAdminTournamentStateChanged()
        showClearTournamentConfirm.value = false
        lastError = undefined
        break
      } catch (e) {
        lastError = e
        if (import.meta.dev) console.error(`[clear-tournament] attempt ${attempt}/${maxAttempts}:`, e)
        if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 180 * attempt))
      }
    }
    if (lastError != null) {
      clearTournamentError.value = 'Не удалось очистить данные. Попробуйте ещё раз.'
    }
  } finally {
    clearTournamentBusy.value = false
  }
}

const { data: allPlayers, error: playersFetchError, refresh: refreshPlayers } = useFetch<Player[]>('/api/players', {
  default: () => [],
})

// Переход на шаг «Турнирная таблица» с немедленным обновлением state у зрителя.
// Вызывается при клике на кнопку «Переход к турниру» — так зритель сразу видит актуальные команды и составы.
async function goToStandings() {
  wizard.step.value = 2
  // Принудительно инвалидируем кэш state — следующий опрос зрителя вернёт свежие данные.
  await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
}

const { breadcrumbs, isBreadcrumbStepEnabled, breadcrumbDisabledTitle, navigateBreadcrumb } =
  useTournamentWizardBreadcrumbs(wizard, goToStandings)

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
