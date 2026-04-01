<!-- Компонент StepStandingsTeamRosterColumn: колонка игроков команды — выбор и добавление событий. -->
<template>
  <div class="flex flex-col gap-1.5 p-2 sm:p-3">

    <!-- Заголовок колонки: маркер + название команды -->
    <div class="mb-1 flex min-w-0 items-center gap-1.5 px-0.5">
      <span v-if="teamName" aria-hidden="true" class="shrink-0 text-base leading-none">
        {{ teamMarker(teamName) }}
      </span>
      <span class="min-w-0 truncate text-xs font-semibold uppercase tracking-wider text-slate-400">
        {{ teamName }}
      </span>
    </div>

    <!-- Список игроков -->
    <ul class="min-h-0 space-y-1.5" role="list">
      <li
        v-for="(p, idx) in players"
        :key="p.id"
        class="relative min-w-0 overflow-visible rounded-xl border transition-colors duration-150"
        :class="isActivePlayer(side, p.id)
          ? ['z-20 border-slate-600/70', activeShadowClass]
          : 'z-0 border-transparent'"
      >
        <!-- Строка игрока: одна строка — имя слева, бейджи справа -->
        <button
          type="button"
          class="h-12 flex w-full min-w-0 items-center gap-2 px-3 text-left
                 transition-colors active:opacity-80
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          :class="[playerBg(isActivePlayer(side, p.id)), !isActivePlayer(side, p.id) && 'md:hover:brightness-125']"
          @click="handlePlayerRowClick(side, p.id)"
        >
          <AtomsPlayerAvatar
            class="shrink-0"
            :photo="p.photo"
            :fallback-name="p.name"
            size="md"
          />
          <!-- Имя: растягивается, обрезается если длинное -->
          <span class="min-w-0 flex-1 truncate text-sm font-medium leading-tight text-slate-100">
            {{ displayPlayerLabel(p) }}
          </span>

          <!-- Бейджи событий — только показ счётчика, без кнопки «−» на карточке -->
          <!-- Убираем «−» отсюда, чтобы исключить случайные нажатия вне dropdown -->
          <div class="flex shrink-0 items-center gap-1">
            <template v-for="stat in STAT_BADGES" :key="stat.key">
              <span
                v-if="playerStat(side, p.id)[stat.key] > 0"
                class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                :class="[stat.bgClass, stat.textClass]"
              >
                {{ stat.icon }}{{ playerStat(side, p.id)[stat.key] }}
              </span>
            </template>
          </div>

          <!-- Шеврон — показывает что строку можно раскрыть -->
          <svg
            class="h-4 w-4 shrink-0 transition-transform duration-200"
            :class="isActivePlayer(side, p.id) ? 'rotate-180 text-slate-300' : 'text-slate-600'"
            viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
          >
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
          </svg>
        </button>

        <!-- Панель событий: для активного игрока — 4 карточки, каждая с «+» и «−» -->
        <!-- «+» добавляет событие и закрывает панель; «−» убирает одно событие, если оно есть -->
        <Transition
          enter-active-class="transition-all duration-150 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-100 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <div
            v-if="isActivePlayer(side, p.id)"
            class="absolute left-0 right-0 z-30 rounded-xl border border-slate-700/60
                   bg-slate-950/95 px-2.5 py-2.5 shadow-xl shadow-slate-950/40 backdrop-blur-sm"
            :class="opensUp(idx, players.length) ? 'bottom-full mb-1.5' : 'top-full mt-1.5'"
          >
            <!-- 2 колонки × 2 строки — каждая карточка шире, кнопкам есть куда разместиться -->
            <div class="grid grid-cols-2 gap-2">
              <!-- Карточка события: иконка по центру, кнопки «−» и «+» по бокам в одну строку -->
              <div
                v-for="action in EVENT_ACTIONS"
                :key="action.value"
                class="flex items-center overflow-hidden rounded-xl border border-transparent"
                :class="action.colorClass"
              >
                <!-- Кнопка «−»: занимает фиксированную ширину, высота равна всей карточке -->
                <!-- disabled когда нечего убирать — прозрачная, не кликается -->
                <button
                  type="button"
                  class="flex h-14 w-12 shrink-0 items-center justify-center text-xl font-bold
                         transition-colors active:scale-95
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40
                         disabled:opacity-20 disabled:cursor-not-allowed"
                  :class="action.removeBtnClass"
                  :disabled="playerStat(side, p.id)[action.value] === 0"
                  :title="'Отменить: ' + action.label"
                  @click.stop="removeAndClose(side, p.id, action.value)"
                >
                  −
                </button>

                <!-- Центр карточки: только иконка — информация без счётчика -->
                <div class="flex min-w-0 flex-1 items-center justify-center py-2">
                  <span class="text-2xl leading-none">{{ action.icon }}</span>
                </div>

                <!-- Кнопка «+»: добавить событие и закрыть панель -->
                <button
                  type="button"
                  class="flex h-14 w-12 shrink-0 items-center justify-center text-xl font-bold
                         transition-colors active:scale-95
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                  :class="action.addBtnClass"
                  :title="'Добавить: ' + action.label"
                  @click.stop="fireAndClose(side, p.id, action.value)"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </Transition>

      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { StatKey } from '~/composables/tournament-standings/types'

type Side = 'home' | 'away'
// Сторона матча: домашняя или гостевая.

type PlayerMatchStats = {
  goals: number
  assists: number
  saves: number
  yellows: number
}
// Счётчики событий игрока в текущем матче.

