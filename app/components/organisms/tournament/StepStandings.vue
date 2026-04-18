<!-- Компонент StepStandings: таблица, составы со статистикой, сыгранные матчи и управление матчем — отдельными блоками. -->
<template>
  <div
    class="min-w-0 space-y-4"
    :class="props.readonly !== true && !hideCountdownTimerBar && 'pb-24'"
  >
    <!-- Блок 1: турнирная таблица -->
    <div
      class="overflow-hidden rounded-2xl border bg-slate-50 dark:bg-slate-900/60 transition-colors"
      :class="isStandingsBlockOpen ? 'border-slate-300 dark:border-slate-700/60' : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/50'"
    >
      <button
        :id="standingsToggleId"
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        :class="isStandingsBlockOpen ? 'bg-slate-50 dark:bg-slate-800/80' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'"
        :aria-expanded="isStandingsBlockOpen"
        :aria-controls="standingsPanelId"
        @click="isStandingsBlockOpen = !isStandingsBlockOpen"
      >
        <div class="min-w-0 flex-1">
          <span class="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Таблица
            <span
              class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              :class="isStandingsBlockOpen ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'"
            >
              {{ isStandingsBlockOpen ? 'Открыт' : 'Скрыт' }}
            </span>
          </span>
          <span
            v-if="tournamentName"
            class="mt-0.5 block truncate text-xs text-slate-600 dark:text-slate-500"
          >
            {{ tournamentName }}
          </span>
        </div>
        <svg
          class="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-400 transition-transform duration-200"
          :class="isStandingsBlockOpen && 'rotate-180'"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <Transition
        enter-active-class="transition-all duration-200 ease-out overflow-hidden"
        enter-from-class="max-h-0 opacity-0"
        enter-to-class="max-h-[120rem] opacity-100"
        leave-active-class="transition-all duration-150 ease-in overflow-hidden"
        leave-from-class="max-h-[120rem] opacity-100"
        leave-to-class="max-h-0 opacity-0"
        @after-enter="scrollExpandedPanelIntoView"
      >
        <div
          v-if="isStandingsBlockOpen"
          :id="standingsPanelId"
          role="region"
          :aria-labelledby="standingsToggleId"
          class="pt-1"
        >
          <AtomsEmptyStateBox v-if="teams.length === 0" align="center" size="sm" root-class="mx-4 mb-4">
            Пока нет команд — добавьте и подтвердите их, чтобы появилась таблица.
          </AtomsEmptyStateBox>
          <AtomsEmptyStateBox v-else-if="standingsRows.length === 0" align="center" size="sm" root-class="mx-4 mb-4">
            Таблица пока пустая — сыграйте хотя бы один матч.
          </AtomsEmptyStateBox>
          <OrganismsTournamentStepStandingsHero
            v-else
            :tournament-name="tournamentName"
            :teams="teams"
            :standings-rows="standingsRows"
            :effective-team-colors="effectiveTeamColors"
            :show-heading="false"
          />
        </div>
      </Transition>
    </div>

    <!-- Блок 2: составы и накопленная статистика игроков -->
    <div
      class="overflow-hidden rounded-2xl border bg-slate-50 dark:bg-slate-900/60 transition-colors"
      :class="isRosterTotalsOpen ? 'border-slate-300 dark:border-slate-700/60' : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/50'"
    >
      <button
        :id="rosterTotalsToggleId"
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        :class="isRosterTotalsOpen ? 'bg-slate-50 dark:bg-slate-800/80' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'"
        :aria-expanded="isRosterTotalsOpen"
        :aria-controls="rosterTotalsPanelId"
        @click="isRosterTotalsOpen = !isRosterTotalsOpen"
      >
        <span class="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          Составы
          <span
            class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            :class="isRosterTotalsOpen ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'"
          >
            {{ isRosterTotalsOpen ? 'Открыт' : 'Скрыт' }}
          </span>
        </span>
        <svg
          class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200"
          :class="isRosterTotalsOpen && 'rotate-180'"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <Transition
        enter-active-class="transition-all duration-200 ease-out overflow-hidden"
        enter-from-class="max-h-0 opacity-0"
        enter-to-class="max-h-[120rem] opacity-100"
        leave-active-class="transition-all duration-150 ease-in overflow-hidden"
        leave-from-class="max-h-[120rem] opacity-100"
        leave-to-class="max-h-0 opacity-0"
        @after-enter="scrollExpandedPanelIntoView"
      >
        <div
          v-if="isRosterTotalsOpen"
          :id="rosterTotalsPanelId"
          role="region"
          :aria-labelledby="rosterTotalsToggleId"
          class="pt-1"
        >
          <AtomsEmptyStateBox v-if="teams.length === 0" align="center" size="sm" root-class="mx-4 mb-4">
            Пока нет команд — составы появятся после подтверждения команд.
          </AtomsEmptyStateBox>
          <OrganismsTournamentStepStandingsTeamRosterTotals
            v-else
            :teams="teams"
            :players-by-team="playersByTeam"
            :team-marker="teamMarker"
            :display-player-label="displayPlayerLabel"
            :aggregate-player-stats="aggregatePlayerStats"
            :player-rating-deltas="playerRatingDeltas"
            :hide-base-player-rating="hideBasePlayerRating"
            :show-heading="false"
          />
        </div>
      </Transition>
    </div>

    <!-- Блок 3: результаты матчей + управление текущим матчем -->
    <section class="min-w-0 space-y-4">
      <div
        class="overflow-hidden rounded-2xl border bg-slate-50 dark:bg-slate-900/60 transition-colors"
        :class="isPlayedMatchesOpen ? 'border-slate-300 dark:border-slate-700/60' : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/50'"
      >
        <button
          :id="playedMatchesToggleId"
          type="button"
          class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          :class="isPlayedMatchesOpen ? 'bg-slate-50 dark:bg-slate-800/80' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'"
          :aria-expanded="isPlayedMatchesOpen"
          :aria-controls="playedMatchesPanelId"
          @click="isPlayedMatchesOpen = !isPlayedMatchesOpen"
        >
          <span class="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Результаты
            <span
              class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              :class="isPlayedMatchesOpen ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'"
            >
              {{ isPlayedMatchesOpen ? 'Открыт' : 'Скрыт' }}
            </span>
          </span>
          <div class="flex shrink-0 items-center gap-2">
            <span
              v-if="playedMatchesList.length > 0"
              class="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-400"
            >
              {{ playedMatchesList.length }}
            </span>
            <svg
              class="h-5 w-5 text-slate-400 transition-transform duration-200"
              :class="isPlayedMatchesOpen && 'rotate-180'"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        </button>

        <Transition
          enter-active-class="transition-all duration-200 ease-out overflow-hidden"
          enter-from-class="max-h-0 opacity-0"
          enter-to-class="max-h-[120rem] opacity-100"
          leave-active-class="transition-all duration-150 ease-in overflow-hidden"
          leave-from-class="max-h-[120rem] opacity-100"
          leave-to-class="max-h-0 opacity-0"
          @after-enter="scrollExpandedPanelIntoView"
        >
          <div
            v-if="isPlayedMatchesOpen"
            :id="playedMatchesPanelId"
            role="region"
            :aria-labelledby="playedMatchesToggleId"
          >
            <!-- В деталях и редакторе матча рейтинг не нужен — передаём версию без него. -->
            <OrganismsTournamentStepStandingsPlayedMatches
              :played-matches-list="playedMatchesList"
              :team-marker="teamMarker"
              :team-color-by-name="effectiveTeamColors"
              :players-by-team="playersByTeam"
              :display-player-label="displayPlayerLabelWithoutRating"
              :player-avatars-by-id="playerAvatarsById"
              :update-played-match="updatePlayedMatch"
              :delete-played-match="deletePlayedMatch"
              :show-heading="false"
              :readonly="props.readonly === true"
            />
          </div>
        </Transition>
      </div>

      <OrganismsTournamentStepStandingsMatchManagement
        v-if="props.readonly !== true"
        :teams="teams"
        :home-team="homeTeam"
        :away-team="awayTeam"
        :home-goals="homeGoals"
        :away-goals="awayGoals"
        :has-next-match="hasNextMatch"
        :can-finish-match="canFinishMatch"
        :has-played-matches="playedMatchesList.length > 0"
        :players-by-team="playersByTeam"
        :team-marker="teamMarker"
        :effective-team-colors="effectiveTeamColors"
        :display-player-label="displayPlayerLabel"
        :is-active-player="isActivePlayer"
        :select-player-for-mark="selectPlayerForMark"
        :player-stat="playerStat"
        :on-select-action="onSelectAction"
        :add-player-event="addPlayerEvent"
        :remove-player-event="removePlayerEvent"
        :go-to-next-match="handleGoToNextMatch"
        :reset-match-stats="resetMatchStats"
        :reset-tournament-marks="handleResetTournamentMarks"
        :finish-match="handleFinishMatch"
        :finish-tournament-status="finishStatus"
        :finish-tournament-error="finishErrorMessage"
        :on-finish-tournament="handleFinishTournament"
        :show-clear-tournament-confirm="props.showClearTournamentConfirm"
        :clear-tournament-seconds-left="props.clearTournamentSecondsLeft"
        :clear-tournament-busy="props.clearTournamentBusy"
        @update:home-team="handleUpdateHomeTeam"
        @update:away-team="handleUpdateAwayTeam"
        @clear-tournament="emit('clear-tournament')"
        @cancel-clear-tournament="emit('cancel-clear-tournament')"
        @confirm-clear-tournament="emit('confirm-clear-tournament')"
      />

    </section>

    <!-- Таймер матча только при ведении турнира (не в режиме зрителя). -->
    <MoleculesMatchCountdownTimerBar v-if="props.readonly !== true && !hideCountdownTimerBar" />
  </div>
