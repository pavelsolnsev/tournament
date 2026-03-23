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
          <template v-if="confirmDeleteMatch === m.matchNumber">
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
            v-else
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
          <div
            v-if="openMatch === m.matchNumber && editMatch !== m.matchNumber"
            class="border-t border-slate-800/60 bg-slate-950/40 px-3 pb-3 pt-2.5"
          >
            <!-- Нет ни одного игрока с событиями -->
            <p
              v-if="m.homePlayers.length === 0 && m.awayPlayers.length === 0"
              class="text-center text-xs text-slate-600"
            >
              Нет отмеченных игроков.
            </p>

            <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-4">

              <!-- Домашняя команда -->
              <div v-if="m.homePlayers.length > 0" class="min-w-0">
                <div class="mb-2 flex min-w-0 items-center gap-1.5">
                  <span aria-hidden="true" class="shrink-0 text-sm">{{ teamMarker(m.homeTeam) }}</span>
                  <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">{{ m.homeTeam }}</span>
                </div>
                <div class="flex flex-col gap-1.5">
                  <div
                    v-for="p in m.homePlayers"
                    :key="p.playerId"
                    class="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-slate-800/40 px-2.5 py-2"
                  >
                    <span class="min-w-0 flex-1 truncate text-sm text-slate-300">{{ p.name }}</span>
                    <span v-if="p.eventsLabel" class="shrink-0 text-xs text-slate-500">{{ p.eventsLabel }}</span>
                  </div>
                </div>
              </div>

              <!-- Гостевая команда -->
              <div v-if="m.awayPlayers.length > 0" class="min-w-0">
                <div class="mb-2 flex min-w-0 items-center gap-1.5">
                  <span aria-hidden="true" class="shrink-0 text-sm">{{ teamMarker(m.awayTeam) }}</span>
                  <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">{{ m.awayTeam }}</span>
                </div>
                <div class="flex flex-col gap-1.5">
                  <div
                    v-for="p in m.awayPlayers"
                    :key="p.playerId"
                    class="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-slate-800/40 px-2.5 py-2"
                  >
                    <span class="min-w-0 flex-1 truncate text-sm text-slate-300">{{ p.name }}</span>
                    <span v-if="p.eventsLabel" class="shrink-0 text-xs text-slate-500">{{ p.eventsLabel }}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
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
          <div
            v-if="editMatch === m.matchNumber && draft"
            class="border-t border-slate-700/60 bg-slate-950/60"
          >

            <!-- Авто-счёт: голы считаются из статистики игроков -->
            <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-3">
              <span class="min-w-0 truncate text-xs font-semibold uppercase tracking-wider text-slate-500">
                {{ m.homeTeam }}
              </span>
              <div class="flex shrink-0 flex-col items-center gap-0.5">
                <span class="text-[10px] uppercase tracking-widest text-slate-600">Счёт</span>
                <span class="font-mono text-lg font-bold tabular-nums text-slate-100">
                  {{ draftHomeGoals }}&nbsp;:&nbsp;{{ draftAwayGoals }}
                </span>
              </div>
              <span class="min-w-0 truncate text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                {{ m.awayTeam }}
              </span>
            </div>

            <!-- Статистика по командам -->
            <div class="grid grid-cols-1 gap-0 divide-y divide-slate-800/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0">

              <!-- Домашняя команда -->
              <div class="px-3 pb-3 pt-2">
                <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {{ teamMarker(m.homeTeam) }} {{ m.homeTeam }}
                </p>
                <div class="space-y-1.5">
                  <div v-for="p in homePlayers(m)" :key="p.id" class="min-w-0">
                    <!-- Строка игрока: клик раскрывает контролы -->
                    <button
                      type="button"
                      class="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl px-3 py-2.5
                             text-left transition-colors md:hover:bg-slate-800/60 focus:outline-none"
                      :class="openEditPlayer === editPlayerKey('home', p.id) ? 'bg-slate-800/70' : 'bg-slate-800/40'"
                      @click="toggleEditPlayer('home', p.id)"
                    >
                      <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">{{ displayPlayerLabel(p) }}</span>
                      <span v-if="hasAnyStat(draft.homeStats, p.id)" class="shrink-0 text-xs text-slate-500">
                        {{ buildLabel(draft.homeStats, p.id) }}
                      </span>
                      <svg
                        class="h-4 w-4 shrink-0 transition-transform duration-150"
                        :class="openEditPlayer === editPlayerKey('home', p.id) ? 'rotate-180 text-slate-400' : 'text-slate-600'"
                        viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                      >
                        <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                      </svg>
                    </button>

                    <!-- Контролы: 4 события с кнопками − и + -->
                    <div v-if="openEditPlayer === editPlayerKey('home', p.id)" class="mt-1.5 flex flex-wrap gap-1.5 px-1">
                      <template v-for="stat in STAT_DEFS" :key="stat.key">
                        <div class="flex items-stretch rounded-xl border text-sm" :class="stat.bgClass">
                          <span class="flex items-center px-2.5 py-1.5 font-semibold tabular-nums" :class="stat.textClass">
                            {{ stat.icon }} {{ getEditStat(draft.homeStats, p.id, stat.key) }}
                          </span>
                          <button
                            type="button"
                            class="flex items-center px-2 py-1.5 transition-colors active:scale-95"
                            :class="stat.removeClass"
                            :title="'Убрать ' + stat.label"
                            @click="changeStat(draft.homeStats, p.id, stat.key, -1)"
                          >
                            <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clip-rule="evenodd" /></svg>
                          </button>
                          <button
                            type="button"
                            class="flex items-center rounded-r-xl px-2 py-1.5 transition-colors active:scale-95"
                            :class="stat.addingClass"
                            :title="'Добавить ' + stat.label"
                            @click="changeStat(draft.homeStats, p.id, stat.key, +1)"
                          >
                            <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a.75.75 0 01.75.75v5.5h5.5a.75.75 0 010 1.5h-5.5v5.5a.75.75 0 01-1.5 0v-5.5H3.75a.75.75 0 010-1.5h5.5V3.75A.75.75 0 0110 3z" clip-rule="evenodd" /></svg>
                          </button>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Гостевая команда -->
              <div class="px-3 pb-3 pt-2">
                <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {{ teamMarker(m.awayTeam) }} {{ m.awayTeam }}
                </p>
                <div class="space-y-1.5">
                  <div v-for="p in awayPlayers(m)" :key="p.id" class="min-w-0">
                    <button
                      type="button"
                      class="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl px-3 py-2.5
                             text-left transition-colors md:hover:bg-slate-800/60 focus:outline-none"
                      :class="openEditPlayer === editPlayerKey('away', p.id) ? 'bg-slate-800/70' : 'bg-slate-800/40'"
                      @click="toggleEditPlayer('away', p.id)"
                    >
                      <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">{{ displayPlayerLabel(p) }}</span>
                      <span v-if="hasAnyStat(draft.awayStats, p.id)" class="shrink-0 text-xs text-slate-500">
                        {{ buildLabel(draft.awayStats, p.id) }}
                      </span>
                      <svg
                        class="h-4 w-4 shrink-0 transition-transform duration-150"
                        :class="openEditPlayer === editPlayerKey('away', p.id) ? 'rotate-180 text-slate-400' : 'text-slate-600'"
                        viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                      >
                        <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                      </svg>
                    </button>
                    <div v-if="openEditPlayer === editPlayerKey('away', p.id)" class="mt-1.5 flex flex-wrap gap-1.5 px-1">
                      <template v-for="stat in STAT_DEFS" :key="stat.key">
                        <div class="flex items-stretch rounded-xl border text-sm" :class="stat.bgClass">
                          <span class="flex items-center px-2.5 py-1.5 font-semibold tabular-nums" :class="stat.textClass">
                            {{ stat.icon }} {{ getEditStat(draft.awayStats, p.id, stat.key) }}
                          </span>
                          <button
                            type="button"
                            class="flex items-center px-2 py-1.5 transition-colors active:scale-95"
                            :class="stat.removeClass"
                            :title="'Убрать ' + stat.label"
                            @click="changeStat(draft.awayStats, p.id, stat.key, -1)"
                          >
                            <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clip-rule="evenodd" /></svg>
                          </button>
                          <button
                            type="button"
                            class="flex items-center rounded-r-xl px-2 py-1.5 transition-colors active:scale-95"
                            :class="stat.addingClass"
                            :title="'Добавить ' + stat.label"
                            @click="changeStat(draft.awayStats, p.id, stat.key, +1)"
                          >
                            <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a.75.75 0 01.75.75v5.5h5.5a.75.75 0 010 1.5h-5.5v5.5a.75.75 0 01-1.5 0v-5.5H3.75a.75.75 0 010-1.5h5.5V3.75A.75.75 0 0110 3z" clip-rule="evenodd" /></svg>
                          </button>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Сохранить / Отмена -->
            <div class="flex items-center gap-2 border-t border-slate-800/60 px-3 py-3">
              <button
                type="button"
                class="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-900
                       transition-colors md:hover:bg-emerald-400 active:bg-emerald-600 focus:outline-none"
                @click="saveEdit(m.matchNumber)"
              >
                Сохранить
              </button>
              <button
                type="button"
                class="rounded-xl bg-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300
                       transition-colors md:hover:bg-slate-600 focus:outline-none"
                @click="cancelEdit"
              >
                Отмена
              </button>
            </div>

          </div>
        </Transition>

      </li>
    </ul>

  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { PlayerMatchStats, StatKey } from '~/composables/tournament-standings/types'

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

