<!-- Список завершённых матчей с просмотром деталей и inline-редактированием. -->
<template>
  <div class="space-y-3 pt-3">

    <!-- Заголовок секции -->
    <div v-if="showHeading" class="flex items-center justify-between gap-3">
      <h3 class="text-xs font-semibold uppercase tracking-widest text-slate-400">
        Сыгранные матчи
      </h3>
      <span
        v-if="playedMatchesList.length > 0"
        class="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-400"
      >
        {{ playedMatchesList.length }}
      </span>
    </div>

    <!-- Пустое состояние -->
    <div
      v-if="playedMatchesList.length === 0"
      class="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-700/60 px-4 py-8 text-center"
    >
      <svg class="h-8 w-8 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M2 12h20" />
      </svg>
      <p class="text-xs text-slate-500">Пока матчей нет.</p>
      <p class="text-[11px] text-slate-600">Завершите первый матч, чтобы он появился здесь.</p>
    </div>

    <!-- Список матчей -->
    <ul v-else class="max-h-96 space-y-1.5 overflow-y-auto pr-0.5" role="list">
      <li
        v-for="m in playedMatchesList"
        :key="m.matchNumber"
        class="min-w-0 overflow-hidden rounded-xl border transition-colors"
        :class="(openMatch === m.matchNumber || editMatch === m.matchNumber)
          ? 'border-slate-600/60 bg-slate-900'
          : 'border-slate-700/40 bg-slate-900 md:hover:border-slate-600/50'"
      >
        <!-- Строка матча: счёт + команды -->
        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-3">
          <div class="flex min-w-0 items-center gap-2">
            <span aria-hidden="true" class="shrink-0 text-base leading-none">{{ teamMarker(m.homeTeam) }}</span>
            <span class="min-w-0 truncate text-sm font-semibold text-slate-200">{{ m.homeTeam }}</span>
          </div>
          <div class="flex shrink-0 flex-col items-center gap-0.5">
            <span
              class="rounded-md px-3 py-1 font-mono text-base font-bold tabular-nums"
              :class="getScoreClass(m)"
            >
              {{ m.homeGoals }}&nbsp;:&nbsp;{{ m.awayGoals }}
            </span>
          </div>
          <div class="flex min-w-0 items-center justify-end gap-2">
            <span class="min-w-0 truncate text-right text-sm font-semibold text-slate-200">{{ m.awayTeam }}</span>
            <span aria-hidden="true" class="shrink-0 text-base leading-none">{{ teamMarker(m.awayTeam) }}</span>
          </div>
        </div>

        <!-- Панель кнопок: детали / редактировать -->
        <div class="flex items-center gap-2 border-t border-slate-800/60 px-3 py-2">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            :class="openMatch === m.matchNumber
              ? 'bg-slate-700 text-slate-200'
              : 'text-slate-500 md:hover:bg-slate-800 md:hover:text-slate-300'"
            @click="toggleDetails(m.matchNumber)"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
            </svg>
            Детали
          </button>
          <button
            v-if="!props.readonly"
            type="button"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            :class="editMatch === m.matchNumber
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'text-slate-500 md:hover:bg-slate-800 md:hover:text-slate-300'"
            @click="toggleEdit(m)"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            {{ editMatch === m.matchNumber ? 'Редактируется' : 'Редактировать' }}
          </button>

          <!-- Номер матча: закреплён в строке действий, не уезжает вниз -->
          <span
            class="ml-auto rounded-md bg-slate-800/70 px-2 py-0.5 text-[10px]
                   font-semibold uppercase tracking-widest tabular-nums text-slate-400"
          >
            М{{ m.matchNumber }}
          </span>

          <!-- Удаление: двухшаговая защита — сначала иконка, потом "Удалить?" -->
          <template v-if="!props.readonly && confirmDeleteMatch === m.matchNumber">
            <button
              type="button"
              class="flex items-center gap-1 rounded-lg bg-red-500/20 px-2.5 py-2 text-xs font-semibold
                     text-red-400 transition-colors md:hover:bg-red-500/30 focus:outline-none"
              @click="confirmDelete(m.matchNumber)"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd" />
              </svg>
              Удалить?
            </button>
            <button
              type="button"
              class="rounded-lg px-2.5 py-2 text-xs text-slate-500 transition-colors md:hover:text-slate-300 focus:outline-none"
              @click="cancelDelete"
            >
              Нет
            </button>
          </template>
          <button
            v-else-if="!props.readonly"
            type="button"
            class="rounded-lg p-2 text-slate-600 transition-colors md:hover:bg-slate-800 md:hover:text-red-400
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
            title="Удалить матч"
            @click="requestDelete(m.matchNumber)"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <!-- ───── Детали матча: клик по игроку раскрывает его метки ───── -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out overflow-hidden"
          enter-from-class="max-h-0 opacity-0"
          enter-to-class="max-h-96 opacity-100"
          leave-active-class="transition-all duration-150 ease-in overflow-hidden"
          leave-from-class="max-h-96 opacity-100"
          leave-to-class="max-h-0 opacity-0"
        >
          <OrganismsTournamentPlayedMatchesPlayedMatchDetails
            v-if="openMatch === m.matchNumber && editMatch !== m.matchNumber"
            :match="m"
            :team-marker="teamMarker"
          />
        </Transition>

        <!-- ───── Inline-редактор ───── -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out overflow-hidden"
          enter-from-class="max-h-0 opacity-0"
          enter-to-class="max-h-[800px] opacity-100"
          leave-active-class="transition-all duration-150 ease-in overflow-hidden"
          leave-from-class="max-h-[800px] opacity-100"
          leave-to-class="max-h-0 opacity-0"
        >
          <OrganismsTournamentPlayedMatchesPlayedMatchEditor
            v-if="!props.readonly && editMatch === m.matchNumber"
            :match="m"
            :team-marker="teamMarker"
            :players-by-team="playersByTeam"
            :display-player-label="displayPlayerLabel"
            :update-played-match="updatePlayedMatch"
            @cancel="cancelEdit"
          />
        </Transition>

      </li>
    </ul>

  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { PlayerMatchStats } from '~/composables/tournament-standings/types'