</template>

<script setup lang="ts">
import type { Player, MatchStatus } from '~/types/tournament'
import type { SavedStandingsSnapshot } from '~/composables/useTournamentWizard'
import { useTournamentStandingsRefactored } from '~/composables/useTournamentStandingsRefactored'
import { useFinishTournament } from '~/composables/useFinishTournament'
import { displayPlayerLabelWithoutRating } from '~/composables/usePlayerDisplay'
import { useAdminAuth } from '~/composables/useAdminAuth'
import { TOURNAMENT_STATE_NUXT_KEY } from '~/composables/useTournamentState'
import { scrollExpandedPanelIntoView } from '~/utils/scrollExpandedPanelIntoView'

// Этот шаг показывает матчи и турнирную таблицу.
const props = defineProps<{
  tournamentName: string
  tournamentDate: string
  venueLabel?: string
  formatLabel?: string
  teams: string[]
  teamColors: Record<string, number>
  players: Player[]
  assignmentByPlayerId: Record<number, string>
  // Начальный снапшот из куки — восстанавливает матчи и таблицу после обновления страницы.
  initialSnapshot?: SavedStandingsSnapshot | null
  // Режим только чтения: одинаковый UI без действий управления.
  readonly?: boolean
  // Данные для кнопки «Очистить данные» внутри блока Управление.
  showClearTournamentConfirm: boolean
  clearTournamentSecondsLeft: number
  clearTournamentBusy: boolean
  /** Перед финализацией матча подтягиваем снапшот с сервера и сливаем отметки (несколько устройств). */
  fetchRemoteStandingsSnapshot?: () => Promise<SavedStandingsSnapshot | null>
}>()

