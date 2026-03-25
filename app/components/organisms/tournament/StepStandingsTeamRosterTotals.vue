<!-- Составы команд и суммарная статистика игроков за весь турнир. -->
<template>
  <section class="min-w-0 space-y-3">

    <div v-if="showHeading">
      <h3 class="text-xs font-semibold uppercase tracking-widest text-slate-400">
        Составы и статистика
      </h3>
      <p class="mt-0.5 text-xs text-slate-600">
        Суммарно за все завершённые матчи.
      </p>
    </div>

    <!-- Команды — все открыты сразу, без аккордеона -->
    <div class="space-y-3">
      <div
        v-for="teamName in teams"
        :key="teamName"
        class="rounded-xl border border-slate-700/40 bg-slate-900 overflow-hidden"
      >
        <!-- Заголовок команды -->
        <div class="flex items-center gap-2 px-3 py-2.5 border-b border-slate-800/60">
          <span class="shrink-0 text-base leading-none" aria-hidden="true">
            {{ teamMarker(teamName) }}
          </span>
          <span class="min-w-0 truncate text-sm font-semibold text-slate-100">
            {{ teamName }}
          </span>
          <span class="ml-auto shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500">
            {{ playersByTeam(teamName).length }}
          </span>
        </div>

        <!-- Список игроков -->
        <div class="px-2 py-2">
          <p v-if="playersByTeam(teamName).length === 0" class="px-1 py-1.5 text-xs text-slate-600">
            В составе нет игроков.
          </p>

          <ul v-else class="space-y-1" role="list">
            <li
              v-for="p in playersByTeam(teamName)"
              :key="p.id"
              class="flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-2"
              :class="playerBg(teamName)"
            >
              <!-- Имя — flex-1 забирает всё свободное место, остальное уходит под бейджи -->
              <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-100">
                {{ displayPlayerLabel(p) }}
              </span>

              <!-- Бейджи событий — в одну строку справа, не переносятся -->
              <div class="flex shrink-0 items-center gap-1">
                <template v-if="totalEvents(p.id) > 0">
                  <span
                    v-if="statsFor(p.id).goals > 0"
                    class="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/15 px-1.5 py-0.5
                           text-[11px] font-semibold tabular-nums text-emerald-300"
                  >
                    ⚽{{ statsFor(p.id).goals }}
                  </span>
                  <span
                    v-if="statsFor(p.id).assists > 0"
                    class="inline-flex items-center gap-0.5 rounded-md bg-sky-500/15 px-1.5 py-0.5
                           text-[11px] font-semibold tabular-nums text-sky-300"
                  >
                    🎯{{ statsFor(p.id).assists }}
                  </span>
                  <span
                    v-if="statsFor(p.id).saves > 0"
                    class="inline-flex items-center gap-0.5 rounded-md bg-violet-500/15 px-1.5 py-0.5
                           text-[11px] font-semibold tabular-nums text-violet-300"
                  >
                    🧤{{ statsFor(p.id).saves }}
                  </span>
                  <span
                    v-if="statsFor(p.id).yellows > 0"
                    class="inline-flex items-center gap-0.5 rounded-md bg-yellow-500/15 px-1.5 py-0.5
                           text-[11px] font-semibold tabular-nums text-yellow-300"
                  >
                    🟨{{ statsFor(p.id).yellows }}
                  </span>
                </template>
                <!-- Ничего нет — тихий прочерк -->
                <span v-else class="text-xs text-slate-700">—</span>

                <!-- Прогресс рейтинга за турнир — показываем только если есть дельта -->
                <span
                  v-if="ratingDelta(p.id)"
                  class="inline-flex items-center rounded-md px-1.5 py-0.5
                         text-[11px] font-semibold tabular-nums"
                  :class="ratingDeltaClass(p.id)"
                >
                  {{ ratingDelta(p.id) }}
                </span>
              </div>
            </li>
          </ul>
        </div>

      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'

type PlayerMatchStats = {
  goals: number
  assists: number
  saves: number
  yellows: number
}

const props = defineProps<{
  teams: string[]
  playersByTeam: (teamName: string) => Player[]
  teamMarker: (teamName: string) => string
  displayPlayerLabel: (player: Player) => string
  aggregatePlayerStats: Record<number, PlayerMatchStats>
  // Накопленные дельты рейтинга за весь турнир — для каждого игрока по id.
  playerRatingDeltas: Record<number, number>
  /** Если false — заголовок скрыт (когда он вынесен в родительский аккордеон). */
  showHeading?: boolean
}>()

const showHeading = computed(() => props.showHeading ?? true)

// Статистика игрока или нули если матчей ещё не было.
function statsFor(playerId: number): PlayerMatchStats {
  return props.aggregatePlayerStats[playerId] ?? { goals: 0, assists: 0, saves: 0, yellows: 0 }
}

// Сумма всех событий игрока — нужно чтобы скрыть пустой блок бейджей.
function totalEvents(playerId: number): number {
  const s = statsFor(playerId)
  return s.goals + s.assists + s.saves + s.yellows
}

// Возвращает форматированную строку дельты рейтинга (+1.5 / -0.8) или null если 0.
function ratingDelta(playerId: number): string | null {
  const delta = props.playerRatingDeltas[playerId]
  if (!delta) return null
  return delta > 0 ? `+${delta}` : String(delta)
}

// Цвет бейджа дельты: зелёный для роста, красный для падения.
function ratingDeltaClass(playerId: number): string {
  const delta = props.playerRatingDeltas[playerId]
  if (!delta || delta === 0) return ''
  return delta > 0
    ? 'text-emerald-400 bg-emerald-500/10'
    : 'text-red-400 bg-red-500/10'
}

// Маппинг маркера → лёгкий командный фон строки игрока (тот же принцип что в TeamRosterColumn).
const MARKER_BG: Record<string, string> = {
  '🔴': 'bg-red-500/5',
  '🟢': 'bg-emerald-500/5',
  '🔵': 'bg-blue-500/5',
  '🟡': 'bg-yellow-500/5',
  '⚪': 'bg-slate-300/5',
  '⚫': 'bg-slate-800/30',
}

function playerBg(teamName: string): string {
  const marker = props.teamMarker(teamName)
  return MARKER_BG[marker] ?? 'bg-slate-800/30'
}
</script>
