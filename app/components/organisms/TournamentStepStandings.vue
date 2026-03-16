<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-50">
        Турнирная таблица
      </h1>
      <p class="text-slate-400 text-sm mb-4">
        <span v-if="tournamentName" class="truncate">{{ tournamentName }}</span>
        <span v-if="tournamentName && tournamentDate"> · </span>
        <span v-if="tournamentDate">{{ tournamentDate }}</span>
      </p>
      <OrganismsStandingsTable
        :teams="teams"
        :rows="standingsRows"
        :team-colors="effectiveTeamColors"
      />
    </div>

    <section class="rounded-2xl bg-slate-900/70 p-2 sm:p-4 sm:p-5 space-y-4">
      <h2 class="flex items-center gap-2 text-lg font-semibold text-slate-100">
        <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-300">
          ⚽
        </span>
        Управление матчами
      </h2>

      <!-- Выбор команд -->
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div class="flex-1 min-w-0">
          <label for="home-team" class="mb-1 block text-xs font-medium text-slate-400">Хозяева</label>
          <select
            id="home-team"
            v-model="homeTeam"
            class="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-100 ring-0 transition focus:border-emerald-500 focus:outline-none"
          >
            <option value="">
              — Выберите команду —
            </option>
            <option
              v-for="name in teams"
              :key="name"
              :value="name"
              :disabled="name === awayTeam"
            >
              {{ name }}
            </option>
          </select>
        </div>
        <div class="flex-1 min-w-0">
          <label for="away-team" class="mb-1 block text-xs font-medium text-slate-400">Гости</label>
          <select
            id="away-team"
            v-model="awayTeam"
            class="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-100 ring-0 transition focus:border-sky-500 focus:outline-none"
          >
            <option value="">
              — Выберите команду —
            </option>
            <option
              v-for="name in teams"
              :key="name"
              :value="name"
              :disabled="name === homeTeam"
            >
              {{ name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Информация о матче -->
      <div
        v-if="homeTeam && awayTeam"
        class="rounded-2xl bg-slate-950/70 p-2 sm:p-3"
      >
        <div class="mb-3 flex items-center justify-between gap-3">
          <div class="flex-1 min-w-0 text-left">
            <p class="truncate text-sm font-semibold text-slate-100">
              {{ homeTeam }}
            </p>
          </div>
          <div class="shrink-0 text-center">
            <p class="text-xs text-slate-400">
              Счёт
            </p>
            <p class="text-xl font-semibold text-slate-50">
              {{ homeGoals }} : {{ awayGoals }}
            </p>
          </div>
          <div class="flex-1 min-w-0 text-right">
            <p class="truncate text-sm font-semibold text-slate-100">
              {{ awayTeam }}
            </p>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <!-- Команда слева -->
          <div class="rounded-xl bg-slate-900/70 p-2">
            <h3 class="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-100">
              <span v-if="homeTeam" aria-hidden="true">
                {{ teamMarker(homeTeam) }}
              </span>
              <span class="truncate">{{ homeTeam }}</span>
            </h3>
            <ul class="space-y-1.5" role="list">
              <li
                v-for="p in playersByTeam(homeTeam)"
                :key="p.id"
                class="rounded-lg bg-slate-800/60 px-2 py-1.5 text-left transition cursor-pointer"
                :class="[
                  isActivePlayer('home', p.id)
                    ? 'bg-slate-900/80 shadow-inner shadow-emerald-500/30'
                    : 'hover:bg-slate-800'
                ]"
                @click="selectPlayerForMark('home', p.id)"
              >
                <div class="flex min-w-0 items-center justify-between gap-2">
                  <div class="min-w-0 truncate">
                    <span class="text-xs font-medium text-slate-100">
                      {{ p.username || p.name }}
                    </span>
                  </div>
                  <div class="flex shrink-0 items-center gap-2 text-[11px] text-slate-300">
                    <span v-if="playerStat('home', p.id).goals">⚽ {{ playerStat('home', p.id).goals }}</span>
                    <span v-if="playerStat('home', p.id).assists">🎯 {{ playerStat('home', p.id).assists }}</span>
                    <span v-if="playerStat('home', p.id).saves">🧤 {{ playerStat('home', p.id).saves }}</span>
                    <span v-if="playerStat('home', p.id).yellows">🟨 {{ playerStat('home', p.id).yellows }}</span>
                  </div>
                </div>
                <div
                  v-if="isActivePlayer('home', p.id)"
                  class="mt-1 flex items-center gap-2 text-[11px]"
                >
                  <select
                    class="w-full max-w-[11rem] rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
                    @click.stop
                    @mousedown.stop
                    @change="onSelectAction('home', p.id, $event)"
                  >
                    <option value="">
                      Добавить событие
                    </option>
                    <option value="goals">
                      ⚽ Гол
                    </option>
                    <option value="assists">
                      🎯 Ассист
                    </option>
                    <option value="saves">
                      🧤 Сейв
                    </option>
                    <option value="yellows">
                      🟨 Жёлтая
                    </option>
                  </select>
                </div>
              </li>
            </ul>
          </div>

          <!-- Команда справа -->
          <div class="rounded-xl bg-slate-900/70 p-2">
            <h3 class="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-100">
              <span v-if="awayTeam" aria-hidden="true">
                {{ teamMarker(awayTeam) }}
              </span>
              <span class="truncate">{{ awayTeam }}</span>
            </h3>
            <ul class="space-y-1.5" role="list">
              <li
                v-for="p in playersByTeam(awayTeam)"
                :key="p.id"
                class="rounded-lg bg-slate-800/60 px-2 py-1.5 text-left transition cursor-pointer"
                :class="[
                  isActivePlayer('away', p.id)
                    ? 'bg-slate-900/80 shadow-inner shadow-sky-500/30'
                    : 'hover:bg-slate-800'
                ]"
                @click="selectPlayerForMark('away', p.id)"
              >
                <div class="flex min-w-0 items-center justify-between gap-2">
                  <div class="min-w-0 truncate">
                    <span class="text-xs font-medium text-slate-100">
                      {{ p.username || p.name }}
                    </span>
                  </div>
                  <div class="flex shrink-0 items-center gap-2 text-[11px] text-slate-300">
                    <span v-if="playerStat('away', p.id).goals">⚽ {{ playerStat('away', p.id).goals }}</span>
                    <span v-if="playerStat('away', p.id).assists">🎯 {{ playerStat('away', p.id).assists }}</span>
                    <span v-if="playerStat('away', p.id).saves">🧤 {{ playerStat('away', p.id).saves }}</span>
                    <span v-if="playerStat('away', p.id).yellows">🟨 {{ playerStat('away', p.id).yellows }}</span>
                  </div>
                </div>
                <div
                  v-if="isActivePlayer('away', p.id)"
                  class="mt-1 flex items-center gap-2 text-[11px]"
                >
                  <select
                    class="w-full max-w-[11rem] rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/70"
                    @click.stop
                    @mousedown.stop
                    @change="onSelectAction('away', p.id, $event)"
                  >
                    <option value="">
                      Добавить событие
                    </option>
                    <option value="goals">
                      ⚽ Гол
                    </option>
                    <option value="assists">
                      🎯 Ассист
                    </option>
                    <option value="saves">
                      🧤 Сейв
                    </option>
                    <option value="yellows">
                      🟨 Жёлтая
                    </option>
                  </select>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-lg bg-slate-700 px-3 py-2 text-xs font-medium text-slate-100 transition hover:bg-slate-600 focus:outline-none"
            @click="resetMatchStats"
          >
            Сбросить матч
          </button>
          <button
            type="button"
            class="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-emerald-400 focus:outline-none"
            :disabled="!canFinishMatch"
            @click="finishMatch"
          >
            Завершить матч и обновить таблицу
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { StandingsRow } from '~/components/organisms/StandingsTable.vue'

