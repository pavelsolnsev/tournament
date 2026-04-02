<template>
  <!-- min-h-full вместо min-h-screen — высота от #scroll-root (fixed контейнера). -->
  <div class="flex min-h-full flex-col bg-slate-900 text-slate-100">
    <!-- Шапка: absolute + safe-area сверху, не двигает контент -->
    <header class="absolute inset-x-0 top-0 z-20 border-b border-slate-800/70 bg-slate-900/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div class="mx-auto flex w-full min-w-0 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6 h-14">
        <div class="min-w-0 flex-1 flex items-center gap-2.5">
          <div class="min-w-0">
            <h1 class="truncate text-base font-bold text-slate-50 sm:text-lg leading-tight">
              {{ tournamentName || 'Турнир' }}
            </h1>
            <p v-if="tournamentDate" class="truncate text-xs text-slate-400 leading-tight mt-0.5">
              {{ tournamentDate }}
            </p>
          </div>

          <!-- Бейдж статуса — сразу видно идёт ли матч сейчас -->
          <AtomsMatchStatusBadge
            v-if="matchStatus"
            :status="matchStatus"
            class="shrink-0"
          />
        </div>

        <!-- Кнопка «Войти»: спокойная (для владельца), но с нормальной тач-зоной -->
        <button
          type="button"
          class="shrink-0 inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200 active:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          aria-label="Войти как администратор"
          @click="onAdminEnter"
        >
          <span aria-hidden="true">🔐</span>
          Войти
        </button>
      </div>

      <!-- Строка с текущими командами Live-матча — показывается только когда матч идёт -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out overflow-hidden"
        enter-from-class="max-h-0 opacity-0"
        enter-to-class="max-h-40 opacity-100"
        leave-active-class="transition-all duration-200 ease-in overflow-hidden"
        leave-from-class="max-h-40 opacity-100"
        leave-to-class="max-h-0 opacity-0"
      >
        <div
          v-if="matchStatus === 'live' && liveHomeTeam && liveAwayTeam"
          class="border-t border-red-500/20 bg-red-500/5"
        >
          <!-- Строка счёта: маркер + название команды — СЧЁТ — маркер + название команды -->
          <div class="mx-auto flex w-full min-w-0 max-w-4xl items-center justify-center gap-2 px-4 sm:px-6 pt-2 pb-1">
            <!-- Домашняя команда: маркер слева, название по правому краю -->
            <span class="min-w-0 flex items-center justify-end gap-1.5 text-right text-sm font-semibold text-slate-100 flex-1">
              <span class="shrink-0">{{ liveHomeMarker }}</span>
              <span class="truncate">{{ liveHomeTeam }}</span>
            </span>
            <!-- Счёт: ничья — серая плашка; лидер — в цвете команды из настроек турнира. -->
            <span
              class="shrink-0 inline-flex min-w-[3.5rem] items-center justify-center rounded-lg px-2 py-0.5 text-center text-base font-extrabold tabular-nums tracking-tight ring-1"
              :class="liveScorePillClass"
            >
              {{ liveHomeScore }}&thinsp;:&thinsp;{{ liveAwayScore }}
            </span>
            <!-- Гостевая команда: название по левому краю, маркер справа -->
            <span class="min-w-0 flex items-center justify-start gap-1.5 text-left text-sm font-semibold text-slate-100 flex-1">
              <span class="truncate">{{ liveAwayTeam }}</span>
              <span class="shrink-0">{{ liveAwayMarker }}</span>
            </span>
          </div>

          <!-- Статистика игроков текущего матча — показывается если есть хоть одно событие -->
          <div
            v-if="livePlayerRows.length > 0"
            class="mx-auto w-full min-w-0 max-w-4xl px-3 sm:px-6 pb-2.5"
          >
            <!-- Разделитель между счётом и статистикой -->
            <div class="mb-2 border-t border-red-500/15" />
            <!-- Два столбца: домашняя команда слева, гостевая справа -->
            <div class="grid grid-cols-2 gap-x-2">
              <!-- Левая колонка — домашняя команда -->
              <div class="flex flex-col gap-1">
                <div
                  v-for="row in livePlayerRows.filter(r => r.side === 'home')"
                  :key="row.playerId"
                  class="flex min-w-0 items-center gap-1.5"
                >
                  <!-- Имя игрока — обрезается при нехватке места -->
                  <span class="min-w-0 truncate text-[11px] font-medium text-slate-200 leading-none">{{ row.name }}</span>
                  <!-- Бейджи событий: цвет как в менеджере матча -->
                  <div class="flex shrink-0 items-center gap-0.5">
                    <span
                      v-for="badge in row.badges"
                      :key="badge.key"
                      class="inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[10px] font-semibold tabular-nums leading-none"
                      :class="badge.bgClass + ' ' + badge.textClass"
                    >
                      {{ badge.icon }}{{ badge.count }}
                    </span>
                  </div>
                </div>
              </div>
              <!-- Правая колонка — гостевая команда, выровнена вправо -->
              <div class="flex flex-col gap-1">
                <div
                  v-for="row in livePlayerRows.filter(r => r.side === 'away')"
                  :key="row.playerId"
                  class="flex min-w-0 items-center justify-end gap-1.5"
                >
                  <!-- Бейджи событий идут перед именем (зеркально левой колонке) -->
                  <div class="flex shrink-0 items-center gap-0.5">
                    <span
                      v-for="badge in row.badges"
                      :key="badge.key"
                      class="inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[10px] font-semibold tabular-nums leading-none"
                      :class="badge.bgClass + ' ' + badge.textClass"
                    >
                      {{ badge.icon }}{{ badge.count }}
                    </span>
                  </div>
                  <!-- Имя игрока — обрезается при нехватке места -->
                  <span class="min-w-0 truncate text-[11px] font-medium text-slate-200 leading-none">{{ row.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </header>

    <!-- main всегда присутствует в DOM — стабильный каркас без прыжков при refresh -->
    <!-- Отступ сверху увеличивается когда live-блок активен: базово ~36px, с статистикой ~до 100px -->
    <main
      class="mx-auto flex w-full min-w-0 max-w-4xl flex-1 flex-col px-4 sm:px-6 transition-[padding] duration-300"
      :class="matchStatus === 'live' && liveHomeTeam && liveAwayTeam
        ? (livePlayerRows.length > 0
            ? 'pt-[calc(theme(spacing.14)+env(safe-area-inset-top)+6.5rem)]'
            : 'pt-[calc(theme(spacing.14)+env(safe-area-inset-top)+2.75rem)]')
        : 'pt-[calc(theme(spacing.14)+env(safe-area-inset-top))]'"
    >
      <div class="flex flex-1 flex-col py-5 sm:py-8">
        <!-- Заглушка «турнир не начался» — сверху, как обычный контент -->
        <div
          v-if="!hasViewerData"
          class="flex flex-col"
        >
          <div class="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-700/60 px-6 py-16 text-center">
            <svg class="h-10 w-10 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              <path d="M2 12h20" />
            </svg>
            <div>
              <p class="font-medium text-slate-400">Турнир ещё не начался</p>
              <p class="mt-1 text-sm text-slate-600">Данные появятся здесь, когда администратор запустит турнир.</p>
            </div>
          </div>
        </div>

        <!-- Итоги турнира — показываются когда турнир завершён -->
        <OrganismsViewerTournamentSummary
          v-else-if="matchStatus === 'finished' && tournamentSummary"
          :summary="tournamentSummary"
          :tournament-date="tournamentDate"
          :team-colors="teamColors"
        />

        <!-- Таблица зрителя — показывается во время турнира -->
        <OrganismsTournamentStepStandings
          v-else-if="hasViewerData"
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
      </div>
    </main>

    <!-- Модальное окно входа администратора -->
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
import { useAdminAuth } from '~/composables/useAdminAuth'
import { useTeamColors } from '~/composables/useTeamColors'
import { displayPlayerLabelWithoutRating } from '~/composables/usePlayerDisplay'
import { useTournamentSummary } from '~/composables/useTournamentSummary'

const props = defineProps<{
  state: SavedTournamentContext | null
  players: Player[]
}>()

const showLoginModal = ref(false)
const { restoreSession } = useAdminAuth()

function onAdminEnter() {
  // Если сессия уже есть — входим сразу, без пароля.
  if (restoreSession()) return
  showLoginModal.value = true
}

const tournamentName = computed(() => props.state?.tournamentName ?? '')
const tournamentDate = computed(() => props.state?.tournamentDate ?? '')
const teams = computed(() => props.state?.confirmedTeamNames ?? [])
const teamColors = computed(() => props.state?.teamColors ?? {})
const assignmentByPlayerId = computed(() => props.state?.assignmentByPlayerId ?? {})
const initialSnapshot = computed<SavedStandingsSnapshot | null>(() => props.state?.standingsSnapshot ?? null)

// Статус матча — upcoming / live / finished. По умолчанию upcoming если данных нет.
const matchStatus = computed(() => props.state?.matchStatus ?? 'upcoming')

// Итоги турнира — вычисляем только когда есть снапшот с завершёнными матчами.
// Используется для раздела «Итоги» при статусе finished.
const tournamentSummary = computed(() => {
  const snap = initialSnapshot.value
  if (!snap || snap.playedMatchesList.length === 0) return null
  return useTournamentSummary({
    players: props.players,
    assignmentByPlayerId: assignmentByPlayerId.value,
    aggregatePlayerStats: snap.aggregatePlayerStats,
    playedMatchesList: snap.playedMatchesList,
    standingsRows: snap.standingsRows,
    playerRatingDeltas: snap.playerRatingDeltas,
  })
})
// Команды текущего live-матча — отображаем в шапке когда статус Live.
const liveHomeTeam = computed(() => props.state?.liveHomeTeam ?? '')
const liveAwayTeam = computed(() => props.state?.liveAwayTeam ?? '')

// Маркеры цветов для команд live-матча — берём из teamColors через индекс.
const { getMarkerByIndex, getMatchScorePillClass } = useTeamColors()
const liveHomeMarker = computed(() => {
  // Находим индекс цвета для домашней команды, по умолчанию 0 (🔴).
  const idx = teamColors.value[liveHomeTeam.value] ?? 0
  return getMarkerByIndex(idx)
})
const liveAwayMarker = computed(() => {
  // Находим индекс цвета для гостевой команды, по умолчанию 1 (🟢).
  const idx = teamColors.value[liveAwayTeam.value] ?? 1
  return getMarkerByIndex(idx)
})

// Счёт текущего матча — сумма голов каждого игрока из текущей статистики снапшота.
const liveHomeScore = computed(() => {
  const stats = initialSnapshot.value?.currentHomeStats ?? {}
  // Складываем голы всех домашних игроков.
  return Object.values(stats).reduce((sum, s) => sum + (s.goals ?? 0), 0)
})
const liveAwayScore = computed(() => {
  const stats = initialSnapshot.value?.currentAwayStats ?? {}
  // Складываем голы всех гостевых игроков.
  return Object.values(stats).reduce((sum, s) => sum + (s.goals ?? 0), 0)
})

const liveScorePillClass = computed(() => {
  const h = liveHomeTeam.value
  const a = liveAwayTeam.value
  if (!h || !a) return 'bg-slate-800/90 text-slate-400 ring-slate-600/40'
  return getMatchScorePillClass(
    liveHomeScore.value,
    liveAwayScore.value,
    h,
    a,
    (name) => teamColors.value[name] ?? 0,
  )
})

// Конфигурация бейджей событий — те же цвета и иконки что в менеджере матча.
const LIVE_STAT_BADGES = [
  { key: 'goals',   icon: '⚽', bgClass: 'bg-emerald-500/15', textClass: 'text-emerald-300' },
  { key: 'assists', icon: '🎯', bgClass: 'bg-sky-500/15',     textClass: 'text-sky-300' },
  { key: 'saves',   icon: '🧤', bgClass: 'bg-violet-500/15',  textClass: 'text-violet-300' },
  { key: 'yellows', icon: '🟨', bgClass: 'bg-yellow-500/15',  textClass: 'text-yellow-300' },
] as const

type LiveBadge = { key: string; icon: string; count: number; bgClass: string; textClass: string }
// Строки статистики игроков текущего матча — только игроки с хотя бы одним событием.
type LivePlayerRow = { playerId: number; name: string; badges: LiveBadge[]; side: 'home' | 'away' }

function buildPlayerRow(
  idStr: string,
  stats: { goals: number; assists: number; saves: number; yellows: number },
  side: 'home' | 'away',
): LivePlayerRow | null {
  // Считаем сумму всех событий — пропускаем игроков без отметок.
  const total = (stats.goals ?? 0) + (stats.assists ?? 0) + (stats.saves ?? 0) + (stats.yellows ?? 0)
  if (total === 0) return null
  const playerId = Number(idStr)
  const player = props.players.find((p) => p.id === playerId)
  // Собираем только бейджи с ненулевым значением.
  const badges = LIVE_STAT_BADGES
    .filter((b) => (stats[b.key as keyof typeof stats] ?? 0) > 0)
    .map((b) => ({ key: b.key, icon: b.icon, count: stats[b.key as keyof typeof stats] ?? 0, bgClass: b.bgClass, textClass: b.textClass }))
  return {
    playerId,
    name: player ? displayPlayerLabelWithoutRating(player) : `#${playerId}`,
    badges,
    side,
  }
}

const livePlayerRows = computed<LivePlayerRow[]>(() => {
  const snap = initialSnapshot.value
  if (!snap) return []
  const rows: LivePlayerRow[] = []
  // Домашние игроки с событиями.
  for (const [idStr, stats] of Object.entries(snap.currentHomeStats ?? {})) {
    const row = buildPlayerRow(idStr, stats, 'home')
    if (row) rows.push(row)
  }
  // Гостевые игроки с событиями.
  for (const [idStr, stats] of Object.entries(snap.currentAwayStats ?? {})) {
    const row = buildPlayerRow(idStr, stats, 'away')
    if (row) rows.push(row)
  }
  return rows
})

const snapshotKey = computed(() => {
  const matchCount = initialSnapshot.value?.playedMatchesList?.length ?? 0
  const teamKey = teams.value.join(',')
  return `${teamKey}:${matchCount}`
})

const hasViewerData = computed(() => teams.value.length > 0 || initialSnapshot.value !== null)

function onViewerSnapshotUpdate(_snapshot: SavedStandingsSnapshot) {}
function onViewerTournamentFinished() {}
</script>
