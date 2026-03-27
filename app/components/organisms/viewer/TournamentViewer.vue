<template>
  <div class="flex min-h-screen flex-col bg-slate-900 text-slate-100">
    <!-- Шапка: sticky, safe-area сверху, минимальная высота 56px для удобного тапа -->
    <header
      class="sticky top-0 z-20 border-b border-slate-800/70 bg-slate-900/95 backdrop-blur-md"
      style="padding-top: env(safe-area-inset-top)"
    >
      <div class="mx-auto flex w-full min-w-0 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6 h-14">
        <div class="min-w-0 flex-1">
          <h1 class="truncate text-base font-bold text-slate-50 sm:text-lg leading-tight">
            {{ tournamentName || 'Турнир' }}
          </h1>
          <p v-if="tournamentDate" class="truncate text-xs text-slate-400 leading-tight mt-0.5">
            {{ tournamentDate }}
          </p>
        </div>

        <!-- Кнопка «Войти»: минимум 44×44px для удобного тапа на телефоне -->
        <button
          type="button"
          class="shrink-0 inline-flex h-11 items-center gap-2 rounded-xl border border-slate-600/80 bg-slate-800 px-4 text-sm font-medium text-slate-200 transition-colors hover:border-emerald-500/60 hover:text-emerald-300 active:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          aria-label="Войти как администратор"
          @click="showLoginModal = true"
        >
          <span aria-hidden="true">🔐</span>
          Войти
        </button>
      </div>
    </header>

    <!-- main всегда присутствует в DOM — стабильный каркас без прыжков при refresh -->
    <main class="mx-auto flex w-full min-w-0 max-w-4xl flex-1 flex-col px-4 sm:px-6">
      <div class="flex flex-1 flex-col py-5 sm:py-8">
        <!-- Заглушка «турнир не начался» — центрируется по вертикали в оставшемся пространстве -->
        <div
          v-if="!hasViewerData"
          class="flex flex-1 items-center justify-center"
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

const props = defineProps<{
  state: SavedTournamentContext | null
  players: Player[]
}>()

const showLoginModal = ref(false)

const tournamentName = computed(() => props.state?.tournamentName ?? '')
const tournamentDate = computed(() => props.state?.tournamentDate ?? '')
const teams = computed(() => props.state?.confirmedTeamNames ?? [])
const teamColors = computed(() => props.state?.teamColors ?? {})
const assignmentByPlayerId = computed(() => props.state?.assignmentByPlayerId ?? {})
const initialSnapshot = computed<SavedStandingsSnapshot | null>(() => props.state?.standingsSnapshot ?? null)

const snapshotKey = computed(() => {
  const matchCount = initialSnapshot.value?.playedMatchesList?.length ?? 0
  const teamKey = teams.value.join(',')
  return `${teamKey}:${matchCount}`
})

const hasViewerData = computed(() => teams.value.length > 0 || initialSnapshot.value !== null)

function onViewerSnapshotUpdate(_snapshot: SavedStandingsSnapshot) {}
function onViewerTournamentFinished() {}
</script>