type DraftState = {
  homeStats: Record<number, PlayerMatchStats>
  awayStats: Record<number, PlayerMatchStats>
}
// Черновик без явных голов — они вычисляются из статистики игроков.

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
}>()

// По умолчанию заголовок показывается.
const showHeading = computed(() => props.showHeading ?? true)

// Конфигурация полей статистики.
const STAT_DEFS = [
  {
    key: 'goals' as StatKey,
    icon: '⚽',
    label: 'Гол',
    bgClass: 'bg-emerald-500/15 border-emerald-500/20',
    textClass: 'text-emerald-300',
    removeClass: 'text-emerald-500/60 md:hover:bg-emerald-500/20 md:hover:text-emerald-300',
    addingClass: 'text-emerald-500/60 md:hover:bg-emerald-500/20 md:hover:text-emerald-300',
  },
  {
    key: 'assists' as StatKey,
    icon: '🎯',
    label: 'Ассист',
    bgClass: 'bg-sky-500/15 border-sky-500/20',
    textClass: 'text-sky-300',
    removeClass: 'text-sky-500/60 md:hover:bg-sky-500/20 md:hover:text-sky-300',
    addingClass: 'text-sky-500/60 md:hover:bg-sky-500/20 md:hover:text-sky-300',
  },
  {
    key: 'saves' as StatKey,
    icon: '🧤',
    label: 'Сейв',
    bgClass: 'bg-violet-500/15 border-violet-500/20',
    textClass: 'text-violet-300',
    removeClass: 'text-violet-500/60 md:hover:bg-violet-500/20 md:hover:text-violet-300',
    addingClass: 'text-violet-500/60 md:hover:bg-violet-500/20 md:hover:text-violet-300',
  },
  {
    key: 'yellows' as StatKey,
    icon: '🟨',
    label: 'Жёлтая',
    bgClass: 'bg-yellow-500/15 border-yellow-500/20',
    textClass: 'text-yellow-300',
    removeClass: 'text-yellow-500/60 md:hover:bg-yellow-500/20 md:hover:text-yellow-300',
    addingClass: 'text-yellow-500/60 md:hover:bg-yellow-500/20 md:hover:text-yellow-300',
  },
] as const

