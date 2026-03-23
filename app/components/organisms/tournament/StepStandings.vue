<!-- Компонент StepStandings: шаг, который собирает герой + список матчей + управление матчем. -->
<template>
  <div class="min-w-0 space-y-4">
    <div class="overflow-hidden rounded-2xl bg-slate-900/70">
      <button
        :id="standingsToggleId"
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        :class="isStandingsBlockOpen
          ? 'bg-slate-800/80'
          : 'bg-transparent'"
        :aria-expanded="isStandingsBlockOpen"
        :aria-controls="standingsPanelId"
        @click="isStandingsBlockOpen = !isStandingsBlockOpen"
      >
        <div class="min-w-0 flex-1">
          <span class="flex items-center gap-2 text-sm font-semibold text-slate-100">
            Турнирная таблица и составы
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
          class="space-y-4 pt-3"
        >
          <!-- Подзаголовок таблицы -->
          <div>
            <h2 class="mb-2.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Турнирная таблица
            </h2>
            <OrganismsTournamentStepStandingsHero
              :tournament-name="tournamentName"
              :tournament-date="tournamentDate"
              :teams="teams"
              :standings-rows="standingsRows"
              :effective-team-colors="effectiveTeamColors"
              :show-heading="false"
            />
          </div>

          <!-- Разделитель -->
          <div class="border-t border-slate-800/60" />

          <!-- Аккордеон: составы и статистика -->
          <div class="overflow-hidden rounded-2xl bg-slate-900/70">
            <button
              :id="rosterTotalsToggleId"
              type="button"
              class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              :class="isRosterTotalsOpen
                ? 'bg-slate-800/80'
                : 'bg-transparent'"
              :aria-expanded="isRosterTotalsOpen"
              :aria-controls="rosterTotalsPanelId"
              @click="isRosterTotalsOpen = !isRosterTotalsOpen"
            >
              <div class="min-w-0 flex-1">
                <span class="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  Составы и статистика
                  <span
                    class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    :class="isRosterTotalsOpen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800/80 text-slate-500'"
                  >
                    {{ isRosterTotalsOpen ? 'Открыт' : 'Скрыт' }}
                  </span>
                </span>
                <span class="mt-0.5 block text-xs text-slate-500">
                  События по игрокам и командам
                </span>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <span
                  v-if="rosterTotalsPlayersCount > 0"
                  class="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-400"
                >
                  {{ rosterTotalsPlayersCount }}
                </span>
                <svg
                  class="h-5 w-5 text-slate-400 transition-transform duration-200"
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
                v-if="isRosterTotalsOpen"
                :id="rosterTotalsPanelId"
                role="region"
                :aria-labelledby="rosterTotalsToggleId"
                class="border-t border-slate-800/60 pb-4 pt-3"
              >
                <OrganismsTournamentStepStandingsTeamRosterTotals
                  :teams="teams"
                  :players-by-team="playersByTeam"
                  :team-marker="teamMarker"
                  :display-player-label="displayPlayerLabel"
                  :aggregate-player-stats="aggregatePlayerStats"
                  :show-heading="false"
                />
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </div>

    <section class="min-w-0 space-y-4 overflow-x-hidden rounded-2xl bg-slate-900/70">
      <div class="overflow-hidden rounded-2xl bg-slate-900/70">
        <button
          :id="playedMatchesToggleId"
          type="button"
          class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          :class="isPlayedMatchesOpen
            ? 'bg-slate-800/80'
            : 'bg-transparent'"
          :aria-expanded="isPlayedMatchesOpen"
          :aria-controls="playedMatchesPanelId"
          @click="isPlayedMatchesOpen = !isPlayedMatchesOpen"
        >
          <div class="min-w-0 flex-1">
            <span class="flex items-center gap-2 text-sm font-semibold text-slate-100">
              Сыгранные матчи
              <span
                class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                :class="isPlayedMatchesOpen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800/80 text-slate-500'"
              >
                {{ isPlayedMatchesOpen ? 'Открыт' : 'Скрыт' }}
              </span>
            </span>
            <span class="mt-0.5 block text-xs text-slate-500">
              Завершённые матчи и редактирование событий
            </span>
          </div>
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
            <OrganismsTournamentStepStandingsPlayedMatches
              :played-matches-list="playedMatchesList"
              :team-marker="teamMarker"
              :players-by-team="playersByTeam"
              :display-player-label="displayPlayerLabel"
              :update-played-match="updatePlayedMatch"
              :delete-played-match="deletePlayedMatch"
              :show-heading="false"
            />
          </div>
        </Transition>
      </div>

      <OrganismsTournamentStepStandingsMatchManagement
        :teams="teams"
        :home-team="homeTeam"
        :away-team="awayTeam"
        :home-goals="homeGoals"
        :away-goals="awayGoals"
        :has-next-match="hasNextMatch"
        :can-finish-match="canFinishMatch"
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
        :go-to-next-match="goToNextMatch"
        :reset-match-stats="resetMatchStats"
        :finish-match="finishMatch"
        @update:home-team="handleUpdateHomeTeam"
        @update:away-team="handleUpdateAwayTeam"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { SavedStandingsSnapshot } from '~/composables/useTournamentWizard'
import { useTournamentStandingsRefactored } from '~/composables/useTournamentStandingsRefactored'

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
}>()

const emit = defineEmits<{
  // Вызывается при каждом изменении матчей/таблицы — родитель сохраняет снапшот в куку.
  'update:snapshot': [snapshot: SavedStandingsSnapshot]
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

const standingsUid = useId?.() ?? Math.random().toString(36).slice(2)
const standingsToggleId = `standings-block-toggle-${standingsUid}`
const standingsPanelId = `standings-block-panel-${standingsUid}`
const rosterTotalsToggleId = `roster-totals-toggle-${standingsUid}`
const rosterTotalsPanelId = `roster-totals-panel-${standingsUid}`
const playedMatchesToggleId = `played-matches-toggle-${standingsUid}`
const playedMatchesPanelId = `played-matches-panel-${standingsUid}`

// Таблица и составы скрыты по умолчанию — открываются кнопкой, когда нужно посмотреть.
const isStandingsBlockOpen = ref(false)
const isRosterTotalsOpen = ref(true)
const isPlayedMatchesOpen = ref(false)

// Сколько игроков в турнире — для бейджа в заголовке аккордеона.
const rosterTotalsPlayersCount = computed(() => {
  return props.teams.reduce((sum, t) => sum + playersByTeam(t).length, 0)
})

function handleUpdateHomeTeam(next: string) {
  homeTeam.value = next
}
// Это обновляет домашнюю команду, когда пользователь меняет select в дочернем UI.

function handleUpdateAwayTeam(next: string) {
  awayTeam.value = next
}
// Это обновляет гостевую команду, когда пользователь меняет select в дочернем UI.
</script>

