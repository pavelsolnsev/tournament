<!-- Компонент PlayedMatchDetails: показывает детали матча (отмеченных игроков и их события). -->
<template>
  <div class="border-t border-slate-800/60 bg-slate-950/40 px-3 pb-3 pt-2.5">
    <!-- Нет ни одного игрока с событиями -->
    <p
      v-if="match.homePlayers.length === 0 && match.awayPlayers.length === 0"
      class="text-center text-xs text-slate-600"
    >
      Нет отмеченных игроков.
    </p>

    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-4">

      <!-- Домашняя команда -->
      <div v-if="match.homePlayers.length > 0" class="min-w-0">
        <!-- Заголовок: маркер + название — такой же как в ростере текущего матча -->
        <div class="mb-2 flex min-w-0 items-center gap-1.5 px-0.5">
          <span aria-hidden="true" class="shrink-0 text-base leading-none">{{ teamMarker(match.homeTeam) }}</span>
          <span class="min-w-0 truncate text-xs font-semibold uppercase tracking-wider text-slate-400">{{ match.homeTeam }}</span>
        </div>
        <!-- Список игроков домашней команды -->
        <ul class="space-y-1.5" role="list">
          <li
            v-for="p in match.homePlayers"
            :key="p.playerId"
            class="flex min-w-0 items-center gap-2 rounded-xl bg-slate-800/40 px-3 py-2.5"
          >
            <AtomsPlayerAvatar
              class="shrink-0"
              :photo="playerAvatarsById?.[p.playerId]?.photo ?? null"
              :fallback-name="playerAvatarsById?.[p.playerId]?.name ?? stripRatingFromDisplayLabel(p.name)"
              size="sm"
            />
            <!-- Имя без рейтинга: в старых матчах в name мог остаться суффикс с эмодзи и числом. -->
            <span class="min-w-0 flex-1 truncate text-sm font-medium leading-tight text-slate-100">{{ stripRatingFromDisplayLabel(p.name) }}</span>
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
        <!-- Заголовок: маркер + название -->
        <div class="mb-2 flex min-w-0 items-center gap-1.5 px-0.5">
          <span aria-hidden="true" class="shrink-0 text-base leading-none">{{ teamMarker(match.awayTeam) }}</span>
          <span class="min-w-0 truncate text-xs font-semibold uppercase tracking-wider text-slate-400">{{ match.awayTeam }}</span>
        </div>
        <!-- Список игроков гостевой команды -->
        <ul class="space-y-1.5" role="list">
          <li
            v-for="p in match.awayPlayers"
            :key="p.playerId"
            class="flex min-w-0 items-center gap-2 rounded-xl bg-slate-800/40 px-3 py-2.5"
          >
            <AtomsPlayerAvatar
              class="shrink-0"
              :photo="playerAvatarsById?.[p.playerId]?.photo ?? null"
              :fallback-name="playerAvatarsById?.[p.playerId]?.name ?? stripRatingFromDisplayLabel(p.name)"
              size="sm"
            />
            <!-- Имя без рейтинга — см. домашний список выше. -->
            <span class="min-w-0 flex-1 truncate text-sm font-medium leading-tight text-slate-100">{{ stripRatingFromDisplayLabel(p.name) }}</span>
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

defineProps<{
  match: PlayedMatch
  teamMarker: (teamName: string) => string
  /** Из StepStandings: фото и настоящее имя по id — для аватаров в деталях. */
  playerAvatarsById?: Record<number, { photo: string | null; name: string }>
}>()

// Конфигурация бейджей — полностью совпадает с StepStandingsTeamRosterColumn,
// чтобы стиль событий был одинаковым везде на сайте.
const STAT_BADGES = [
  { key: 'goals'   as const, icon: '⚽', bgClass: 'bg-emerald-500/15', textClass: 'text-emerald-300' },
  { key: 'assists' as const, icon: '🎯', bgClass: 'bg-sky-500/15',     textClass: 'text-sky-300' },
  { key: 'saves'   as const, icon: '🧤', bgClass: 'bg-violet-500/15',  textClass: 'text-violet-300' },
  { key: 'yellows' as const, icon: '🟨', bgClass: 'bg-yellow-500/15',  textClass: 'text-yellow-300' },
] as const
</script>
