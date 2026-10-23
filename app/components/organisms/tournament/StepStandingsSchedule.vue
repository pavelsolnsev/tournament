<!-- Расписание: кто играет следующим (наглядно, сразу видно) + все оставшиеся матчи по кнопке. Текущий матч и так в шапке.
     Пока пара не выбрана (до первого матча, между матчами) — блок не показываем. -->
<template>
  <section
    v-if="hasCurrentMatch && upcoming.length > 0"
    class="rounded-xl border border-dashed border-slate-300 dark:border-slate-700/70"
    aria-label="Расписание матчей"
  >
    <!-- Следующий матч — тонкая приглушённая строка «Далее», чтобы не путать с идущим матчем в шапке. -->
    <!-- Телефон: метка, номер и «Все матчи» сверху, команды целиком отдельной строкой ниже. Шире — всё в одну строку. -->
    <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-2">
      <span class="shrink-0 rounded-md border border-sky-400/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:border-sky-500/40 dark:text-sky-300">
        Далее
      </span>
      <span v-if="nextMatch" class="shrink-0 text-[11px] tabular-nums text-slate-400">
        {{ nextMatch.number }}<template v-if="plannedTotal">/{{ plannedTotal }}</template>
      </span>
      <span v-if="nextMatch" class="order-last flex w-full min-w-0 flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 sm:order-none sm:w-auto sm:flex-1">
        <AtomsTeamMarkerOrLogo :team-name="nextMatch.home" :marker="teamMarker(nextMatch.home)" size="xs" />
        <span class="break-words">{{ teamDisplayNameByMarker(nextMatch.home, teamMarker(nextMatch.home)) }}</span>
        <span class="shrink-0 text-[10px] uppercase text-slate-400" aria-hidden="true">vs</span>
        <span class="break-words">{{ teamDisplayNameByMarker(nextMatch.away, teamMarker(nextMatch.away)) }}</span>
        <AtomsTeamMarkerOrLogo :team-name="nextMatch.away" :marker="teamMarker(nextMatch.away)" size="xs" />
      </span>
      <button
        v-if="allRows.length > 1"
        type="button"
        class="ml-auto shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:text-slate-400 dark:hover:bg-slate-800/50"
        :aria-expanded="showAll"
        @click="showAll = !showAll"
      >
        Все матчи {{ showAll ? '▴' : '▾' }}
      </button>
    </div>

    <!-- Все матчи турнира по кнопке: сыгранные (со счётом, приглушённо), текущий и будущие -->
    <div v-if="showAll && allRows.length > 1" class="border-t border-dashed border-slate-300 pt-1 dark:border-slate-700/70">
      <p class="px-4 pb-1 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
        Сыграно {{ playedMatchesList.length }} из {{ allRows.length }}
      </p>
      <ol class="flex flex-col gap-0.5 px-2 pb-2">
        <li
          v-for="row in allRows"
          :key="row.number"
          class="grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-lg px-2 py-1.5 text-[13px]"
          :class="row.kind === 'played'
            ? 'bg-slate-100/70 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400'
            : row.kind === 'current'
              ? 'bg-emerald-500/10 text-slate-800 ring-1 ring-emerald-500/30 dark:text-slate-100'
              : 'text-slate-700 dark:text-slate-300'"
        >
          <span class="text-right text-xs tabular-nums text-slate-400">{{ row.number }}</span>
          <span class="flex min-w-0 items-center justify-end gap-1.5 text-right" :class="row.winner === 'home' && 'font-semibold text-slate-700 dark:text-slate-200'">
            <span class="min-w-0 break-words">{{ teamDisplayNameByMarker(row.home, teamMarker(row.home)) }}</span>
            <AtomsTeamMarkerOrLogo :team-name="row.home" :marker="teamMarker(row.home)" size="xs" />
          </span>
          <!-- Сыгран — счёт; идёт — «сейчас»; впереди — тире -->
          <span
            v-if="row.kind === 'played'"
            class="min-w-[3rem] rounded-md bg-slate-200/80 px-1.5 py-0.5 text-center font-mono text-xs font-semibold tabular-nums text-slate-700 dark:bg-slate-700/60 dark:text-slate-200"
          >{{ row.score }}</span>
          <span
            v-else-if="row.kind === 'current'"
            class="min-w-[3rem] rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300"
          >сейчас</span>
          <span v-else class="min-w-[3rem] text-center text-slate-400" aria-hidden="true">—</span>
          <span class="flex min-w-0 items-center gap-1.5" :class="row.winner === 'away' && 'font-semibold text-slate-700 dark:text-slate-200'">
            <AtomsTeamMarkerOrLogo :team-name="row.away" :marker="teamMarker(row.away)" size="xs" />
            <span class="min-w-0 break-words">{{ teamDisplayNameByMarker(row.away, teamMarker(row.away)) }}</span>
          </span>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PlayedMatch } from '~/composables/tournament-standings/types'
import { forecastSchedule, type ScheduledMatch } from '~/composables/tournament-standings/schedule'
import { plannedMatchesTotal } from '~/composables/tournament-standings/plannedMatches'
import { teamDisplayNameByMarker } from '~/utils/teamDisplayName'

const props = defineProps<{
  teams: string[]
  playedMatchesList: PlayedMatch[]
  /** Пара текущего матча и идёт ли он (ещё не записан в сыгранные). */
  homeTeam: string
  awayTeam: string
  hasCurrentMatch: boolean
  teamMarker: (teamName: string) => string
}>()

const showAll = ref(false)

// Сколько матчей всего по плану (4 команды — 18, 3 — 12); для других составов — без «из N».
const plannedTotal = computed(() => plannedMatchesTotal(props.teams.filter(Boolean).length))

// Прогноз по тем же правилам, что «Следующий матч»: текущий (если идёт) и все оставшиеся до конца плана.
const schedule = computed<ScheduledMatch[]>(() =>
  forecastSchedule({
    teams: props.teams,
    played: props.playedMatchesList.map((m) => ({ homeTeam: m.homeTeam, awayTeam: m.awayTeam, matchNumber: m.matchNumber })),
    current: props.hasCurrentMatch && props.homeTeam && props.awayTeam ? { home: props.homeTeam, away: props.awayTeam } : null,
  }),
)

// Только будущие матчи: идущий сейчас и так виден в шапке со счётом.
const upcoming = computed(() => schedule.value.filter((m) => !m.isCurrent))

// Все матчи турнира одним списком: сыгранные (со счётом и победителем), текущий и будущие.
type Row = {
  number: number
  home: string
  away: string
  kind: 'played' | 'current' | 'upcoming'
  score: string
  winner: 'home' | 'away' | null
}
const allRows = computed<Row[]>(() => {
  const played: Row[] = [...props.playedMatchesList]
    .sort((x, y) => x.matchNumber - y.matchNumber)
    .map((m) => ({
      number: m.matchNumber,
      home: m.homeTeam,
      away: m.awayTeam,
      kind: 'played',
      score: `${m.homeGoals} : ${m.awayGoals}`,
      winner: m.homeGoals > m.awayGoals ? 'home' : m.awayGoals > m.homeGoals ? 'away' : null,
    }))
  const future: Row[] = schedule.value.map((m) => ({
    number: m.number,
    home: m.home,
    away: m.away,
    kind: m.isCurrent ? 'current' : 'upcoming',
    score: '',
    winner: null,
  }))
  return [...played, ...future]
})

// Ближайший матч, который ещё не начался — для строки «Далее».
const nextMatch = computed(() => upcoming.value[0] ?? null)
</script>
