<!-- Составы команд и суммарная статистика игроков за весь турнир. -->
<template>
  <section class="min-w-0 space-y-3">

    <div v-if="showHeading">
      <h3 class="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">
        Составы и статистика
      </h3>
      <p class="mt-0.5 text-xs text-slate-400 dark:text-slate-600">
        Суммарно за все завершённые матчи.
      </p>
    </div>

    <!-- Команды — все открыты сразу, без аккордеона -->
    <div class="space-y-3">
      <!-- Карточка команды: только slate и рамка — без красного/синего фона от цвета команды. -->
      <div
        v-for="teamName in teams"
        :key="teamName"
        class="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700/60 dark:bg-slate-900/30"
      >
        <!-- Заголовок команды -->
        <div class="flex items-center gap-2 px-3 py-2.5">
          <span class="shrink-0 text-base leading-none" aria-hidden="true">
            {{ teamMarker(teamName) }}
          </span>
          <span class="min-w-0 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            {{ teamName }}
          </span>
        </div>

        <!-- Список игроков -->
        <div class="px-2 pb-2">
          <p v-if="playersByTeam(teamName).length === 0" class="px-1 py-1.5 text-xs text-slate-400 dark:text-slate-600">
            В составе нет игроков.
          </p>

          <ul v-else class="space-y-1" role="list">
            <!-- Строка игрока — нейтральный фон, как в других списках состава. -->
            <li
              v-for="p in playersByTeam(teamName)"
              :key="p.id"
              class="flex min-w-0 items-center gap-2 rounded-xl border border-transparent bg-slate-100 px-3 py-2.5 dark:bg-slate-800/40"
            >
              <AtomsPlayerAvatar
                class="shrink-0"
                :photo="p.photo"
                :fallback-name="p.name"
                size="md"
              />
              <!-- До старта игр — имя + базовый рейтинг; после — только имя, прогресс в бейдже дельты. -->
              <span class="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                <span class="min-w-0 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                  {{ labelParts(p).name }}
                </span>
                <span
                  v-if="!hideBasePlayerRating && labelParts(p).rating"
                  class="shrink-0 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-100 tabular-nums"
                >{{ labelParts(p).rating }}</span>
              </span>

              <!-- Бейджи событий — в одну строку справа, не переносятся -->
              <div class="flex shrink-0 items-center gap-1">
                <template v-if="totalEvents(p.id) > 0">
                  <span
                    v-if="statsFor(p.id).goals > 0"
                    class="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/15 px-1.5 py-0.5
                           text-[11px] font-semibold tabular-nums text-emerald-900 dark:text-emerald-300"
                  >
                    ⚽{{ statsFor(p.id).goals }}
                  </span>
                  <span
                    v-if="statsFor(p.id).assists > 0"
                    class="inline-flex items-center gap-0.5 rounded-md bg-sky-500/15 px-1.5 py-0.5
                           text-[11px] font-semibold tabular-nums text-sky-900 dark:text-sky-300"
                  >
                    🎯{{ statsFor(p.id).assists }}
                  </span>
                  <span
                    v-if="statsFor(p.id).saves > 0"
                    class="inline-flex items-center gap-0.5 rounded-md bg-violet-500/15 px-1.5 py-0.5
                           text-[11px] font-semibold tabular-nums text-violet-900 dark:text-violet-300"
                  >
                    🧤{{ statsFor(p.id).saves }}
                  </span>
                  <span
                    v-if="statsFor(p.id).yellows > 0"
                    class="inline-flex items-center gap-0.5 rounded-md bg-amber-500/15 px-1.5 py-0.5
                           text-[11px] font-semibold tabular-nums text-amber-950 dark:text-yellow-300"
                  >
                    🟨{{ statsFor(p.id).yellows }}
                  </span>
                </template>
                <!-- Ничего нет — тихий прочерк -->
                <span v-else class="text-xs text-slate-400 dark:text-slate-700">—</span>

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
import { playerLabelRatingParts } from '~/composables/usePlayerDisplay'

type PlayerMatchStats = {
  goals: number
  assists: number
  saves: number
  yellows: number
}

const props = withDefaults(
  defineProps<{
    teams: string[]
    playersByTeam: (teamName: string) => Player[]
    teamMarker: (teamName: string) => string
    displayPlayerLabel: (player: Player) => string
    aggregatePlayerStats: Record<number, PlayerMatchStats>
    // Накопленные дельты рейтинга за весь турнир — для каждого игрока по id.
    playerRatingDeltas: Record<number, number>
    /** Если false — заголовок скрыт (когда он вынесен в родительский аккордеон). */
    showHeading?: boolean
    /** true — убрать «⭐️ N» в строке (после старта турнира); дельту рейтинга не трогаем. */
    hideBasePlayerRating?: boolean
  }>(),
  { hideBasePlayerRating: false },
)

const showHeading = computed(() => props.showHeading ?? true)

function labelParts(p: Player) {
  return playerLabelRatingParts(p)
}

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
  // Светлая тема: зелёный/красный чуть насыщеннее для контраста.
  return delta > 0
    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
    : 'text-red-600 dark:text-red-400 bg-red-500/10'
}

</script>
