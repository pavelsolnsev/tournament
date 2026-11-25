<!-- Компонент PlayedMatchEditor: inline-редактор статистики игроков для завершённого матча. -->
<template>
  <div class="border-t border-slate-200 bg-slate-50 dark:border-slate-700/60 dark:bg-slate-950/60">
    <!-- Авто-счёт: голы считаются из статистики игроков -->
    <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-3">
      <span class="min-w-0 truncate text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-500">
        {{ teamDisplayNameByMarker(match.homeTeam, teamMarker(match.homeTeam)) }}
      </span>
      <div class="flex shrink-0 flex-col items-center gap-0.5">
        <span class="text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-600">Счёт</span>
        <span
          class="rounded-md px-2 py-0.5 font-mono text-lg font-bold tabular-nums ring-1"
          :class="draftScorePillClass"
        >
          {{ draftHomeGoals }}&nbsp;:&nbsp;{{ draftAwayGoals }}
        </span>
      </div>
      <span class="min-w-0 truncate text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-500">
        {{ teamDisplayNameByMarker(match.awayTeam, teamMarker(match.awayTeam)) }}
      </span>
    </div>

    <!-- Статистика по командам -->
    <div class="grid grid-cols-1 gap-0 divide-y divide-slate-200 dark:divide-slate-800/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
      <!-- Домашняя команда -->
      <div class="px-3 pb-3 pt-2">
        <!-- Заголовок команды: маркер + название — единый стиль с остальными колонками -->
        <div class="mb-2 flex min-w-0 items-center gap-1.5 px-0.5">
          <AtomsTeamMarkerOrLogo :team-name="match.homeTeam" :marker="teamMarker(match.homeTeam)" size="md" />
          <span class="min-w-0 truncate text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{{ teamDisplayNameByMarker(match.homeTeam, teamMarker(match.homeTeam)) }}</span>
        </div>
        <div class="space-y-1.5">
          <div v-for="p in homePlayers" :key="p.id" class="min-w-0">
            <button
              type="button"
              class="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl px-3 py-2.5
                     text-left transition-colors md:hover:bg-slate-200/90 dark:md:hover:bg-slate-800/60 focus:outline-none"
              :class="openEditPlayer === editPlayerKey('home', p.id) ? 'bg-slate-200 dark:bg-slate-800/70' : 'bg-slate-100 dark:bg-slate-800/40'"
              @click="toggleEditPlayer('home', p.id)"
            >
              <AtomsPlayerAvatar
                class="shrink-0"
                :photo="p.photo"
                :fallback-name="p.name"
                size="md"
              />
              <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">{{ displayPlayerLabel(p) }}</span>
              <!-- Бейджи событий в строке превью — такой же стиль как везде -->
              <div v-if="hasAnyStat(draft.homeStats, p.id)" class="flex shrink-0 items-center gap-1">
                <template v-for="badge in STAT_BADGES" :key="badge.key">
                  <span
                    v-if="getEditStat(draft.homeStats, p.id, badge.key) > 0"
                    class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                    :class="[badge.bgClass, badge.textClass]"
                  >
                    {{ badge.icon }}{{ getEditStat(draft.homeStats, p.id, badge.key) }}
                  </span>
                </template>
              </div>
              <svg
                class="h-4 w-4 shrink-0 transition-transform duration-150"
                :class="openEditPlayer === editPlayerKey('home', p.id) ? 'rotate-180 text-slate-600 dark:text-slate-400' : 'text-slate-600 dark:text-slate-600'"
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
        <!-- Заголовок команды: маркер + название — единый стиль с остальными колонками -->
        <div class="mb-2 flex min-w-0 items-center gap-1.5 px-0.5">
          <AtomsTeamMarkerOrLogo :team-name="match.awayTeam" :marker="teamMarker(match.awayTeam)" size="md" />
          <span class="min-w-0 truncate text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{{ teamDisplayNameByMarker(match.awayTeam, teamMarker(match.awayTeam)) }}</span>
        </div>
        <div class="space-y-1.5">
          <div v-for="p in awayPlayers" :key="p.id" class="min-w-0">
            <button
              type="button"
              class="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl px-3 py-2.5
                     text-left transition-colors md:hover:bg-slate-200/90 dark:md:hover:bg-slate-800/60 focus:outline-none"
              :class="openEditPlayer === editPlayerKey('away', p.id) ? 'bg-slate-200 dark:bg-slate-800/70' : 'bg-slate-100 dark:bg-slate-800/40'"
              @click="toggleEditPlayer('away', p.id)"
            >
              <AtomsPlayerAvatar
                class="shrink-0"
                :photo="p.photo"
                :fallback-name="p.name"
                size="md"
              />
              <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">{{ displayPlayerLabel(p) }}</span>
              <!-- Бейджи событий в строке превью — такой же стиль как везде -->
              <div v-if="hasAnyStat(draft.awayStats, p.id)" class="flex shrink-0 items-center gap-1">
                <template v-for="badge in STAT_BADGES" :key="badge.key">
                  <span
                    v-if="getEditStat(draft.awayStats, p.id, badge.key) > 0"
                    class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                    :class="[badge.bgClass, badge.textClass]"
                  >
                    {{ badge.icon }}{{ getEditStat(draft.awayStats, p.id, badge.key) }}
                  </span>
                </template>
              </div>
              <svg
                class="h-4 w-4 shrink-0 transition-transform duration-150"
                :class="openEditPlayer === editPlayerKey('away', p.id) ? 'rotate-180 text-slate-600 dark:text-slate-400' : 'text-slate-600 dark:text-slate-600'"
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

    <p v-if="props.updateArchiveMatch" class="px-3 pt-2 text-xs text-slate-600 dark:text-slate-300">Правка обновит протокол и итоги этого турнира. В общем рейтинге используются уже начисленные баллы.</p>
    <p v-if="saveError" role="alert" class="px-3 pt-2 text-sm text-red-700 dark:text-red-300">{{ saveError }}</p>
    <!-- Сохранить / Отмена — h-11 = единая высота с основными кнопками сайта -->
    <div class="flex items-center gap-2 border-t border-slate-200 px-3 py-2.5 dark:border-slate-800/60">
      <button
        type="button"
        class="inline-flex h-11 items-center rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white
               transition-colors md:hover:bg-emerald-600 active:bg-emerald-700
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50
               dark:text-slate-900 dark:md:hover:bg-emerald-400 dark:active:bg-emerald-600"
        :disabled="saving"
        @click="save"
      >
        {{ saving ? 'Сохраняем…' : 'Сохранить' }}
      </button>
      <button
        type="button"
        class="inline-flex h-11 items-center rounded-xl bg-slate-200 px-5 text-sm font-medium text-slate-700
               transition-colors md:hover:bg-slate-300
               focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40
               dark:bg-slate-700 dark:text-slate-300 dark:md:hover:bg-slate-600 dark:focus-visible:ring-slate-500/40"
        :disabled="saving"
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
import { useTeamColors } from '~/composables/useTeamColors'
import { resolveTeamColorIndex } from '~/utils/teamNames'
import { teamDisplayNameByMarker } from '~/utils/teamDisplayName'
import { archiveMatchScore, archiveSideStats, type UpdateArchiveMatch } from '~/utils/archiveMatchStats'
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

