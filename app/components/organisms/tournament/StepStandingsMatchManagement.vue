<!-- StepStandingsMatchManagement.vue -->
<template>
  <div class="flex flex-col gap-4">

    <!-- Заголовок секции — единый стиль с остальными заголовками сайта -->
    <h3 class="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
      Управление матчем
    </h3>

    <!-- Выбор команд (дом/гость) — overflow-hidden как у остальных аккордеонов; списки рендерятся через Teleport -->
    <div
      class="overflow-hidden rounded-2xl border bg-slate-50 dark:bg-slate-900/60 transition-colors"
      :class="isTeamPickersOpen ? 'border-slate-300 dark:border-slate-700/60' : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/50'"
    >
      <button
        :id="teamPickersToggleId"
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left
               transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        :class="isTeamPickersOpen ? 'bg-slate-100 dark:bg-slate-800/80' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'"
        :aria-expanded="isTeamPickersOpen"
        :aria-controls="teamPickersPanelId"
        @click="isTeamPickersOpen = !isTeamPickersOpen"
      >
        <span class="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          Команды (дом/гость)
          <span
            class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            :class="isTeamPickersOpen ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800/80 text-slate-500'"
          >
            {{ isTeamPickersOpen ? 'Открыт' : 'Скрыт' }}
          </span>
        </span>
        <svg
          class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200"
          :class="isTeamPickersOpen && 'rotate-180'"
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
          v-if="isTeamPickersOpen"
          :id="teamPickersPanelId"
          role="region"
          :aria-labelledby="teamPickersToggleId"
          class="pt-1 pb-2"
        >
          <OrganismsTournamentStepStandingsTeamPickers
            :teams="teams"
            :home-team="homeTeam"
            :away-team="awayTeam"
            :team-marker="teamMarker"
            @update:home-team="$emit('update:homeTeam', $event)"
            @update:away-team="$emit('update:awayTeam', $event)"
          />
        </div>
      </Transition>
    </div>

    <!-- Карточка матча — показывается только когда выбраны обе команды -->
    <div
      v-if="homeTeam && awayTeam"
      class="rounded-2xl border border-slate-300 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900"
    >

      <!-- Табло -->
      <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-slate-200 dark:border-slate-700/60 px-4 py-3">
        <p class="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
          <span class="shrink-0">{{ teamMarker(homeTeam) }}</span>
          <span class="truncate">{{ homeTeam }}</span>
        </p>

        <div class="text-center">
          <p
            class="inline-block rounded-md px-3 py-1 font-mono text-xl font-semibold tabular-nums ring-1"
            :class="boardScorePillClass"
          >
            {{ homeGoals }}&nbsp;:&nbsp;{{ awayGoals }}
          </p>
        </div>

        <p class="flex items-center justify-end gap-1.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
          <span class="truncate">{{ awayTeam }}</span>
          <span class="shrink-0">{{ teamMarker(awayTeam) }}</span>
        </p>
      </div>

      <!-- Составы: на мобайле — друг под другом, на широком — рядом -->
      <div class="flex flex-col divide-y divide-slate-200 dark:divide-slate-700/60 sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <OrganismsTournamentStepStandingsTeamRosterColumn
          side="home"
          :team-name="homeTeam"
          :players="playersByTeam(homeTeam)"
          active-shadow-class="border-sky-300 bg-sky-50 shadow-sm shadow-sky-200/30 dark:border-sky-500/40 dark:bg-sky-500/10 dark:shadow-none"
          :team-color-index="effectiveTeamColors[homeTeam] ?? 0"
          :team-marker="teamMarker"
          :display-player-label="displayPlayerLabelWithoutRating"
          :is-active-player="isActivePlayer"
          :select-player-for-mark="selectPlayerForMark"
          :player-stat="playerStat"
          :add-player-event="addPlayerEvent"
          :remove-player-event="removePlayerEvent"
        />
        <OrganismsTournamentStepStandingsTeamRosterColumn
          side="away"
          :team-name="awayTeam"
          :players="playersByTeam(awayTeam)"
          active-shadow-class="border-emerald-300 bg-emerald-50 shadow-sm shadow-emerald-200/30 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:shadow-none"
          :team-color-index="effectiveTeamColors[awayTeam] ?? 0"
          :team-marker="teamMarker"
          :display-player-label="displayPlayerLabelWithoutRating"
          :is-active-player="isActivePlayer"
          :select-player-for-mark="selectPlayerForMark"
          :player-stat="playerStat"
          :add-player-event="addPlayerEvent"
          :remove-player-event="removePlayerEvent"
        />
      </div>

      <!-- Кнопка "Следующий матч" — только когда выбраны команды -->
      <div class="border-t border-slate-200 dark:border-slate-700/60 px-3 py-2.5">
        <button
          type="button"
          class="inline-flex h-11 items-center justify-center rounded-xl bg-sky-500 px-5 text-sm font-semibold text-white dark:text-slate-900
                 transition-colors md:hover:bg-sky-400 active:bg-sky-600
                 disabled:cursor-not-allowed disabled:opacity-40
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
          :disabled="!hasNextMatch"
          @click="openActionConfirm('next')"
        >
          Следующий матч →
        </button>
      </div>

      <!-- Подтверждение для "Следующий матч" -->
      <MoleculesConfirmInline
        class="border-t border-slate-200 dark:border-slate-700/60 px-3 py-2.5"
        :open="isActionConfirmOpen && pendingAction === 'next'"
        :busy="false"
        tone="neutral"
        aria-label="Подтверждение следующего матча"
        title="Перейти к следующему матчу?"
        subtitle="Если матч не завершён, он будет завершён автоматически."
        cancel-text="Отмена"
        confirm-text="Да, следующий"
        @cancel="closeActionConfirm"
        @confirm="confirmPendingAction"
      />

      <!-- Подсказка когда все пары сыграли -->
      <p
        v-if="!hasNextMatch"
        class="px-4 pb-3 text-[11px] text-slate-400 dark:text-slate-500"
      >
        Все пары команд уже сыграли между собой.
      </p>
    </div>

    <!-- Кнопка "Управление" — всегда видна, вне карточки матча -->
    <div class="overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900">
      <button
        :id="mgmtToggleId"
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        :class="isMgmtOpen ? 'bg-slate-100 dark:bg-slate-800/80' : 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/20'"
        :aria-expanded="isMgmtOpen"
        :aria-controls="mgmtPanelId"
        @click="isMgmtOpen = !isMgmtOpen"
      >
        <span class="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          Управление
          <span
            class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            :class="isMgmtOpen ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800/80 text-slate-500'"
          >
            {{ isMgmtOpen ? 'Открыт' : 'Скрыт' }}
          </span>
        </span>
        <svg
          class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200"
          :class="isMgmtOpen && 'rotate-180'"
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
        enter-to-class="max-h-[32rem] opacity-100"
        leave-active-class="transition-all duration-150 ease-in overflow-hidden"
        leave-from-class="max-h-[32rem] opacity-100"
        leave-to-class="max-h-0 opacity-0"
      >
        <div
          v-if="isMgmtOpen"
          :id="mgmtPanelId"
          role="region"
          :aria-labelledby="mgmtToggleId"
          class="flex flex-col gap-2 border-t border-slate-200 dark:border-slate-700/60 px-3 py-3"
        >
          <!-- Завершить матч — активна только когда есть текущий матч -->
          <button
            type="button"
            class="inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white dark:text-slate-900
                   transition-colors md:hover:bg-emerald-400 active:bg-emerald-600
                   disabled:cursor-not-allowed disabled:opacity-40
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            :disabled="!canFinishMatch"
            @click="openActionConfirm('finish')"
          >
            Завершить матч
          </button>

          <!-- Подтверждение "Завершить матч" -->
          <MoleculesConfirmInline
            :open="isActionConfirmOpen && pendingAction === 'finish'"
            :busy="false"
            tone="danger"
            aria-label="Подтверждение завершения матча"
            title="Завершить матч?"
            subtitle="Это зафиксирует результат текущего матча."
            cancel-text="Отмена"
            confirm-text="Завершить"
            @cancel="closeActionConfirm"
            @confirm="confirmPendingAction"
          />

          <div class="border-t border-slate-200 dark:border-slate-700/60" />

          <!-- Сообщение об успехе / ошибке завершения турнира -->
          <div
            v-if="finishTournamentStatus === 'success'"
            class="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300"
          >
            <span aria-hidden="true">✅</span>
            <span>Данные сохранены в базу!</span>
          </div>
          <div
            v-else-if="finishTournamentStatus === 'error' && finishTournamentError"
            class="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300"
          >
            <span aria-hidden="true" class="mt-0.5 shrink-0">⚠️</span>
            <span>{{ finishTournamentError }}</span>
          </div>

          <!-- Завершить турнир — активна только когда есть сыгранные матчи -->
          <button
            type="button"
            class="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border px-4
                   text-sm font-semibold transition-all
                   disabled:cursor-not-allowed disabled:opacity-40
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            :class="finishTournamentStatus === 'success'
              ? 'border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
              : finishTournamentStatus === 'loading'
                ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 md:hover:bg-amber-500/20 md:hover:border-amber-500/50'"
            :disabled="!hasPlayedMatches || finishTournamentStatus === 'loading' || finishTournamentStatus === 'success'"
            @click="onFinishTournament"
          >
            <span
              v-if="finishTournamentStatus === 'loading'"
              class="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 dark:border-slate-500 border-t-slate-700 dark:border-t-slate-200"
              aria-hidden="true"
            />
            <span v-else class="text-base leading-none" aria-hidden="true">
              {{ finishTournamentStatus === 'success' ? '✅' : '🏆' }}
            </span>
            <span>{{
              finishTournamentStatus === 'loading' ? 'Сохранение...'
              : finishTournamentStatus === 'success' ? 'Турнир завершён'
              : 'Завершить турнир'
            }}</span>
          </button>

          <div class="border-t border-slate-200 dark:border-slate-700/60" />

          <!-- Очистить данные — сбрасывает весь турнир без записи в базу -->
          <button
            type="button"
            class="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border
                   border-red-500/20 bg-red-500/5 px-4 text-sm font-semibold
                   text-red-400 transition-all
                   md:hover:border-red-500/40 md:hover:bg-red-500/10
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
            @click="openClearConfirm"
          >
            <span class="text-base leading-none" aria-hidden="true">🗑</span>
            <span>Очистить все данные</span>
          </button>

          <!-- Подтверждение очистки — предупреждение что действие необратимо -->
          <MoleculesConfirmInline
            :open="isClearConfirmOpen"
            :busy="false"
            tone="danger"
            aria-label="Подтверждение очистки данных"
            title="Очистить все данные?"
            subtitle="Все матчи и результаты будут удалены. В базу ничего не запишется. Это действие необратимо."
            cancel-text="Отмена"
            confirm-text="Очистить"
            @cancel="closeClearConfirm"
            @confirm="confirmClearData"
          />
        </div>
      </Transition>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { StatKey } from '~/composables/tournament-standings/types'
