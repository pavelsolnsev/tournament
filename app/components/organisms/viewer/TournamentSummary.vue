<template>
  <section class="flex flex-col">

    <!-- ─── ДАТА ТУРНИРА ─────────────────────────────────────────── -->
    <!-- Показываем только если дата передана — она всегда есть после завершения -->
    <div v-if="props.tournamentDate" class="px-4 pt-5 pb-4 sm:px-6">
      <p class="text-center text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        🏟️ Турнир проведён {{ formattedDate }}
      </p>
    </div>

    <div v-if="props.tournamentDate" class="mx-4 border-t border-slate-200 dark:border-slate-700/50 sm:mx-6" />

    <!-- ─── 1. MVP ТУРНИРА ─────────────────────────────────────── -->
    <div v-if="props.summary.mvp.length > 0" class="px-4 pt-6 pb-5 sm:px-6">
      <!-- Метка секции -->
      <p class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">⭐ MVP турнира</p>

      <div
        v-for="player in props.summary.mvp"
        :key="player.playerId"
        class="relative overflow-hidden rounded-2xl border border-amber-400/60 bg-gradient-to-br from-amber-100 to-slate-50 p-4
               dark:border-amber-500/25 dark:from-amber-500/10 dark:to-slate-800/70"
      >
        <!-- Свечение за аватаром -->
        <div class="pointer-events-none absolute -left-4 -top-4 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl" aria-hidden="true" />

        <div class="relative flex items-center gap-3">
          <!-- Аватар — размер фиксирован, трофей абсолютно позиционирован -->
          <div class="relative shrink-0 h-9 w-9">
            <AtomsPlayerAvatar
              :photo="player.photo"
              :fallback-name="player.name"
              size="md"
              class="ring-2 ring-amber-400/50"
            />
            <span
              class="absolute -bottom-1 -right-1 flex h-[16px] w-[16px] items-center justify-center rounded-full bg-white dark:bg-slate-900 text-[9px] ring-1 ring-amber-500/40 leading-none"
              aria-hidden="true"
            >🏆</span>
          </div>

          <!-- Имя и отметки в одной строке; команда ниже — как в макете итогов -->
          <div class="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
            <div class="flex min-w-0 items-center gap-1.5">
              <p class="min-w-0 truncate text-[14px] font-bold leading-tight text-amber-700 dark:text-amber-200">{{ player.name }}</p>
              <div
                v-if="player.tournamentStats && mvpMarksTotal(player.tournamentStats) > 0"
                class="flex shrink-0 flex-wrap items-center gap-1"
              >
                <span
                  v-if="player.tournamentStats.goals > 0"
                  class="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-900 dark:text-emerald-300"
                >⚽ {{ player.tournamentStats.goals }}</span>
                <span
                  v-if="player.tournamentStats.assists > 0"
                  class="inline-flex items-center gap-0.5 rounded bg-sky-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-sky-900 dark:text-sky-300"
                >🎯 {{ player.tournamentStats.assists }}</span>
                <span
                  v-if="player.tournamentStats.saves > 0"
                  class="inline-flex items-center gap-0.5 rounded bg-violet-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-violet-900 dark:text-violet-300"
                >🧤 {{ player.tournamentStats.saves }}</span>
                <span
                  v-if="player.tournamentStats.yellows > 0"
                  class="inline-flex items-center gap-0.5 rounded bg-yellow-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-yellow-900 dark:text-yellow-300"
                >🟨 {{ player.tournamentStats.yellows }}</span>
              </div>
            </div>
            <p class="flex items-center gap-1 text-[11px] leading-none text-slate-500 dark:text-slate-400">
              <span class="shrink-0" aria-hidden="true">{{ player.teamMarker }}</span>
              <span class="truncate">{{ player.teamName }}</span>
            </p>
          </div>

          <!-- Бейдж MVP -->
          <span class="shrink-0 self-center rounded-md bg-amber-500/15 px-2 py-1 text-[11px] font-bold tracking-wider text-amber-900 ring-1 ring-amber-500/30 dark:text-amber-300 dark:ring-amber-500/25">
            MVP
          </span>
        </div>
      </div>
    </div>

    <div class="mx-4 border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />

    <!-- ─── 2. ИНДИВИДУАЛЬНЫЕ НАГРАДЫ ─────────────────────────── -->
    <div class="px-4 pt-5 pb-5 sm:px-6">
      <p class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">🎖️ Индивидуальные награды</p>

      <!-- На мобиле — вертикальный стек, на SM+ — три колонки -->
      <div class="flex flex-col gap-2 sm:grid sm:grid-cols-3">
        <!-- Бомбардир -->
        <AtomsAwardCard
          v-if="props.summary.topScorers.length > 0"
          icon="⚽"
          label="Бомбардир"
          :value-label="pluralGoals(props.summary.topScorers[0]!.value)"
          color="emerald"
          :winners="props.summary.topScorers"
        />
        <EmptyAward v-else icon="⚽" text="Голов не забито" />

        <!-- Ассистент -->
        <AtomsAwardCard
          v-if="props.summary.topAssisters.length > 0"
          icon="🎯"
          label="Ассистент"
          :value-label="pluralAssists(props.summary.topAssisters[0]!.value)"
          color="sky"
          :winners="props.summary.topAssisters"
        />
        <EmptyAward v-else icon="🎯" text="Передач не было" />

        <!-- Вратарь -->
        <AtomsAwardCard
          v-if="props.summary.topGoalkeepers.length > 0"
          icon="🧤"
          label="Вратарь"
          :value-label="pluralSaves(props.summary.topGoalkeepers[0]!.value)"
          color="violet"
          :winners="props.summary.topGoalkeepers"
        />
        <EmptyAward v-else icon="🧤" text="Сейвов не было" />
      </div>
    </div>

    <!-- ─── 2б. ЖЁЛТЫЕ КАРТОЧКИ ──────────────────────────────── -->
    <!-- Показываем только если хоть один игрок получил карточку -->
    <div v-if="props.summary.yellowCards.length > 0" class="px-4 pb-5 sm:px-6">
      <p class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">🟨 Жёлтые карточки</p>

      <!-- Список нарушителей — горизонтальные строки -->
      <div class="flex flex-col gap-1.5">
        <div
          v-for="player in props.summary.yellowCards"
          :key="player.playerId"
          class="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5
                 dark:border-yellow-500/15 dark:bg-yellow-500/5"
        >
          <!-- Аватар игрока -->
          <AtomsPlayerAvatar
            :photo="player.photo"
            :fallback-name="player.name"
            size="sm"
            class="shrink-0"
          />

          <!-- Имя и команда -->
          <div class="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
            <p class="truncate text-[13px] font-semibold leading-tight text-slate-800 dark:text-slate-200">{{ player.name }}</p>
            <p class="flex items-center gap-1 text-[11px] leading-none text-slate-500">
              <span class="shrink-0" aria-hidden="true">{{ player.teamMarker }}</span>
              <span class="truncate">{{ player.teamName }}</span>
            </p>
          </div>

          <!-- Количество карточек -->
          <div class="shrink-0 flex items-center gap-1">
            <span
              v-for="n in player.count"
              :key="n"
              class="inline-block h-4 w-3 rounded-sm bg-yellow-400 ring-1 ring-yellow-500/50"
              aria-hidden="true"
            />
            <span class="ml-1 text-[12px] font-bold tabular-nums text-amber-900 dark:text-yellow-300">{{ player.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="mx-4 border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />

    <!-- ─── 3. САМЫЙ РЕЗУЛЬТАТИВНЫЙ МАТЧ ──────────────────────── -->
    <div v-if="props.summary.stats.topScoringMatch" class="px-4 pt-5 pb-5 sm:px-6">
      <p class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">🔥 Самый результативный матч</p>

      <div class="overflow-hidden rounded-2xl border border-slate-300 bg-slate-50 dark:border-slate-700/60 dark:bg-slate-800/60">

        <!-- Мобиль: вертикально (команда → счёт → команда) -->
        <div class="sm:hidden">
          <div class="flex items-center gap-2.5 px-4 pt-4 pb-3">
            <span class="shrink-0 text-lg leading-none" aria-hidden="true">{{ homeTeamMarker }}</span>
            <span class="text-[14px] font-semibold text-slate-800 leading-snug dark:text-slate-100">{{ props.summary.stats.topScoringMatch.homeTeam }}</span>
          </div>
          <div class="relative flex items-center px-4">
            <div class="flex-1 border-t border-slate-300 dark:border-slate-700/50" />
            <div
              class="mx-3 shrink-0 flex items-baseline gap-1.5 rounded-xl px-4 py-1.5 ring-1"
              :class="topScoringMatchPillClass"
            >
              <span class="text-2xl font-black tabular-nums leading-none">{{ props.summary.stats.topScoringMatch.homeGoals }}</span>
              <span class="text-base font-light leading-none opacity-60">:</span>
              <span class="text-2xl font-black tabular-nums leading-none">{{ props.summary.stats.topScoringMatch.awayGoals }}</span>
            </div>
            <div class="flex-1 border-t border-slate-300 dark:border-slate-700/50" />
          </div>
          <div class="flex items-center gap-2.5 px-4 pt-3 pb-4">
            <span class="shrink-0 text-lg leading-none" aria-hidden="true">{{ awayTeamMarker }}</span>
            <span class="text-[14px] font-semibold text-slate-800 leading-snug dark:text-slate-100">{{ props.summary.stats.topScoringMatch.awayTeam }}</span>
          </div>
        </div>

        <!-- Десктоп: горизонтально (команда ← счёт → команда) -->
        <div class="hidden sm:flex items-center gap-3 px-6 py-5">
          <!-- Домашняя: название + маркер, прижато вправо -->
          <div class="min-w-0 flex-1 flex items-center justify-end gap-2">
            <span class="min-w-0 text-[15px] font-semibold text-slate-800 leading-tight text-right dark:text-slate-100">
              {{ props.summary.stats.topScoringMatch.homeTeam }}
            </span>
            <span class="shrink-0 text-xl leading-none" aria-hidden="true">{{ homeTeamMarker }}</span>
          </div>
          <!-- Счёт по центру, крупно -->
          <div
            class="shrink-0 flex items-baseline gap-2 rounded-2xl px-5 py-2.5 ring-1"
            :class="topScoringMatchPillClass"
          >
            <span class="text-3xl font-black tabular-nums leading-none">{{ props.summary.stats.topScoringMatch.homeGoals }}</span>
            <span class="text-xl font-light leading-none opacity-60">:</span>
            <span class="text-3xl font-black tabular-nums leading-none">{{ props.summary.stats.topScoringMatch.awayGoals }}</span>
          </div>
          <!-- Гостевая: маркер + название, прижато влево -->
          <div class="min-w-0 flex-1 flex items-center justify-start gap-2">
            <span class="shrink-0 text-xl leading-none" aria-hidden="true">{{ awayTeamMarker }}</span>
            <span class="min-w-0 text-[15px] font-semibold text-slate-800 leading-tight text-left dark:text-slate-100">
              {{ props.summary.stats.topScoringMatch.awayTeam }}
            </span>
          </div>
        </div>

        <!-- Подпись — общая для обоих layout -->
        <div class="border-t border-slate-300 px-4 py-2 text-center text-[11px] font-medium text-slate-700 dark:border-slate-700/40 dark:text-slate-400">
          {{ pluralGoals(props.summary.stats.topScoringMatchGoals) }} в матче
        </div>
      </div>
    </div>

    <div class="mx-4 border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />

    <!-- ─── 4. MVP КОМАНД ─────────────────────────────────────── -->
    <div v-if="props.summary.teamMvps.length > 0" class="px-4 pt-5 pb-5 sm:px-6">
      <p class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">👑 MVP команд</p>

      <div class="flex flex-col gap-2 sm:grid sm:grid-cols-2">
        <div
          v-for="teamMvp in props.summary.teamMvps"
          :key="teamMvp.teamName"
          class="flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 p-3 dark:border-slate-700/60 dark:bg-slate-800/50"
        >
          <!-- Аватар с маркером команды -->
          <div class="relative shrink-0">
            <AtomsPlayerAvatar
              :photo="teamMvp.players[0]?.photo"
              :fallback-name="teamMvp.players[0]?.name ?? teamMvp.teamName"
              size="md"
            />
            <span
              class="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white text-[10px] ring-1 ring-slate-300 dark:bg-slate-900 dark:ring-slate-700/60"
              aria-hidden="true"
            >{{ teamMvp.teamMarker }}</span>
          </div>

          <!-- Название команды + имя игрока -->
          <div class="min-w-0 flex-1">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-slate-600 leading-none dark:text-slate-400">
              {{ teamMvp.teamName }}
            </p>
            <p
              v-if="teamMvp.players.length > 0"
              class="mt-1 truncate text-[13px] font-semibold text-slate-800 leading-tight dark:text-slate-100"
            >
              {{ teamMvp.players[0]!.name }}
            </p>
            <p v-else class="mt-1 text-[13px] text-slate-500">—</p>
          </div>

          <!-- Статистика — горизонтально, компактно -->
          <div v-if="teamMvp.players.length > 0" class="flex shrink-0 items-center gap-1">
            <span
              v-if="teamMvp.goals > 0"
              class="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-900 dark:text-emerald-300"
            >⚽ {{ teamMvp.goals }}</span>
            <span
              v-if="teamMvp.assists > 0"
              class="inline-flex items-center gap-0.5 rounded bg-sky-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-sky-900 dark:text-sky-300"
            >🎯 {{ teamMvp.assists }}</span>
            <span
              v-if="teamMvp.saves > 0"
              class="inline-flex items-center gap-0.5 rounded bg-violet-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-violet-900 dark:text-violet-300"
            >🧤 {{ teamMvp.saves }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="mx-4 border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />

    <!-- ─── 5. ИТОГОВАЯ ТАБЛИЦА ───────────────────────────────── -->
    <div v-if="props.summary.standingsRows.length > 0" class="px-4 pt-5 pb-2 sm:px-6">
      <p class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">📊 Итоговая таблица</p>
      <!-- Тот же компонент что и на шаге турнира — единый стиль везде на сайте. -->
      <OrganismsStandingsTable
        :teams="props.summary.standingsRows.map(r => r.teamName)"
        :rows="props.summary.standingsRows"
        :team-colors="props.teamColors"
      />
    </div>

    <!-- ─── 6. СОСТАВЫ ───────────────────────────────────────── -->
    <template v-if="hasRosterData">
      <div class="mx-4 border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />
      <div class="px-4 pt-5 pb-6 sm:px-6">
        <p class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">👥 Составы</p>
        <!-- Тот же компонент составов что и в разделе «Составы» на шаге турнира. -->
        <OrganismsTournamentStepStandingsTeamRosterTotals
          :teams="rosterTeams"
          :players-by-team="rosterPlayersByTeam"
          :team-marker="teamMarkerForRow"
          :display-player-label="displayPlayerLabelWithoutRating"
          :aggregate-player-stats="props.aggregatePlayerStats ?? {}"
          :player-rating-deltas="props.playerRatingDeltas ?? {}"
          :show-heading="false"
        />
      </div>
    </template>

  </section>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { TournamentSummary } from '~/composables/useTournamentSummary'
import type { PlayerMatchStats } from '~/composables/tournament-standings/types'
import { useTeamColors } from '~/composables/useTeamColors'
import { displayPlayerLabelWithoutRating } from '~/composables/usePlayerDisplay'

// Сумма отметок MVP — если ноль, строку с плашками не показываем.
function mvpMarksTotal(s: PlayerMatchStats): number {
  return s.goals + s.assists + s.saves + s.yellows
}

// Вспомогательный компонент-заглушка — чтобы не повторять разметку три раза.
// Определяем прямо здесь через defineComponent, т.к. это мелкий presentational элемент.
const EmptyAward = defineComponent({
  props: { icon: String, text: String },
  template: `
    <div class="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 dark:border-slate-700/40 dark:bg-slate-800/20">
      <span class="text-base opacity-40 dark:opacity-30" aria-hidden="true">{{ icon }}</span>
      <span class="text-[12px] text-slate-600 dark:text-slate-500">{{ text }}</span>
    </div>
  `,
})

// Получаем итоги турнира снаружи — компонент только отображает данные.
const props = defineProps<{
  summary: TournamentSummary
  tournamentDate?: string
  /** Цвета команд с мастера; если пусто — индекс берём из места в таблице. */
  teamColors?: Record<string, number>
  /** Игроки турнира — нужны для раздела «Составы». */
  players?: Player[]
  /** Назначение игроков по командам. */
  assignmentByPlayerId?: Record<number, string>
  /** Суммарная статистика игроков за весь турнир. */
  aggregatePlayerStats?: Record<number, PlayerMatchStats>
  /** Дельты рейтинга игроков за турнир. */
  playerRatingDeltas?: Record<number, number>
}>()

const { getMarkerByIndex, getMatchScorePillClass } = useTeamColors()

// Индекс палитры для команды: сначала явный цвет из турнира, иначе порядок в таблице.
function colorIndexForTeam(teamName: string): number {
  const fromMap = props.teamColors?.[teamName]
  if (fromMap !== undefined && Number.isFinite(fromMap)) return fromMap
  const idx = props.summary.standingsRows.findIndex((r) => r.teamName === teamName)
  return idx >= 0 ? idx : 0
}

// Плашка «самый результативный матч»: ничья — нейтрально, иначе — цвет победителя.
const topScoringMatchPillClass = computed(() => {
  const m = props.summary.stats.topScoringMatch
  if (!m) return 'bg-slate-100 text-slate-800 ring-slate-300/90 dark:bg-slate-800/90 dark:text-slate-400 dark:ring-slate-600/40'
  return getMatchScorePillClass(
    m.homeGoals,
    m.awayGoals,
    m.homeTeam,
    m.awayTeam,
    colorIndexForTeam,
  )
})

// Форматируем дату из ISO-строки "YYYY-MM-DD" в читаемый вид "2 апреля 2026".
// Если дата не передана — computed вернёт пустую строку.
const formattedDate = computed(() => {
  if (!props.tournamentDate) return ''
  const d = new Date(props.tournamentDate)
  if (isNaN(d.getTime())) return props.tournamentDate
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
})

// Возвращает маркер команды по её названию — ищем позицию в итоговой таблице.
function teamMarkerForRow(teamName: string): string {
  const idx = props.summary.standingsRows.findIndex((r) => r.teamName === teamName)
  return getMarkerByIndex(idx >= 0 ? idx : 0)
}

// Маркеры команд для блока «лучший матч».
const homeTeamMarker = computed(() => teamMarkerForRow(props.summary.stats.topScoringMatch?.homeTeam ?? ''))
const awayTeamMarker = computed(() => teamMarkerForRow(props.summary.stats.topScoringMatch?.awayTeam ?? ''))

// Список команд в порядке таблицы — нужен для StepStandingsTeamRosterTotals.
const rosterTeams = computed(() => props.summary.standingsRows.map(r => r.teamName))

// Возвращает игроков команды из пропса players + assignmentByPlayerId.
function rosterPlayersByTeam(teamName: string): Player[] {
  if (!props.players || !props.assignmentByPlayerId) return []
  // Фильтруем всех игроков турнира по принадлежности к этой команде.
  return props.players.filter(p => props.assignmentByPlayerId![p.id] === teamName)
}

// Показываем раздел «Составы» только если переданы игроки.
const hasRosterData = computed(() => (props.players?.length ?? 0) > 0)

// Склонение: голы.
function pluralGoals(n: number): string {
  if (n === 1) return '1 гол'
  if (n >= 2 && n <= 4) return `${n} гола`
  return `${n} голов`
}

// Склонение: передачи.
function pluralAssists(n: number): string {
  if (n === 1) return '1 передача'
  if (n >= 2 && n <= 4) return `${n} передачи`
  return `${n} передач`
}

// Склонение: сейвы.
function pluralSaves(n: number): string {
  if (n === 1) return '1 сейв'
  if (n >= 2 && n <= 4) return `${n} сейва`
  return `${n} сейвов`
}
</script>