// Simple10: Ограниченный админ (limited) не должен видеть панель таймера внизу.
const { adminRole } = useAdminAuth()
const hideCountdownTimerBar = computed(() => adminRole.value === 'limited')

const emit = defineEmits<{
  // Вызывается при каждом изменении матчей/таблицы — родитель сохраняет снапшот в куку.
  'update:snapshot': [snapshot: SavedStandingsSnapshot]
  // Вызывается после успешного завершения турнира — родитель сбрасывает wizard.
  'tournament-finished': []
  // Статус матча изменился — родитель (wizard) должен сохранить его в БД.
  'update:matchStatus': [status: MatchStatus, homeTeam: string, awayTeam: string]
  // Пробрасываем события сброса турнира от MatchManagement наверх к index.vue.
  'clear-tournament': []
  'cancel-clear-tournament': []
  'confirm-clear-tournament': []
}>()

const {
  effectiveTeamColors,
  teamMarker,
  standingsRows,
  playedMatchesList,
  hasNextMatch,
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
  canFinishMatch,
  playersByTeam,
  selectPlayerForMark,
  isActivePlayer,
  playerStat,
  onSelectAction,
  addPlayerEvent,
  removePlayerEvent,
  updatePlayedMatch,
  deletePlayedMatch,
  resetMatchStats,
  resetTournamentMarks,
  finishMatch,
  goToNextMatch,
  mergeCurrentMatchFromRemoteSnapshot,
  displayPlayerLabel,
  aggregatePlayerStats,
  playerRatingDeltas,
} = useTournamentStandingsRefactored(
  {
    teams: props.teams,
    teamColors: props.teamColors,
    players: props.players,
    assignmentByPlayerId: props.assignmentByPlayerId,
  },
  {
    // Передаём сохранённое состояние — composable восстановит таблицу и матчи из него.
    initialSnapshot: props.initialSnapshot,
    // Когда что-то меняется — сообщаем родителю, чтобы он сохранил в куку.
    onSnapshot: (snapshot) => emit('update:snapshot', snapshot),
  },
)
// Здесь подключаем логику турнира и достаём нужные refs/функции для UI.