const props = withDefaults(
  defineProps<{
    match: PlayedMatch
    teamMarker: (teamName: string) => string
    teamColorByName?: Record<string, number>
    playersByTeam: (teamName: string) => Player[]
    displayPlayerLabel: (player: Player) => string
    updateArchiveMatch?: UpdateArchiveMatch
    updatePlayedMatch: (
      matchNumber: number,
      homeGoals: number,
      awayGoals: number,
      homeStats: Record<number, PlayerMatchStats>,
      awayStats: Record<number, PlayerMatchStats>,
    ) => void
  }>(),
  { teamColorByName: () => ({}) },
)

const emit = defineEmits<{
  cancel: []
}>()

// Конфигурация бейджей для превью строки игрока — единый стиль с остальными списками сайта.
const STAT_BADGES = [
  { key: 'goals'   as StatKey, icon: '⚽', bgClass: 'bg-emerald-500/15', textClass: 'text-emerald-900 dark:text-emerald-300' },
  { key: 'assists' as StatKey, icon: '🎯', bgClass: 'bg-sky-500/15',     textClass: 'text-sky-900 dark:text-sky-300' },
  { key: 'saves'   as StatKey, icon: '🧤', bgClass: 'bg-violet-500/15',  textClass: 'text-violet-900 dark:text-violet-300' },
  { key: 'yellows' as StatKey, icon: '🟨', bgClass: 'bg-amber-500/15',  textClass: 'text-amber-950 dark:text-yellow-300' },
  { key: 'reds' as StatKey,    icon: '🟥', bgClass: 'bg-red-500/15',    textClass: 'text-red-900 dark:text-red-300' },
] as const