import { computed } from 'vue'
import { displayPlayerLabelWithoutRating } from '~/composables/usePlayerDisplay'
import { useTeamColors } from '~/composables/useTeamColors'
import MoleculesConfirmInline from '~/components/molecules/ConfirmInline.vue'

type Side = 'home' | 'away'

type PlayerMatchStats = {
  goals: number
  assists: number
  saves: number
  yellows: number
}

const props = defineProps<{
  teams: string[]
  homeTeam: string
  awayTeam: string
  homeGoals: number
  awayGoals: number
  hasNextMatch: boolean
  canFinishMatch: boolean
  hasPlayedMatches: boolean
  playersByTeam: (teamName: string) => Player[]
  teamMarker: (teamName: string) => string
  effectiveTeamColors: Record<string, number>
  displayPlayerLabel: (player: Player) => string
  isActivePlayer: (side: Side, playerId: number) => boolean
  selectPlayerForMark: (side: Side, playerId: number) => void
  playerStat: (side: Side, playerId: number) => PlayerMatchStats
  onSelectAction: (side: Side, playerId: number, event: Event) => void
  addPlayerEvent: (side: Side, playerId: number, key: StatKey) => void
  removePlayerEvent: (side: Side, playerId: number, key: StatKey) => void
  goToNextMatch: () => void
  resetMatchStats: () => void
  finishMatch: () => void
  finishTournamentStatus: 'idle' | 'loading' | 'success' | 'error'
  finishTournamentError: string | null
  onFinishTournament: () => void
  // Сбросить все данные турнира локально без отправки в базу.
  onClearData: () => void
}>()

