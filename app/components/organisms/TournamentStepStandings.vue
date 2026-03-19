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

      <!-- Автоматический выбор следующего матча -->
      <div class="mt-1.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-sky-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!hasNextMatch"
          @click="goToNextMatch"
        >
          Следующий матч
        </button>
        <p v-if="!hasNextMatch" class="text-[11px] text-slate-500">
          Все пары команд уже сыграли между собой.
        </p>
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
                      {{ displayPlayerLabel(p) }}
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
                      {{ displayPlayerLabel(p) }}
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
import { useTournamentStandings } from '~/composables/useTournamentStandings'

// Этот шаг показывает матчи и турнирную таблицу.
const props = defineProps<{
  tournamentName: string
  tournamentDate: string
  teams: string[]
  teamColors: Record<string, number>
  players: Player[]
  assignmentByPlayerId: Record<number, string>
}>()

const {
  teamMarkers,
  effectiveTeamColors,
  teamMarker,
  standingsRows,
  hasNextMatch,
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
  canFinishMatch,
  playersByTeam,
  activeSelection,
  selectPlayerForMark,
  isActivePlayer,
  playerStat,
  onSelectAction,
  resetMatchStats,
  finishMatch,
  goToNextMatch,
  displayPlayerLabel,
} = useTournamentStandings({
  teams: props.teams,
  teamColors: props.teamColors,
  players: props.players,
  assignmentByPlayerId: props.assignmentByPlayerId,
})
</script>

