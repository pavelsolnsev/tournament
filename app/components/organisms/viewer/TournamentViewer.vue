<template>
  <!-- min-h-full вместо min-h-screen — высота от #scroll-root (fixed контейнера). -->
  <div class="flex min-h-full flex-col bg-slate-900 text-slate-100">
    <!-- Шапка: absolute + safe-area сверху, не двигает контент -->
    <header class="absolute inset-x-0 top-0 z-20 border-b border-slate-800/70 bg-slate-900/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div class="mx-auto flex w-full min-w-0 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6 h-14">
        <div class="min-w-0 flex-1 flex items-center gap-2.5">
          <div class="min-w-0">
            <h1 class="truncate text-base font-bold text-slate-50 sm:text-lg leading-tight">
              {{ tournamentName || 'Турнир' }}
            </h1>
            <p v-if="tournamentDate" class="truncate text-xs text-slate-400 leading-tight mt-0.5">
              {{ tournamentDate }}
            </p>
          </div>

          <!-- Бейдж статуса — сразу видно идёт ли матч сейчас -->
          <AtomsMatchStatusBadge
            v-if="matchStatus"
            :status="matchStatus"
            class="shrink-0"
          />
        </div>

        <!-- Кнопка «Войти»: спокойная (для владельца), но с нормальной тач-зоной -->
        <button
          type="button"
          class="shrink-0 inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200 active:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          aria-label="Войти как администратор"
          @click="onAdminEnter"
        >
          <span aria-hidden="true">🔐</span>
          Войти
        </button>
      </div>

      <!-- Строка с текущими командами Live-матча — показывается только когда матч идёт -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out overflow-hidden"
        enter-from-class="max-h-0 opacity-0"
        enter-to-class="max-h-16 opacity-100"
        leave-active-class="transition-all duration-200 ease-in overflow-hidden"
        leave-from-class="max-h-16 opacity-100"
        leave-to-class="max-h-0 opacity-0"
      >
        <div
          v-if="matchStatus === 'live' && liveHomeTeam && liveAwayTeam"
          class="border-t border-red-500/20 bg-red-500/5"
        >
          <div class="mx-auto flex w-full min-w-0 max-w-4xl items-center justify-center gap-3 px-4 sm:px-6 py-1.5">
            <!-- Название домашней команды -->
            <span class="min-w-0 truncate text-right text-sm font-semibold text-slate-100 flex-1">
              {{ liveHomeTeam }}
            </span>
            <!-- Разделитель "vs" -->
            <span class="shrink-0 text-xs font-bold text-red-400 uppercase tracking-widest">vs</span>
            <!-- Название гостевой команды -->
            <span class="min-w-0 truncate text-left text-sm font-semibold text-slate-100 flex-1">
              {{ liveAwayTeam }}
            </span>
          </div>
        </div>
      </Transition>
    </header>

    <!-- main всегда присутствует в DOM — стабильный каркас без прыжков при refresh -->
    <!-- Отступ сверху увеличивается на высоту live-строки (примерно 36px = 2.25rem) когда матч идёт -->
    <main
      class="mx-auto flex w-full min-w-0 max-w-4xl flex-1 flex-col px-4 sm:px-6 transition-[padding] duration-300"
      :class="matchStatus === 'live' && liveHomeTeam && liveAwayTeam
        ? 'pt-[calc(theme(spacing.14)+env(safe-area-inset-top)+2.25rem)]'
        : 'pt-[calc(theme(spacing.14)+env(safe-area-inset-top))]'"
    >
      <div class="flex flex-1 flex-col py-5 sm:py-8">
        <!-- Заглушка «турнир не начался» — сверху, как обычный контент -->
        <div
          v-if="!hasViewerData"
          class="flex flex-col"
        >
          <div class="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-700/60 px-6 py-16 text-center">
            <svg class="h-10 w-10 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              <path d="M2 12h20" />
            </svg>
            <div>
              <p class="font-medium text-slate-400">Турнир ещё не начался</p>
              <p class="mt-1 text-sm text-slate-600">Данные появятся здесь, когда администратор запустит турнир.</p>
            </div>
          </div>
        </div>

        <!-- Таблица зрителя -->
        <OrganismsTournamentStepStandings
          v-else
          :key="snapshotKey"
          :tournament-name="tournamentName"
          :tournament-date="tournamentDate"
          :teams="teams"
          :team-colors="teamColors"
          :players="players"
          :assignment-by-player-id="assignmentByPlayerId"
          :initial-snapshot="initialSnapshot"
          :readonly="true"
          @update:snapshot="onViewerSnapshotUpdate"
          @tournament-finished="onViewerTournamentFinished"
        />
      </div>
    </main>

    <!-- Модальное окно входа администратора -->
    <OrganismsAdminLoginModal
      v-if="showLoginModal"
      @close="showLoginModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { SavedTournamentContext } from '~/composables/useTournamentWizard'
import type { SavedStandingsSnapshot } from '~/composables/useTournamentWizard'
import { useAdminAuth } from '~/composables/useAdminAuth'

const props = defineProps<{
  state: SavedTournamentContext | null
  players: Player[]
}>()

const showLoginModal = ref(false)
const { restoreSession } = useAdminAuth()

function onAdminEnter() {
  // Если сессия уже есть — входим сразу, без пароля.
  if (restoreSession()) return
  showLoginModal.value = true
}

const tournamentName = computed(() => props.state?.tournamentName ?? '')
const tournamentDate = computed(() => props.state?.tournamentDate ?? '')
const teams = computed(() => props.state?.confirmedTeamNames ?? [])
const teamColors = computed(() => props.state?.teamColors ?? {})
const assignmentByPlayerId = computed(() => props.state?.assignmentByPlayerId ?? {})
const initialSnapshot = computed<SavedStandingsSnapshot | null>(() => props.state?.standingsSnapshot ?? null)

// Статус матча — upcoming / live / finished. По умолчанию upcoming если данных нет.
const matchStatus = computed(() => props.state?.matchStatus ?? 'upcoming')
// Команды текущего live-матча — отображаем в шапке когда статус Live.
const liveHomeTeam = computed(() => props.state?.liveHomeTeam ?? '')
const liveAwayTeam = computed(() => props.state?.liveAwayTeam ?? '')

const snapshotKey = computed(() => {
  const matchCount = initialSnapshot.value?.playedMatchesList?.length ?? 0
  const teamKey = teams.value.join(',')
  return `${teamKey}:${matchCount}`
})

const hasViewerData = computed(() => teams.value.length > 0 || initialSnapshot.value !== null)

function onViewerSnapshotUpdate(_snapshot: SavedStandingsSnapshot) {}
function onViewerTournamentFinished() {}
</script>
