<template>
  <div class="flex min-h-screen flex-col bg-slate-900 text-slate-100 overflow-x-hidden">
    <main class="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-6 px-2 py-4 sm:px-4 sm:py-8">
      <!-- Верхняя строка: заголовок турнира и кнопка входа администратора. -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-slate-50">
            {{ tournamentName || 'Турнир' }}
          </h1>
          <p v-if="tournamentDate" class="mt-1 text-sm text-slate-400">{{ tournamentDate }}</p>
        </div>

        <!-- Кнопка входа администратора остаётся доступной и заметной для владельца. -->
        <button
          type="button"
          class="shrink-0 mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-emerald-500/60 hover:text-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          aria-label="Войти как администратор"
          @click="showLoginModal = true"
        >
          <span aria-hidden="true">🔐</span>
          Войти
        </button>
      </div>

      <!-- Если турнир не запущен, показываем понятную заглушку. -->
      <div
        v-if="!hasViewerData"
        class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-700/60 px-4 py-16 text-center"
      >
        <svg class="h-10 w-10 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          <path d="M2 12h20" />
        </svg>
        <p class="text-slate-500">Турнир ещё не начался</p>
        <p class="text-xs text-slate-600">Данные появятся здесь, когда администратор запустит турнир.</p>
      </div>

      <!-- В режиме зрителя используем тот же компонент, что и у администратора (StepStandings). -->
      <!-- :key привязан к snapshotKey — при изменении данных компонент пересоздаётся с актуальным снапшотом. -->
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
    </main>

    <!-- Модальное окно входа администратора. -->
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
  // Состояние турнира, загруженное с сервера.
  state: SavedTournamentContext | null
  // Все игроки из базы — нужны для отображения составов.
  players: Player[]
}>()

// Флаг показа модального окна входа.
const showLoginModal = ref(false)

// Название турнира для общего заголовка.
const tournamentName = computed(() => props.state?.tournamentName ?? '')

// Дата турнира для общего заголовка.
const tournamentDate = computed(() => props.state?.tournamentDate ?? '')

// Команды берём из сохранённого состояния, чтобы отрисовка совпадала с режимом администратора.
const teams = computed(() => props.state?.confirmedTeamNames ?? [])

// Цвета команд берём из сохранённого состояния, чтобы маркеры были одинаковыми.
const teamColors = computed(() => props.state?.teamColors ?? {})

// Назначение игроков по командам берём из сохранённого состояния.
const assignmentByPlayerId = computed(() => props.state?.assignmentByPlayerId ?? {})

// Снапшот таблицы и матчей передаём как initialSnapshot, чтобы UI восстановился 1-в-1.
const initialSnapshot = computed<SavedStandingsSnapshot | null>(() => props.state?.standingsSnapshot ?? null)

// Ключ для пересоздания StepStandings при изменении данных.
// Берём кол-во сыгранных матчей и имена команд — если что-то изменилось, компонент перемонтируется.
const snapshotKey = computed(() => {
  const matchCount = initialSnapshot.value?.playedMatchesList?.length ?? 0
  const teamKey = teams.value.join(',')
  return `${teamKey}:${matchCount}`
})

// Проверяем, есть ли данные, чтобы показывать полноценный блок с теми же компонентами.
const hasViewerData = computed(() => teams.value.length > 0 || initialSnapshot.value !== null)

// В viewer-режиме изменения не должны происходить, но обработчик нужен для совместимости API компонента.
function onViewerSnapshotUpdate(_snapshot: SavedStandingsSnapshot) {
  // Здесь ничего не делаем, потому что viewer не сохраняет изменения.
}

// В viewer-режиме завершение турнира недоступно, но событие оставляем для совместимости.
function onViewerTournamentFinished() {
  // Здесь ничего не делаем, потому что viewer не может завершать турнир.
}
</script>