// id → фото и имя для аватаров в деталях сыгранного матча (там в матче только MarkedPlayer).
const playerAvatarsById = computed(() => {
  const out: Record<number, { photo: string | null; name: string }> = {}
  for (const p of props.players) {
    out[p.id] = { photo: p.photo ?? null, name: p.name }
  }
  return out
})

// В «Составах» убираем «⭐️ N», когда уже есть сыгранные матчи или выбрана пара команд (идёт матч).
const hideBasePlayerRating = computed(
  () =>
    playedMatchesList.value.length > 0 || Boolean(homeTeam.value && awayTeam.value),
)

const standingsUid = useId?.() ?? Math.random().toString(36).slice(2)
const standingsToggleId = `standings-block-toggle-${standingsUid}`
const standingsPanelId = `standings-block-panel-${standingsUid}`
const rosterTotalsToggleId = `roster-totals-toggle-${standingsUid}`
const rosterTotalsPanelId = `roster-totals-panel-${standingsUid}`
const playedMatchesToggleId = `played-matches-toggle-${standingsUid}`
const playedMatchesPanelId = `played-matches-panel-${standingsUid}`

// Для зрителя (readonly) турнирная таблица открыта сразу — основное видно без клика.
const isStandingsBlockOpen = ref(props.readonly === true)
// Составы и статистика — отдельная карточка, по умолчанию свёрнута.
const isRosterTotalsOpen = ref(false)
const isPlayedMatchesOpen = ref(false)

async function handleUpdateHomeTeam(next: string) {
  homeTeam.value = next
  // Если обе команды выбраны — матч идёт сейчас. Иначе — ожидается.
  if (homeTeam.value && awayTeam.value) {
    emit('update:matchStatus', 'live', homeTeam.value, awayTeam.value)
    // Сразу обновляем payload state — зритель без задержки увидит выбранную пару команд.
    await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
  } else {
    emit('update:matchStatus', 'upcoming', '', '')
  }
}
// Это обновляет домашнюю команду, когда пользователь меняет select в дочернем UI.

