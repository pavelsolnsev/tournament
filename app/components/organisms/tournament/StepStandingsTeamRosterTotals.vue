<!-- Составы команд и суммарная статистика игроков за весь турнир. -->
<template>
  <section class="min-w-0 w-full space-y-3">

    <div v-if="showHeading">
      <h3 class="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">
        Составы и статистика
      </h3>
      <p class="mt-0.5 text-xs text-slate-400 dark:text-slate-600">
        Суммарно за все завершённые матчи.
      </p>
    </div>

    <!-- Команды — все открыты сразу, без аккордеона -->
    <div class="w-full min-w-0 space-y-3">
      <!-- Карточка команды: без рамки, на всю ширину — в итогах турнира и в шаге состава одинаково. -->
      <div
        v-for="teamName in teams"
        :key="teamName"
        class="w-full min-w-0 overflow-hidden rounded-none bg-slate-50/90 dark:bg-slate-900/30"
      >
        <!-- Заголовок команды -->
        <div class="flex items-center gap-2 py-2.5">
          <span class="shrink-0 text-base leading-none" aria-hidden="true">
            <AtomsTeamMarkerOrLogo :team-name="teamName" :marker="teamMarker(teamName)" size="sm" />
          </span>
          <span class="min-w-0 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            {{ teamName }}
          </span>
        </div>

        <!-- Список игроков -->
        <div class="pb-2">
          <p v-if="playersByTeam(teamName).length === 0" class="px-1 py-1.5 text-xs text-slate-400 dark:text-slate-600">
            В составе нет игроков.
          </p>

          <ul v-else class="space-y-1" role="list">
            <!-- Строка игрока — нейтральный фон, как в других списках состава. -->
            <li
              v-for="p in playersByTeam(teamName)"
              :key="p.id"
              class="flex min-w-0 items-center gap-2 rounded-xl border border-transparent bg-slate-100/80 px-3 py-2.5 dark:bg-slate-800/40"
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

                <!-- Иконка удаления игрока из состава — только админу (в режиме зрителя скрыта). -->
                <button
                  v-if="!readonly && confirmingId !== p.id"
                  type="button"
                  class="ml-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400
                         transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
                  :title="'Убрать из состава: ' + p.name"
                  :aria-label="'Убрать из состава: ' + p.name"
                  @click="confirmingId = p.id"
                >
                  <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M8.75 1a1 1 0 00-.95.68L7.42 3H4a1 1 0 000 2h.1l.82 11.42A2 2 0 006.91 18h6.18a2 2 0 001.99-1.58L15.9 5H16a1 1 0 100-2h-3.42l-.38-1.32A1 1 0 0011.25 1h-2.5zM9 7a.75.75 0 011.5 0v6a.75.75 0 01-1.5 0V7zm-2.25-.75A.75.75 0 016 7l.25 6a.75.75 0 11-1.5.06L4.5 7a.75.75 0 01.75-.75H6.75zm6.75.75A.75.75 0 0014 7l-.25 6a.75.75 0 001.5.06L15.5 7a.75.75 0 00-.75-.75h-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>

              <!-- Подтверждение удаления — заменяет правую часть строки, чтобы не промахнуться на телефоне. -->
              <div v-if="!readonly && confirmingId === p.id" class="ml-auto flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  class="inline-flex items-center rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white
                         transition-colors hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
                  @click="confirmRemove(p.id)"
                >
                  Убрать
                </button>
                <button
                  type="button"
                  class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700
                         transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                  @click="confirmingId = null"
                >
                  Отмена
                </button>
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
import { round1 } from '~/composables/tournament-standings/ratingCalc'

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
    /** true (режим зрителя) — не показываем кнопку удаления игрока из состава. */
    readonly?: boolean
  }>(),
  { hideBasePlayerRating: false, readonly: false },
)

// Просим родителя убрать игрока из турнира (из состава, списка и назначений).
const emit = defineEmits<{
  (e: 'remove-player', playerId: number): void
}>()

const showHeading = computed(() => props.showHeading ?? true)

// id игрока, для которого сейчас показываем подтверждение удаления (только один за раз).
const confirmingId = ref<number | null>(null)

// Подтверждение получено — сообщаем родителю и закрываем подтверждение.
function confirmRemove(playerId: number) {
  emit('remove-player', playerId)
  confirmingId.value = null
}

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

// Возвращает дельту с одним знаком после запятой (+1.5 / -0.8) или null если после округления ноль.
function ratingDelta(playerId: number): string | null {
  const delta = props.playerRatingDeltas[playerId]
  if (delta === undefined || delta === null || delta === 0) return null
  const d = round1(delta)
  if (d === 0) return null
  const s = d.toFixed(1)
  return d > 0 ? `+${s}` : s
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
