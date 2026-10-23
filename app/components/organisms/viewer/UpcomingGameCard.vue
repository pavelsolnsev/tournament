<!-- Экран гостя до начала турнира: афиша «Ближайшая игра» или, если турнир не объявлен, прежняя заглушка. -->
<template>
  <div class="flex flex-1 flex-col items-center justify-center gap-4">
    <!-- Турнир объявлен: когда, где, формат, цена и кто записался. -->
    <section
      v-if="game"
      class="flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-slate-300 bg-white/80 p-4 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/70 sm:p-6"
      aria-label="Ближайшая игра"
    >
      <div class="flex flex-col gap-1">
        <p class="text-[11px] font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Ближайшая игра</p>
        <h2 class="text-lg font-bold leading-tight text-slate-800 first-letter:uppercase dark:text-slate-50 sm:text-xl">
          {{ whenLabel || 'Дата уточняется' }}
        </h2>
      </div>

      <!-- Место, формат, цена -->
      <ul class="flex flex-col gap-2 text-sm leading-normal text-slate-700 dark:text-slate-300">
        <li v-if="game.venue" class="flex items-start gap-2">
          <span aria-hidden="true">📍</span>
          <span class="min-w-0">
            <span class="font-semibold">{{ game.venue }}</span>
            <template v-if="game.address"> — {{ game.address }}</template>
            <a
              v-if="game.mapUrl"
              :href="game.mapUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="ml-1 whitespace-nowrap text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
            >Карта</a>
          </span>
        </li>
        <li v-if="game.format" class="flex items-start gap-2">
          <span aria-hidden="true">⚽</span>
          <span>{{ game.format }}</span>
        </li>
        <li v-if="game.sum" class="flex items-start gap-2">
          <span aria-hidden="true">💸</span>
          <span>{{ game.sum }} ₽ — оплата до начала игры</span>
        </li>
      </ul>

      <!-- Кто записался: по командам с заполненностью, или общим списком -->
      <div class="flex flex-col gap-2">
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Записались · {{ game.mainCount }}
        </p>
        <p v-if="game.mainCount === 0" class="text-sm text-slate-500 dark:text-slate-400">Пока никого — будь первым!</p>
        <div
          v-for="group in visibleGroups"
          :key="group.name ?? '—'"
          class="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700/60"
        >
          <div class="mb-1 flex items-center justify-between gap-2">
            <span class="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <AtomsTeamMarkerOrLogo v-if="group.name" :team-name="group.name" marker="⚽" size="xs" />
              <span class="truncate">{{ group.name ?? (game.groups.length > 1 ? 'Без команды' : 'Состав') }}</span>
            </span>
            <span class="shrink-0 text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
              {{ group.players.length }}<template v-if="group.limit"> / {{ group.limit }}</template>
              <template v-if="group.queue.length"> · очередь {{ group.queue.length }}</template>
            </span>
          </div>
          <p v-if="group.players.length" class="text-[13px] leading-normal text-slate-600 dark:text-slate-300">
            {{ group.players.map((p) => p.name).join(', ') }}
          </p>
        </div>
      </div>

      <!-- Запись идёт в беседе ВК — ведём в группу, откуда туда попадают. -->
      <a
        href="https://vk.com/rmsfootball"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 dark:bg-emerald-700 dark:hover:bg-emerald-600"
      >
        <AtomsVkLogoIcon size="md" />
        Записаться в ВК
      </a>
      <NuxtLink
        to="/tournaments"
        class="text-center text-sm font-medium text-slate-600 underline-offset-2 hover:underline dark:text-slate-400"
      >
        🏆 Прошлые турниры
      </NuxtLink>
    </section>

    <!-- Турнир не объявлен — прежняя заглушка. -->
    <div
      v-else
      class="flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-dashed border-slate-700 dark:border-slate-400 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm px-6 py-10 text-center"
    >
      <span class="text-5xl" aria-hidden="true">⚽</span>
      <p class="text-base font-semibold text-slate-700 dark:text-slate-300">
        Турнир ещё не начался
      </p>
      <NuxtLink
        to="/tournaments"
        class="inline-flex items-center gap-2.5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-900/20 transition-all hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-900/25 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 dark:bg-emerald-700 dark:hover:bg-emerald-600"
      >
        <span aria-hidden="true">🏆</span>
        Прошлые турниры
      </NuxtLink>
    </div>

    <!-- Топ-10 рейтинга — и под афишей, и под заглушкой «Турнир ещё не начался». -->
    <OrganismsViewerTopRatingCard :players="players" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Player } from '~/types/tournament'
import type { SavedTournamentContext } from '~/composables/tournament-wizard/savedContextTypes'
import { buildUpcomingGame } from '~/utils/upcomingGame'

const props = defineProps<{
  state: SavedTournamentContext | null
  players: Player[]
}>()

// Афиша из состояния турнира; null — турнир не объявлен.
const game = computed(() => buildUpcomingGame(props.state, props.players))

// «пятница, 24 октября · 20:00»
const whenLabel = computed(() => {
  const g = game.value
  if (!g) return ''
  return [g.dateLabel, g.time].filter(Boolean).join(' · ')
})

// Пустые команды без очереди тоже показываем — видно, куда ещё есть места. Пустой «Без команды» прячем.
const visibleGroups = computed(() =>
  (game.value?.groups ?? []).filter((g) => g.name !== null || g.players.length > 0),
)
</script>