import OrganismsTournamentPlayedMatchesPlayedMatchDetails from '~/components/organisms/tournament/played-matches/PlayedMatchDetails.vue'
import OrganismsTournamentPlayedMatchesPlayedMatchEditor from '~/components/organisms/tournament/played-matches/PlayedMatchEditor.vue'

type MarkedPlayer = {
  playerId: number
  name: string
  eventsLabel: string
}

type PlayedMatch = {
  matchNumber: number
  homeTeam: string
  awayTeam: string
  homeGoals: number
  awayGoals: number
  homePlayers: MarkedPlayer[]
  awayPlayers: MarkedPlayer[]
  homeStats: Record<number, PlayerMatchStats>
  awayStats: Record<number, PlayerMatchStats>
}

const props = defineProps<{
  playedMatchesList: PlayedMatch[]
  teamMarker: (teamName: string) => string
  playersByTeam: (teamName: string) => Player[]
  displayPlayerLabel: (player: Player) => string
  updatePlayedMatch: (
    matchNumber: number,
    homeGoals: number,
    awayGoals: number,
    homeStats: Record<number, PlayerMatchStats>,
    awayStats: Record<number, PlayerMatchStats>,
  ) => void
  deletePlayedMatch: (matchNumber: number) => void
  /** Если false — заголовок скрыт (например, когда он вынесен в родительский аккордеон). */
  showHeading?: boolean
  /** true — режим только просмотра, без редактирования и удаления. */
  readonly?: boolean
}>()

// По умолчанию заголовок показывается.
const showHeading = computed(() => props.showHeading ?? true)

// Какой матч раскрыт для деталей.
const openMatch = ref<number | null>(null)

// Какой матч редактируется.
const editMatch = ref<number | null>(null)

// Матч, ожидающий подтверждения удаления (двухшаговая защита от случайного нажатия).
const confirmDeleteMatch = ref<number | null>(null)

function requestDelete(matchNumber: number) {
  // В режиме просмотра удаление отключено.
  if (props.readonly) return
  // Первый клик — запрашиваем подтверждение.
  confirmDeleteMatch.value = matchNumber
}

function confirmDelete(matchNumber: number) {
  // В режиме просмотра удаление отключено.
  if (props.readonly) return
  // Второй клик — удаляем и сбрасываем все раскрытые состояния этого матча.
  props.deletePlayedMatch(matchNumber)
  if (openMatch.value === matchNumber) openMatch.value = null
  if (editMatch.value === matchNumber) cancelEdit()
  confirmDeleteMatch.value = null
}

function cancelDelete() {
  confirmDeleteMatch.value = null
}

// Переключение детальной панели матча.
function toggleDetails(matchNumber: number) {
  if (editMatch.value === matchNumber) cancelEdit()
  openMatch.value = openMatch.value === matchNumber ? null : matchNumber
}

function toggleEdit(m: PlayedMatch) {
  // В режиме просмотра редактирование отключено.
  if (props.readonly) return
  if (editMatch.value === m.matchNumber) {
    cancelEdit()
    return
  }
  editMatch.value = m.matchNumber
  openMatch.value = null
}

function cancelEdit() {
  editMatch.value = null
}

// Глубокое копирование stats — черновик не ссылается на оригинал.
function homePlayers(m: PlayedMatch): Player[] {
  return props.playersByTeam(m.homeTeam)
}

function awayPlayers(m: PlayedMatch): Player[] {
  return props.playersByTeam(m.awayTeam)
}

function getScoreClass(m: PlayedMatch): string {
  if (m.homeGoals > m.awayGoals) return 'bg-sky-500/15 text-sky-200'
  if (m.awayGoals > m.homeGoals) return 'bg-emerald-500/15 text-emerald-200'
  return 'bg-slate-800/80 text-slate-100'
}
</script>