// Какой матч раскрыт для деталей.
const openMatch = ref<number | null>(null)

// Какой матч редактируется.
const editMatch = ref<number | null>(null)

// Матч, ожидающий подтверждения удаления (двухшаговая защита от случайного нажатия).
const confirmDeleteMatch = ref<number | null>(null)

function requestDelete(matchNumber: number) {
  // Первый клик — запрашиваем подтверждение.
  confirmDeleteMatch.value = matchNumber
}

function confirmDelete(matchNumber: number) {
  // Второй клик — удаляем и сбрасываем все раскрытые состояния этого матча.
  props.deletePlayedMatch(matchNumber)
  if (openMatch.value === matchNumber) openMatch.value = null
  if (editMatch.value === matchNumber) cancelEdit()
  confirmDeleteMatch.value = null
}

function cancelDelete() {
  confirmDeleteMatch.value = null
}

// Какой игрок раскрыт в редакторе (ключ = side-playerId).
const openEditPlayer = ref<string | null>(null)

// Черновик без явных homeGoals/awayGoals — они вычисляются из статистики.
const draft = ref<DraftState | null>(null)

// Голы команд считаются автоматически из голов игроков — не нужно вводить вручную.
const draftHomeGoals = computed(() =>
  draft.value ? Object.values(draft.value.homeStats).reduce((s, st) => s + st.goals, 0) : 0,
)
const draftAwayGoals = computed(() =>
  draft.value ? Object.values(draft.value.awayStats).reduce((s, st) => s + st.goals, 0) : 0,
)