// Конфигурация полей статистики.
const STAT_DEFS = [
  {
    key: 'goals' as StatKey,
    icon: '⚽',
    label: 'Гол',
    bgClass: 'bg-emerald-50 border-emerald-200/90 dark:bg-emerald-500/15 dark:border-emerald-500/20',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    removeClass: 'text-emerald-700 dark:text-emerald-400 md:hover:bg-emerald-100 dark:md:hover:bg-emerald-500/20 md:hover:text-emerald-800 dark:md:hover:text-emerald-300',
    addingClass: 'text-emerald-600 dark:text-emerald-300 md:hover:bg-emerald-100 dark:md:hover:bg-emerald-500/20',
  },
  {
    key: 'assists' as StatKey,
    icon: '🎯',
    label: 'Ассист',
    bgClass: 'bg-sky-50 border-sky-200/90 dark:bg-sky-500/15 dark:border-sky-500/20',
    textClass: 'text-sky-700 dark:text-sky-300',
    removeClass: 'text-sky-700 dark:text-sky-400 md:hover:bg-sky-100 dark:md:hover:bg-sky-500/20 md:hover:text-sky-800 dark:md:hover:text-sky-300',
    addingClass: 'text-sky-600 dark:text-sky-300 md:hover:bg-sky-100 dark:md:hover:bg-sky-500/20',
  },
  {
    key: 'saves' as StatKey,
    icon: '🧤',
    label: 'Сейв',
    bgClass: 'bg-violet-50 border-violet-200/90 dark:bg-violet-500/15 dark:border-violet-500/20',
    textClass: 'text-violet-700 dark:text-violet-300',
    removeClass: 'text-violet-700 dark:text-violet-400 md:hover:bg-violet-100 dark:md:hover:bg-violet-500/20 md:hover:text-violet-800 dark:md:hover:text-violet-300',
    addingClass: 'text-violet-600 dark:text-violet-300 md:hover:bg-violet-100 dark:md:hover:bg-violet-500/20',
  },
  {
    key: 'yellows' as StatKey,
    icon: '🟨',
    label: 'Жёлтая',
    bgClass: 'bg-amber-50 border-amber-200/90 dark:bg-yellow-500/15 dark:border-yellow-500/20',
    textClass: 'text-amber-800 dark:text-yellow-300',
    removeClass: 'text-amber-800 dark:text-yellow-400 md:hover:bg-amber-100 dark:md:hover:bg-yellow-500/20 md:hover:text-amber-900 dark:md:hover:text-yellow-300',
    addingClass: 'text-amber-700 dark:text-yellow-300 md:hover:bg-amber-100 dark:md:hover:bg-yellow-500/20',
  },
  {
    key: 'reds' as StatKey,
    icon: '🟥',
    label: 'Красная',
    bgClass: 'bg-red-50 border-red-200/90 dark:bg-red-500/15 dark:border-red-500/20',
    textClass: 'text-red-700 dark:text-red-300',
    removeClass: 'text-red-700 dark:text-red-400 md:hover:bg-red-100 dark:md:hover:bg-red-500/20 md:hover:text-red-800 dark:md:hover:text-red-300',
    addingClass: 'text-red-600 dark:text-red-300 md:hover:bg-red-100 dark:md:hover:bg-red-500/20',
  },
] as const