const props = defineProps<{
  tournamentName: string
  tournamentDate: string
  teams: string[]
  teamColors: Record<string, number>
  players: Player[]
  assignmentByPlayerId: Record<number, string>
}>()

const markers: string[] = ['🔴', '🟢', '🔵', '🟡', '⚪', '⚫']

// Единый источник правды: карта команда -> индекс цвета.
// Если цвет не задан, назначаем последовательно 0..3 по списку teams.
const effectiveTeamColors = computed<Record<string, number>>(() => {
  const map: Record<string, number> = { ...props.teamColors }
  let next = 0
  for (const name of props.teams) {
    if (map[name] === undefined) {
      map[name] = next % markers.length
      next += 1
    }
  }
  return map
})

function teamMarker(teamName: string): string {
  const colorIndex = effectiveTeamColors.value[teamName] ?? 0
  const idx = Math.max(0, Math.min(colorIndex, markers.length - 1))
  return markers[idx] ?? '🔴'
}

type PlayerMatchStats = {
  goals: number
  assists: number
  saves: number
  yellows: number
}

type Side = 'home' | 'away'
type StatKey = keyof PlayerMatchStats

const standingsRows = ref<StandingsRow[]>(props.teams.map((name, index) => ({
  place: index + 1,
  teamName: name,
  played: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDiff: 0,
  points: 0,
})))

