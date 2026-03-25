<!-- Компонент PlayedMatchEditor: inline-редактор статистики игроков для завершённого матча. -->
<template>
  <div class="border-t border-slate-700/60 bg-slate-950/60">
    <!-- Авто-счёт: голы считаются из статистики игроков -->
    <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-3">
      <span class="min-w-0 truncate text-xs font-semibold uppercase tracking-wider text-slate-500">
        {{ match.homeTeam }}
      </span>
      <div class="flex shrink-0 flex-col items-center gap-0.5">
        <span class="text-[10px] uppercase tracking-widest text-slate-600">Счёт</span>
        <span class="font-mono text-lg font-bold tabular-nums text-slate-100">
          {{ draftHomeGoals }}&nbsp;:&nbsp;{{ draftAwayGoals }}
        </span>
      </div>
      <span class="min-w-0 truncate text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
        {{ match.awayTeam }}
      </span>
    </div>

    <!-- Статистика по командам -->
    <div class="grid grid-cols-1 gap-0 divide-y divide-slate-800/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
      <!-- Домашняя команда -->
      <div class="px-3 pb-3 pt-2">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {{ teamMarker(match.homeTeam) }} {{ match.homeTeam }}
        </p>
        <div class="space-y-1.5">
          <div v-for="p in homePlayers" :key="p.id" class="min-w-0">
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
          {{ teamMarker(match.awayTeam) }} {{ match.awayTeam }}
        </p>
        <div class="space-y-1.5">
          <div v-for="p in awayPlayers" :key="p.id" class="min-w-0">
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
        @click="save"
      >
        Сохранить
      </button>
      <button
        type="button"
        class="rounded-xl bg-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300
               transition-colors md:hover:bg-slate-600 focus:outline-none"
        @click="emit('cancel')"
      >
        Отмена
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { PlayerMatchStats, StatKey } from '~/composables/tournament-standings/types'
import { computed, ref } from 'vue'

type DraftState = {
  homeStats: Record<number, PlayerMatchStats>
  awayStats: Record<number, PlayerMatchStats>
}
// Это черновик матча без явных голов — они считаются из stats игроков.

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
  match: PlayedMatch
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
}>()

const emit = defineEmits<{
  cancel: []
}>()

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

// Открытый игрок в редакторе (ключ = side-playerId).
const openEditPlayer = ref<string | null>(null)

// Черновик матча — глубокая копия stats.
const draft = ref<DraftState>({
  homeStats: deepCopyStats(props.match.homeStats),
  awayStats: deepCopyStats(props.match.awayStats),
})

// Голы команд считаются автоматически из голов игроков — не нужно вводить вручную.
const draftHomeGoals = computed(() =>
  Object.values(draft.value.homeStats).reduce((s, st) => s + st.goals, 0),
)
const draftAwayGoals = computed(() =>
  Object.values(draft.value.awayStats).reduce((s, st) => s + st.goals, 0),
)

const homePlayers = computed(() => props.playersByTeam(props.match.homeTeam))
const awayPlayers = computed(() => props.playersByTeam(props.match.awayTeam))

function editPlayerKey(side: string, playerId: number): string {
  return `${side}-${playerId}`
}
// Это уникальный ключ для игрока в редакторе.

function toggleEditPlayer(side: string, playerId: number) {
  const key = editPlayerKey(side, playerId)
  openEditPlayer.value = openEditPlayer.value === key ? null : key
}
// Это раскрывает/скрывает контролы игрока.

function deepCopyStats(stats: Record<number, PlayerMatchStats>): Record<number, PlayerMatchStats> {
  const copy: Record<number, PlayerMatchStats> = {}
  for (const [id, s] of Object.entries(stats)) {
    copy[Number(id)] = { ...s }
  }
  return copy
}
// Это копирует stats, чтобы черновик не трогал оригинал.

function getEditStat(statsRecord: Record<number, PlayerMatchStats>, playerId: number, key: StatKey): number {
  return statsRecord[playerId]?.[key] ?? 0
}
// Это безопасно читает счётчик (если нет записи — 0).

function changeStat(statsRecord: Record<number, PlayerMatchStats>, playerId: number, key: StatKey, delta: number) {
  if (!statsRecord[playerId]) {
    statsRecord[playerId] = { goals: 0, assists: 0, saves: 0, yellows: 0 }
  }
  statsRecord[playerId][key] = Math.max(0, statsRecord[playerId][key] + delta)
}
// Это меняет счётчик и не даёт уйти ниже 0.

function hasAnyStat(statsRecord: Record<number, PlayerMatchStats>, playerId: number): boolean {
  const s = statsRecord[playerId]
  if (!s) return false
  return s.goals > 0 || s.assists > 0 || s.saves > 0 || s.yellows > 0
}
// Это проверяет: у игрока есть хоть одно событие.

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
// Это короткая строка событий для превью в списке.

function save() {
  props.updatePlayedMatch(
    props.match.matchNumber,
    draftHomeGoals.value,
    draftAwayGoals.value,
    draft.value.homeStats,
    draft.value.awayStats,
  )
  emit('cancel')
}
// Это сохраняет изменения и закрывает редактор.
</script>

