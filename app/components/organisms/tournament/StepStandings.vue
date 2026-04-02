<!-- Компонент StepStandings: таблица, составы со статистикой, сыгранные матчи и управление матчем — отдельными блоками. -->
<template>
  <div class="min-w-0 space-y-4">
    <!-- Блок 1: турнирная таблица -->
    <div
      class="overflow-hidden rounded-2xl border bg-slate-900/60 transition-colors"
      :class="isStandingsBlockOpen ? 'border-slate-700/60' : 'border-slate-800/60 hover:border-slate-700/50'"
    >
      <button
        :id="standingsToggleId"
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        :class="isStandingsBlockOpen ? 'bg-slate-800/80' : 'hover:bg-slate-800/30'"
        :aria-expanded="isStandingsBlockOpen"
        :aria-controls="standingsPanelId"
        @click="isStandingsBlockOpen = !isStandingsBlockOpen"
      >
        <div class="min-w-0 flex-1">
          <span class="flex items-center gap-2 text-sm font-semibold text-slate-100">
            Таблица
            <span
              class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              :class="isStandingsBlockOpen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800/80 text-slate-500'"
            >
              {{ isStandingsBlockOpen ? 'Открыт' : 'Скрыт' }}
            </span>
          </span>
          <span
            v-if="tournamentName || tournamentDate"
            class="mt-0.5 block truncate text-xs text-slate-500"
          >
            <span v-if="tournamentName">{{ tournamentName }}</span>
            <span v-if="tournamentName && tournamentDate"> · </span>
            <span v-if="tournamentDate">{{ tournamentDate }}</span>
          </span>
        </div>
        <svg
          class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200"
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
      >
        <div
          v-if="isStandingsBlockOpen"
          :id="standingsPanelId"
          role="region"
          :aria-labelledby="standingsToggleId"
          class="pt-1"
        >
          <OrganismsTournamentStepStandingsHero
            :tournament-name="tournamentName"
            :tournament-date="tournamentDate"
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
      class="overflow-hidden rounded-2xl border bg-slate-900/60 transition-colors"
      :class="isRosterTotalsOpen ? 'border-slate-700/60' : 'border-slate-800/60 hover:border-slate-700/50'"
    >
      <button
        :id="rosterTotalsToggleId"
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        :class="isRosterTotalsOpen ? 'bg-slate-800/80' : 'hover:bg-slate-800/30'"
        :aria-expanded="isRosterTotalsOpen"
        :aria-controls="rosterTotalsPanelId"
        @click="isRosterTotalsOpen = !isRosterTotalsOpen"
      >
        <span class="flex items-center gap-2 text-sm font-semibold text-slate-100">
          Составы
          <span
            class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            :class="isRosterTotalsOpen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800/80 text-slate-500'"
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
      >
        <div
          v-if="isRosterTotalsOpen"
          :id="rosterTotalsPanelId"
          role="region"
          :aria-labelledby="rosterTotalsToggleId"
          class="pt-1"
        >
          <OrganismsTournamentStepStandingsTeamRosterTotals
            :teams="teams"
            :players-by-team="playersByTeam"
            :team-marker="teamMarker"
            :display-player-label="displayPlayerLabel"
            :aggregate-player-stats="aggregatePlayerStats"
            :player-rating-deltas="playerRatingDeltas"
            :show-heading="false"
          />
        </div>
      </Transition>
    </div>

    <!-- Блок 3: результаты матчей + управление текущим матчем -->
    <section class="min-w-0 space-y-4">
      <div
        class="overflow-hidden rounded-2xl border bg-slate-900/60 transition-colors"
        :class="isPlayedMatchesOpen ? 'border-slate-700/60' : 'border-slate-800/60 hover:border-slate-700/50'"
      >
        <button
          :id="playedMatchesToggleId"
          type="button"
          class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          :class="isPlayedMatchesOpen ? 'bg-slate-800/80' : 'hover:bg-slate-800/30'"
          :aria-expanded="isPlayedMatchesOpen"
          :aria-controls="playedMatchesPanelId"
          @click="isPlayedMatchesOpen = !isPlayedMatchesOpen"
        >
          <span class="flex items-center gap-2 text-sm font-semibold text-slate-100">
            Результаты
            <span
              class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              :class="isPlayedMatchesOpen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800/80 text-slate-500'"
            >
              {{ isPlayedMatchesOpen ? 'Открыт' : 'Скрыт' }}
            </span>
          </span>
          <div class="flex shrink-0 items-center gap-2">
            <span
              v-if="playedMatchesList.length > 0"
              class="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-400"
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
        :finish-match="handleFinishMatch"
        :finish-tournament-status="finishStatus"
        :finish-tournament-error="finishErrorMessage"
        :on-finish-tournament="handleFinishTournament"
        :on-clear-data="handleClearData"
        @update:home-team="handleUpdateHomeTeam"
        @update:away-team="handleUpdateAwayTeam"
      />

    </section>
  </div>