const homeTeam = ref('')
const awayTeam = ref('')

const homeStats = ref<Record<number, PlayerMatchStats>>({})
const awayStats = ref<Record<number, PlayerMatchStats>>({})

const homeGoals = computed(() =>
  Object.values(homeStats.value).reduce((sum, s) => sum + s.goals, 0),
)
const awayGoals = computed(() =>
  Object.values(awayStats.value).reduce((sum, s) => sum + s.goals, 0),
)

const canFinishMatch = computed(() => !!homeTeam.value && !!awayTeam.value && (homeGoals.value > 0 || awayGoals.value > 0))

const playersByTeamMap = computed<Record<string, Player[]>>(() => {
  const map: Record<string, Player[]> = {}
  for (const p of props.players) {
    const teamName = props.assignmentByPlayerId[p.id]
    if (!teamName) continue
    if (!map[teamName]) map[teamName] = []
    map[teamName].push(p)
  }
  return map
})

function playersByTeam(teamName: string): Player[] {
  return playersByTeamMap.value[teamName] ?? []
}

const activeSelection = ref<{ side: Side; playerId: number } | null>(null)

const activePlayer = computed<Player | null>(() => {
  if (!activeSelection.value) return null
  return props.players.find(p => p.id === activeSelection.value?.playerId) ?? null
})

function selectPlayerForMark(side: Side, playerId: number) {
  if (activeSelection.value && activeSelection.value.side === side && activeSelection.value.playerId === playerId) {
    activeSelection.value = null
  } else {
    activeSelection.value = { side, playerId }
  }
}

function isActivePlayer(side: Side, playerId: number) {
  return !!activeSelection.value &&
    activeSelection.value.side === side &&
    activeSelection.value.playerId === playerId
}

function onSelectAction(side: Side, playerId: number, evt: Event) {
  const select = evt.target as HTMLSelectElement
  const value = select.value as StatKey | ''
  if (!value) return
  incrementStat(side, playerId, value)
  // сбрасываем обратно плейсхолдер
  select.value = ''
}

function ensureStats(container: Side, playerId: number): PlayerMatchStats {
  const target = container === 'home' ? homeStats.value : awayStats.value
  if (!target[playerId]) {
    target[playerId] = { goals: 0, assists: 0, saves: 0, yellows: 0 }
  }
  return target[playerId]
}

function playerStat(side: Side, playerId: number): PlayerMatchStats {
  return ensureStats(side, playerId)
}

function incrementStat(side: Side, playerId: number, key: StatKey) {
  const st = ensureStats(side, playerId)
  st[key] += 1
}

function resetMatchStats() {
  homeStats.value = {}
  awayStats.value = {}
}

function updateStandingsForTeam(teamName: string, goalsFor: number, goalsAgainst: number) {
  const rows = standingsRows.value
  const row = rows.find(r => r.teamName === teamName)
  if (!row) return

  row.played += 1
  row.goalsFor += goalsFor
  row.goalsAgainst += goalsAgainst

  if (goalsFor > goalsAgainst) {
    row.wins += 1
    row.points += 3
  } else if (goalsFor < goalsAgainst) {
    row.losses += 1
  } else {
    row.draws += 1
    row.points += 1
  }

  row.goalDiff = row.goalsFor - row.goalsAgainst
}

function resortStandings() {
  standingsRows.value = [...standingsRows.value]
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
      return a.teamName.localeCompare(b.teamName)
    })
    .map((row, index) => ({
      ...row,
      place: index + 1,
    }))
}

function finishMatch() {
  if (!homeTeam.value || !awayTeam.value) return

  const hg = homeGoals.value
  const ag = awayGoals.value

  updateStandingsForTeam(homeTeam.value, hg, ag)
  updateStandingsForTeam(awayTeam.value, ag, hg)
  resortStandings()
  resetMatchStats()
}
</script>