defineEmits<{
  'update:homeTeam': [value: string]
  'update:awayTeam': [value: string]
}>()

const { getMatchScorePillClass } = useTeamColors()

// Табло: ничья — серая плашка; лидер — в цвете его команды.
const boardScorePillClass = computed(() =>
  getMatchScorePillClass(
    props.homeGoals,
    props.awayGoals,
    props.homeTeam,
    props.awayTeam,
    (name) => props.effectiveTeamColors[name] ?? 0,
  ),
)

const uid = useId?.() ?? Math.random().toString(36).slice(2)

// Управление видимостью блока "Команды (дом/гость)".
const teamPickersToggleId = `match-team-pickers-toggle-${uid}`
const teamPickersPanelId = `match-team-pickers-panel-${uid}`
const isTeamPickersOpen = ref(true)

// Управление видимостью блока "Управление" (Завершить матч, Завершить турнир).
const mgmtToggleId = `match-mgmt-toggle-${uid}`
const mgmtPanelId = `match-mgmt-panel-${uid}`
const isMgmtOpen = ref(false)

const pendingAction = ref<'next' | 'finish' | null>(null)
const isActionConfirmOpen = computed(() => pendingAction.value !== null)

function closeActionConfirm() {
  // Закрываем подтверждение, чтобы случайный клик не выполнил действие позже.
  pendingAction.value = null
}

function openActionConfirm(action: 'next' | 'finish') {
  // Защита от случайного нажатия: подтверждение активируется через 2 секунды.
  pendingAction.value = action
}

function confirmPendingAction() {
  // Выполняем действие только когда таймер дошёл до нуля.
  const action = pendingAction.value
  closeActionConfirm()

  if (action === 'finish') {
    props.finishMatch()
    return
  }
  if (action === 'next') {
    props.goToNextMatch()
  }
}

// Отдельное подтверждение для "Очистить данные" — опасное действие, требует явного согласия.
const isClearConfirmOpen = ref(false)

function openClearConfirm() {
  isClearConfirmOpen.value = true
}

function closeClearConfirm() {
  isClearConfirmOpen.value = false
}

function confirmClearData() {
  // Вызываем очистку только после подтверждения пользователем.
  closeClearConfirm()
  props.onClearData()
}
</script>