</template>

<script setup lang="ts">
import type { Player, MatchStatus } from '~/types/tournament'
import type { SavedStandingsSnapshot } from '~/composables/useTournamentWizard'
import { useTournamentStandingsRefactored } from '~/composables/useTournamentStandingsRefactored'
import { useFinishTournament } from '~/composables/useFinishTournament'
import { displayPlayerLabelWithoutRating } from '~/composables/usePlayerDisplay'

// Этот шаг показывает матчи и турнирную таблицу.
const props = defineProps<{
  tournamentName: string
  tournamentDate: string
  teams: string[]
  teamColors: Record<string, number>
  players: Player[]
  assignmentByPlayerId: Record<number, string>
  // Начальный снапшот из куки — восстанавливает матчи и таблицу после обновления страницы.
  initialSnapshot?: SavedStandingsSnapshot | null
  // Режим только чтения: одинаковый UI без действий управления.
  readonly?: boolean
}>()

const emit = defineEmits<{
  // Вызывается при каждом изменении матчей/таблицы — родитель сохраняет снапшот в куку.
  'update:snapshot': [snapshot: SavedStandingsSnapshot]
  // Вызывается после успешного завершения турнира — родитель сбрасывает wizard.
  'tournament-finished': []
  // Вызывается после локальной очистки без записи в базу — родитель сбрасывает wizard.
  'tournament-cleared': []
  // Статус матча изменился — родитель (wizard) должен сохранить его в БД.
  'update:matchStatus': [status: MatchStatus, homeTeam: string, awayTeam: string]
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
  finishMatch,
  goToNextMatch,
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

function handleUpdateHomeTeam(next: string) {
  homeTeam.value = next
  // Если обе команды выбраны — матч идёт сейчас. Иначе — ожидается.
  if (homeTeam.value && awayTeam.value) {
    emit('update:matchStatus', 'live', homeTeam.value, awayTeam.value)
  } else {
    emit('update:matchStatus', 'upcoming', '', '')
  }
}
// Это обновляет домашнюю команду, когда пользователь меняет select в дочернем UI.

function handleUpdateAwayTeam(next: string) {
  awayTeam.value = next
  // Если обе команды выбраны — матч идёт сейчас. Иначе — ожидается.
  if (homeTeam.value && awayTeam.value) {
    emit('update:matchStatus', 'live', homeTeam.value, awayTeam.value)
  } else {
    emit('update:matchStatus', 'upcoming', '', '')
  }
}
// Это обновляет гостевую команду, когда пользователь меняет select в дочернем UI.

function handleFinishMatch() {
  // Ставим статус finished ДО сброса команд внутри finishMatch(), чтобы зритель успел увидеть «Завершён».
  if (homeTeam.value && awayTeam.value) {
    emit('update:matchStatus', 'finished', homeTeam.value, awayTeam.value)
  } else {
    emit('update:matchStatus', 'finished', '', '')
  }
  finishMatch()
}
// Этот обработчик централизует статус: после нажатия «Завершить матч» он остаётся finished,
// даже если админский UI очищает выбранные команды.

function handleGoToNextMatch() {
  // Переходим к следующему матчу (может автоматически завершить текущий).
  goToNextMatch()
  // После подбора следующей пары проверяем команды и обновляем статус для зрителя.
  if (homeTeam.value && awayTeam.value) {
    emit('update:matchStatus', 'live', homeTeam.value, awayTeam.value)
  } else {
    emit('update:matchStatus', 'upcoming', '', '')
  }
}
// Этот обработчик даёт зрителю максимально актуальный статус после «Следующий матч».

// Подключаем логику завершения турнира.
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
})

async function handleFinishTournament() {
  await finishTournament()
  // После успешного завершения турнира переводим статус в finished и сообщаем родителю.
  if (finishStatus.value === 'success') {
    emit('update:matchStatus', 'finished', '', '')
    emit('tournament-finished')
  }
}

function handleClearData() {
  // Очищаем локально без обращения к базе — просто сбрасываем wizard в родителе.
  emit('tournament-cleared')
}
</script>