// Конфигурация карточек событий в дропдауне.
// colorClass — общий фон и рамка карточки.
// countClass — цвет счётчика текущих очков.
// addBtnClass — стиль кнопки «+» (добавить).
// removeBtnClass — стиль кнопки «−» (убрать), когда она активна.
const EVENT_ACTIONS = [
  {
    value: 'goals' as StatKey,
    icon: '⚽',
    label: 'Гол',
    colorClass: 'bg-emerald-500/10 border-emerald-500/25',
    countClass: 'text-emerald-300',
    addBtnClass: 'text-emerald-300 md:hover:bg-emerald-500/20',
    removeBtnClass: 'text-emerald-500/70 md:hover:bg-emerald-500/20 md:hover:text-emerald-300',
  },
  {
    value: 'assists' as StatKey,
    icon: '🎯',
    label: 'Ассист',
    colorClass: 'bg-sky-500/10 border-sky-500/25',
    countClass: 'text-sky-300',
    addBtnClass: 'text-sky-300 md:hover:bg-sky-500/20',
    removeBtnClass: 'text-sky-500/70 md:hover:bg-sky-500/20 md:hover:text-sky-300',
  },
  {
    value: 'saves' as StatKey,
    icon: '🧤',
    label: 'Сейв',
    colorClass: 'bg-violet-500/10 border-violet-500/25',
    countClass: 'text-violet-300',
    addBtnClass: 'text-violet-300 md:hover:bg-violet-500/20',
    removeBtnClass: 'text-violet-500/70 md:hover:bg-violet-500/20 md:hover:text-violet-300',
  },
  {
    value: 'yellows' as StatKey,
    icon: '🟨',
    label: 'Жёлтая',
    colorClass: 'bg-yellow-500/10 border-yellow-500/25',
    countClass: 'text-yellow-300',
    addBtnClass: 'text-yellow-300 md:hover:bg-yellow-500/20',
    removeBtnClass: 'text-yellow-500/70 md:hover:bg-yellow-500/20 md:hover:text-yellow-300',
  },
] as const

// Конфигурация бейджей на карточке игрока — только фон и цвет текста (без кнопки «−»).
const STAT_BADGES = [
  { key: 'goals' as StatKey,   icon: '⚽', bgClass: 'bg-emerald-500/15', textClass: 'text-emerald-300' },
  { key: 'assists' as StatKey, icon: '🎯', bgClass: 'bg-sky-500/15',     textClass: 'text-sky-300' },
  { key: 'saves' as StatKey,   icon: '🧤', bgClass: 'bg-violet-500/15',  textClass: 'text-violet-300' },
  { key: 'yellows' as StatKey, icon: '🟨', bgClass: 'bg-yellow-500/15',  textClass: 'text-yellow-300' },
] as const

const rosterColumnProps = defineProps<{
  side: Side
  teamName: string
  players: Player[]
  activeShadowClass: string
  teamColorIndex: number
  teamMarker: (teamName: string) => string
  displayPlayerLabel: (player: Player) => string
  isActivePlayer: (side: Side, playerId: number) => boolean
  selectPlayerForMark: (side: Side, playerId: number) => void
  playerStat: (side: Side, playerId: number) => PlayerMatchStats
  addPlayerEvent: (side: Side, playerId: number, key: StatKey) => void
  removePlayerEvent: (side: Side, playerId: number, key: StatKey) => void
}>()

// Маппинг индекса цвета команды → очень слабый фон для строки игрока.
// Цвета соответствуют маркерам: 🔴🟢🔵🟡⚪⚫
// Прозрачность /5–/8 — едва заметный оттенок, не бросается в глаза.
const TEAM_COLOR_BG: Record<number, string> = {
  0: 'bg-red-500/5',
  1: 'bg-emerald-500/5',
  2: 'bg-blue-500/5',
  3: 'bg-yellow-500/5',
  4: 'bg-slate-300/5',
  5: 'bg-slate-900/5',
}

// Слегка более тёмный фон когда строка игрока активна (выбрана).
const TEAM_COLOR_BG_ACTIVE: Record<number, string> = {
  0: 'bg-red-500/10',
  1: 'bg-emerald-500/10',
  2: 'bg-blue-500/10',
  3: 'bg-yellow-500/10',
  4: 'bg-slate-300/10',
  5: 'bg-slate-900/10',
}

function playerBg(isActive: boolean): string {
  const idx = rosterColumnProps.teamColorIndex
  return isActive
    ? (TEAM_COLOR_BG_ACTIVE[idx] ?? 'bg-slate-800/60')
    : (TEAM_COLOR_BG[idx] ?? 'bg-slate-800/40')
}

// Клик по строке игрока — выбирает или снимает выбор (toggle).
function handlePlayerRowClick(side: Side, playerId: number) {
  rosterColumnProps.selectPlayerForMark(side, playerId)
}

// Добавляет событие и сразу закрывает панель — меньше лишних действий на телефоне.
function fireAndClose(side: Side, playerId: number, key: StatKey) {
  rosterColumnProps.addPlayerEvent(side, playerId, key)
  rosterColumnProps.selectPlayerForMark(side, playerId)
}

// Убирает событие и сразу закрывает панель — то же поведение что у «+».
function removeAndClose(side: Side, playerId: number, key: StatKey) {
  rosterColumnProps.removePlayerEvent(side, playerId, key)
  rosterColumnProps.selectPlayerForMark(side, playerId)
}

// Для последних строк открываем панель вверх, чтобы она не обрезалась снизу.
function opensUp(index: number, total: number): boolean {
  return index === total - 1
}
</script>
