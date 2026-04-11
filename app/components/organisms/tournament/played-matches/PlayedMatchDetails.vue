<!-- Компонент PlayedMatchDetails: показывает детали матча (отмеченных игроков и их события). -->
<template>
  <div
    class="border-t px-3 pb-3 pt-2.5"
      :class="props.embedded
      ? 'border-slate-200 bg-transparent dark:border-slate-700/50 dark:bg-transparent'
      : 'border-slate-200 bg-slate-50/80 dark:border-slate-800/60 dark:bg-slate-950/40'"
  >
    <!-- Нет ни одного игрока с событиями -->
    <p
      v-if="match.homePlayers.length === 0 && match.awayPlayers.length === 0"
      class="text-center text-xs text-slate-600 dark:text-slate-600"
    >
      Нет отмеченных игроков.
    </p>

    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-4">

      <!-- Домашняя команда -->
      <div v-if="match.homePlayers.length > 0" class="min-w-0">
        <!-- В embedded на sm+ заголовок скрыт (две колонки рядом — понятно по порядку); на телефоне снова показываем, когда блоки столбиком. -->
        <div
          class="mb-2 flex min-w-0 items-center gap-1.5 px-0.5"
          :class="props.embedded ? 'sm:hidden' : ''"
        >
          <AtomsTeamMarkerOrLogo :team-name="match.homeTeam" :marker="teamMarker(match.homeTeam)" size="md" />
          <span class="min-w-0 truncate text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">{{ match.homeTeam }}</span>
        </div>
        <!-- Список игроков домашней команды -->
        <ul class="space-y-1.5" role="list">
          <li
            v-for="p in match.homePlayers"
            :key="p.playerId"
            class="flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5"
            :class="props.embedded
              ? 'border-slate-200/90 bg-slate-50/80 dark:border-slate-600/50 dark:bg-slate-800/35'
              : 'border-slate-200/90 bg-slate-50 dark:border-transparent dark:bg-slate-800/40'"
          >
            <AtomsPlayerAvatar
              class="shrink-0"
              :photo="playerAvatarsById?.[p.playerId]?.photo ?? null"
              :fallback-name="playerAvatarsById?.[p.playerId]?.name ?? stripRatingFromDisplayLabel(p.name)"
              size="sm"
            />
            <!-- Имя без рейтинга: в старых матчах в name мог остаться суффикс с эмодзи и числом. -->
            <span class="min-w-0 flex-1 truncate text-sm font-medium leading-tight text-slate-800 dark:text-slate-100">{{ stripRatingFromDisplayLabel(p.name) }}</span>
            <!-- Цветные бейджи событий — те же что и в ростере текущего матча -->
            <div class="flex shrink-0 items-center gap-1">
              <template v-for="badge in STAT_BADGES" :key="badge.key">
                <span
                  v-if="(match.homeStats[p.playerId]?.[badge.key] ?? 0) > 0"
                  class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                  :class="[badge.bgClass, badge.textClass]"
                >
                  {{ badge.icon }}{{ match.homeStats[p.playerId]?.[badge.key] ?? 0 }}
                </span>
              </template>
            </div>
          </li>
        </ul>
      </div>

      <!-- Гостевая команда -->
      <div v-if="match.awayPlayers.length > 0" class="min-w-0">
        <div
          class="mb-2 flex min-w-0 items-center gap-1.5 px-0.5"
          :class="props.embedded ? 'sm:hidden' : ''"
        >
          <AtomsTeamMarkerOrLogo :team-name="match.awayTeam" :marker="teamMarker(match.awayTeam)" size="md" />
          <span class="min-w-0 truncate text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">{{ match.awayTeam }}</span>
        </div>
        <!-- Список игроков гостевой команды -->
        <ul class="space-y-1.5" role="list">
          <li
            v-for="p in match.awayPlayers"
            :key="p.playerId"
            class="flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5"
            :class="props.embedded
              ? 'border-slate-200/90 bg-slate-50/80 dark:border-slate-600/50 dark:bg-slate-800/35'
              : 'border-slate-200/90 bg-slate-50 dark:border-transparent dark:bg-slate-800/40'"
          >
            <AtomsPlayerAvatar
              class="shrink-0"
              :photo="playerAvatarsById?.[p.playerId]?.photo ?? null"
              :fallback-name="playerAvatarsById?.[p.playerId]?.name ?? stripRatingFromDisplayLabel(p.name)"
              size="sm"
            />
            <!-- Имя без рейтинга — см. домашний список выше. -->
            <span class="min-w-0 flex-1 truncate text-sm font-medium leading-tight text-slate-800 dark:text-slate-100">{{ stripRatingFromDisplayLabel(p.name) }}</span>
            <!-- Цветные бейджи событий -->
            <div class="flex shrink-0 items-center gap-1">
              <template v-for="badge in STAT_BADGES" :key="badge.key">
                <span
                  v-if="(match.awayStats[p.playerId]?.[badge.key] ?? 0) > 0"
                  class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                  :class="[badge.bgClass, badge.textClass]"
                >
                  {{ badge.icon }}{{ match.awayStats[p.playerId]?.[badge.key] ?? 0 }}
                </span>
              </template>
            </div>
          </li>
        </ul>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlayedMatch } from '~/composables/tournament-standings/types'
import { stripRatingFromDisplayLabel } from '~/composables/usePlayerDisplay'

const props = withDefaults(
  defineProps<{
    match: PlayedMatch
    teamMarker: (teamName: string) => string
    /** Из StepStandings: фото и настоящее имя по id — для аватаров в деталях. */
    playerAvatarsById?: Record<number, { photo: string | null; name: string }>
    /**
     * Встроенный вид (итоги турнира): без повторного заголовка команды и без лишнего тёмного слоя —
     * строка счёта выше уже показала команды.
     */
    embedded?: boolean
  }>(),
  { embedded: false },
)

// Конфигурация бейджей — полностью совпадает с StepStandingsTeamRosterColumn,
// чтобы стиль событий был одинаковым везде на сайте.
const STAT_BADGES = [
  { key: 'goals'   as const, icon: '⚽', bgClass: 'bg-emerald-500/15', textClass: 'text-emerald-900 dark:text-emerald-300' },
  { key: 'assists' as const, icon: '🎯', bgClass: 'bg-sky-500/15',     textClass: 'text-sky-900 dark:text-sky-300' },
  { key: 'saves'   as const, icon: '🧤', bgClass: 'bg-violet-500/15',  textClass: 'text-violet-900 dark:text-violet-300' },
  { key: 'yellows' as const, icon: '🟨', bgClass: 'bg-amber-500/15',  textClass: 'text-amber-950 dark:text-yellow-300' },
] as const
</script>