// Открытый игрок в редакторе (ключ = side-playerId).
const openEditPlayer = ref<string | null>(null)

// Черновик матча — глубокая копия stats.
const draft = ref<DraftState>({
  homeStats: props.updateArchiveMatch ? archiveSideStats(props.match.homeStats, props.match.homePlayers) : deepCopyStats(props.match.homeStats),
  awayStats: props.updateArchiveMatch ? archiveSideStats(props.match.awayStats, props.match.awayPlayers) : deepCopyStats(props.match.awayStats),
})

// Голы команд считаются автоматически из голов игроков — не нужно вводить вручную.
const draftHomeGoals = computed(() =>
  props.updateArchiveMatch
    ? archiveMatchScore(props.match.homeGoals, archiveSideStats(props.match.homeStats, props.match.homePlayers), draft.value.homeStats)
    : Object.values(draft.value.homeStats).reduce((s, st) => s + st.goals, 0),
)
const draftAwayGoals = computed(() =>
  props.updateArchiveMatch
    ? archiveMatchScore(props.match.awayGoals, archiveSideStats(props.match.awayStats, props.match.awayPlayers), draft.value.awayStats)
    : Object.values(draft.value.awayStats).reduce((s, st) => s + st.goals, 0),
)

const { getMatchScorePillClass } = useTeamColors()

// Черновой счёт подкрашиваем так же, как зафиксированный — видно, кто ведёт.
const draftScorePillClass = computed(() =>
  getMatchScorePillClass(
    draftHomeGoals.value,
    draftAwayGoals.value,
    props.match.homeTeam,
    props.match.awayTeam,
    (name) => resolveTeamColorIndex(name, props.teamColorByName, 0),
  ),
)

function editablePlayers(side: 'home' | 'away') {
  const match = props.match
  const team = props.playersByTeam(match[`${side}Team`])
  if (!props.updateArchiveMatch) return team
  const opposite = side === 'home' ? 'away' : 'home'
  const own = archiveSideStats(match[`${side}Stats`], match[`${side}Players`])
  const opponents = archiveSideStats(match[`${opposite}Stats`], match[`${opposite}Players`])
  const result = new Map(team.filter(player => !Object.hasOwn(opponents, player.id) || Object.hasOwn(own, player.id))
    .map(player => [player.id, player]))
  for (const id of Object.keys(own).map(Number)) {
    const marked = match[`${side}Players`]?.find(player => player.playerId === id)
    if (!result.has(id)) result.set(id, { id, name: marked?.name ?? `Игрок #${id}`, username: null })
  }
  return [...result.values()]
}

const homePlayers = computed(() => editablePlayers('home'))
const awayPlayers = computed(() => editablePlayers('away'))
const saving = ref(false)
const saveError = ref('')

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
  if (saving.value) return
  const current = statsRecord[playerId] ?? { goals: 0, assists: 0, saves: 0, yellows: 0, reds: 0 }
  statsRecord[playerId] = { ...current, [key]: Math.max(0, (current[key] ?? 0) + delta) }
}
// Это меняет счётчик и не даёт уйти ниже 0.

function hasAnyStat(statsRecord: Record<number, PlayerMatchStats>, playerId: number): boolean {
  const s = statsRecord[playerId]
  if (!s) return false
  return s.goals > 0 || s.assists > 0 || s.saves > 0 || s.yellows > 0 || (s.reds ?? 0) > 0
}
// Это проверяет: у игрока есть хоть одно событие.


async function save() {
  if (saving.value) return
  if (props.updateArchiveMatch) {
    saving.value = true
    saveError.value = ''
    try {
      await props.updateArchiveMatch(props.match, draft.value.homeStats, draft.value.awayStats)
      emit('cancel')
    } catch (error) {
      saveError.value = (error as { data?: { data?: { message?: string } } }).data?.data?.message
        ?? 'Не удалось сохранить статистику. Попробуйте ещё раз.'
    } finally {
      saving.value = false
    }
    return
  }
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