async function handleUpdateAwayTeam(next: string) {
  awayTeam.value = next
  // Если обе команды выбраны — матч идёт сейчас. Иначе — ожидается.
  if (homeTeam.value && awayTeam.value) {
    emit('update:matchStatus', 'live', homeTeam.value, awayTeam.value)
    // Сразу обновляем payload state — зритель без задержки увидит выбранную пару команд.
    await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
  } else {
    emit('update:matchStatus', 'upcoming', '', '')
  }
}
// Это обновляет гостевую команду, когда пользователь меняет select в дочернем UI.

async function pullRemoteMarksIntoCurrentMatch() {
  if (!props.fetchRemoteStandingsSnapshot) return
  try {
    const remote = await props.fetchRemoteStandingsSnapshot()
    mergeCurrentMatchFromRemoteSnapshot(remote)
  } catch {
    /* сеть: финализируем хотя бы локальные отметки */
  }
}

async function handleFinishMatch() {
  await pullRemoteMarksIntoCurrentMatch()
  // Ставим статус finished ДО сброса команд внутри finishMatch(), чтобы зритель успел увидеть «Завершён».
  if (homeTeam.value && awayTeam.value) {
    emit('update:matchStatus', 'finished', homeTeam.value, awayTeam.value)
  } else {
    emit('update:matchStatus', 'finished', '', '')
  }
  finishMatch()
  // Сразу отдаём зрителю результат матча — не ждём очередного поллинга.
  await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
}

async function handleResetTournamentMarks() {
  // Simple10: Сбрасываем результаты и отметки, но не трогаем команды/игроков турнира.
  resetTournamentMarks()
  emit('update:matchStatus', 'upcoming', '', '')
  // Simple10: Сразу обновляем payload state — зритель увидит сброс без ожидания поллинга.
  await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
}
// Этот обработчик централизует статус: после нажатия «Завершить матч» он остаётся finished,
// даже если админский UI очищает выбранные команды.

async function handleGoToNextMatch() {
  await pullRemoteMarksIntoCurrentMatch()
  // Переходим к следующему матчу (может автоматически завершить текущий).
  goToNextMatch()
  // После подбора следующей пары проверяем команды и обновляем статус для зрителя.
  if (homeTeam.value && awayTeam.value) {
    emit('update:matchStatus', 'live', homeTeam.value, awayTeam.value)
  } else {
    emit('update:matchStatus', 'upcoming', '', '')
  }
  // Сразу показываем зрителю новую пару команд — не ждём поллинга.
  await refreshNuxtData(TOURNAMENT_STATE_NUXT_KEY)
}
// Этот обработчик даёт зрителю максимально актуальный статус после «Следующий матч».

// Подключаем логику завершения турнира.
// toRef нужен чтобы передать props-поля как реактивные Ref — composable ожидает Ref<T>.
const {
  finishTournament,
  status: finishStatus,
  errorMessage: finishErrorMessage,
} = useFinishTournament({
  players: props.players,
  assignmentByPlayerId: props.assignmentByPlayerId,
  standingsRows,
  aggregatePlayerStats,
  playerRatingDeltas,
  playedMatchesList,
  tournamentName: toRef(props, 'tournamentName'),
  tournamentDate: toRef(props, 'tournamentDate'),
  venueLabel: toRef(props, 'venueLabel') as Ref<string>,
  formatLabel: toRef(props, 'formatLabel') as Ref<string>,
  standingsSnapshot: toRef(props, 'initialSnapshot') as Ref<import('~/composables/useTournamentWizard').SavedStandingsSnapshot | null>,
  teamColors: toRef(props, 'teamColors'),
})

async function handleFinishTournament() {
  await finishTournament()
  // После успешного завершения турнира переводим статус в finished и сообщаем родителю.
  if (finishStatus.value === 'success') {
    emit('update:matchStatus', 'finished', '', '')
    emit('tournament-finished')
    // Обновление кэша state выполняет родитель (сохранение finished → сброс мастера).
  }
}
</script>