// Уникальный ключ для игрока в редакторе.
function editPlayerKey(side: string, playerId: number): string {
  return `${side}-${playerId}`
}

// Переключение детальной панели матча.
function toggleDetails(matchNumber: number) {
  if (editMatch.value === matchNumber) cancelEdit()
  openMatch.value = openMatch.value === matchNumber ? null : matchNumber
}

// Переключение раскрытия контролов игрока в редакторе.
function toggleEditPlayer(side: string, playerId: number) {
  const key = editPlayerKey(side, playerId)
  openEditPlayer.value = openEditPlayer.value === key ? null : key
}

// Открыть редактор — глубокая копия stats без явных голов.
function toggleEdit(m: PlayedMatch) {
  if (editMatch.value === m.matchNumber) {
    cancelEdit()
    return
  }
  editMatch.value = m.matchNumber
  openMatch.value = null
  openEditPlayer.value = null
  draft.value = {
    homeStats: deepCopyStats(m.homeStats),
    awayStats: deepCopyStats(m.awayStats),
  }
}

// Сохранить — голы берём из вычисленных computed значений.
function saveEdit(matchNumber: number) {
  if (!draft.value) return
  props.updatePlayedMatch(
    matchNumber,
    draftHomeGoals.value,
    draftAwayGoals.value,
    draft.value.homeStats,
    draft.value.awayStats,
  )
  cancelEdit()
}

function cancelEdit() {
  editMatch.value = null
  draft.value = null
  openEditPlayer.value = null
}

// Глубокое копирование stats — черновик не ссылается на оригинал.
function deepCopyStats(stats: Record<number, PlayerMatchStats>): Record<number, PlayerMatchStats> {
  const copy: Record<number, PlayerMatchStats> = {}
  for (const [id, s] of Object.entries(stats)) {
    copy[Number(id)] = { ...s }
  }
  return copy
}

// Получить значение счётчика (0 если нет записи).
function getEditStat(statsRecord: Record<number, PlayerMatchStats>, playerId: number, key: StatKey): number {
  return statsRecord[playerId]?.[key] ?? 0
}

// Изменить счётчик на delta, не ниже 0.
function changeStat(statsRecord: Record<number, PlayerMatchStats>, playerId: number, key: StatKey, delta: number) {
  if (!statsRecord[playerId]) {
    statsRecord[playerId] = { goals: 0, assists: 0, saves: 0, yellows: 0 }
  }
  statsRecord[playerId][key] = Math.max(0, statsRecord[playerId][key] + delta)
}

// Есть ли хоть одно событие у игрока в переданных stats.
function hasAnyStat(statsRecord: Record<number, PlayerMatchStats>, playerId: number): boolean {
  const s = statsRecord[playerId]
  if (!s) return false
  return s.goals > 0 || s.assists > 0 || s.saves > 0 || s.yellows > 0
}

// Строим короткую строку событий для превью в редакторе.
function buildLabel(statsRecord: Record<number, PlayerMatchStats>, playerId: number): string {
  const s = statsRecord[playerId]
  if (!s) return ''
  const parts: string[] = []
  if (s.goals > 0) parts.push(`⚽${s.goals}`)
  if (s.assists > 0) parts.push(`🎯${s.assists}`)
  if (s.saves > 0) parts.push(`🧤${s.saves}`)
  if (s.yellows > 0) parts.push(`🟨${s.yellows}`)
  return parts.join(' ')
}

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
