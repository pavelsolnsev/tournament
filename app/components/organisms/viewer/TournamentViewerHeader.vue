<template>
  <!-- Simple10: Шапка зрителя — лого, статус, кнопки и при live — счёт и бейджи игроков. -->
  <header
    class="absolute inset-x-0 top-0 z-20 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pt-[env(safe-area-inset-top)] print:hidden"
  >
    <div
      ref="headerRootRef"
      class="mx-auto flex w-full min-w-0 max-w-4xl gap-2 px-4 sm:gap-3 sm:px-6"
      :class="
        headerActionsWrap
          ? 'flex-col py-2'
          : 'h-14 flex-row items-center justify-between py-0'
      "
    >
      <div ref="headerLeftRef" class="flex min-h-0 min-w-0 flex-1 items-center gap-1 sm:gap-1.5">
        <img
          src="/favicon-96x96.png"
          srcset="/favicon-96x96.png 1x, /icon-192.png 2x"
          alt=""
          width="36"
          height="36"
          decoding="async"
          class="h-8 w-8 shrink-0 flex-none object-contain sm:h-9 sm:w-9"
        />
        <div class="flex min-w-0 min-h-0 flex-1 items-center gap-1.5 sm:gap-2">
          <div
            class="min-w-0"
            :class="tournamentName ? 'flex-1' : 'shrink-0'"
          >
            <h1
              class="truncate text-sm font-bold leading-tight text-slate-800 dark:text-slate-50 sm:text-base sm:text-lg"
            >
              <span v-if="tournamentName">{{ tournamentName }}</span>
              <span v-else class="sr-only">Турнир</span>
            </h1>
          </div>

          <AtomsMatchStatusBadge
            v-if="matchStatus"
            :status="matchStatus"
            class="shrink-0"
          />
        </div>
      </div>

      <div
        ref="headerActionsRef"
        class="flex shrink-0 items-center justify-end gap-px sm:gap-0.5"
        :class="
          headerActionsWrap &&
            'w-full border-t border-slate-200/80 pt-1.5 dark:border-slate-700/60 dark:pt-1.5'
        "
      >
        <AtomsHeaderRefreshButton :busy="isRefreshing" @click="emit('refresh')" />
        <AtomsFeedbackButton />
        <AtomsThemeToggle />
        <button
          type="button"
          class="inline-flex h-10 items-center gap-1 rounded-xl px-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100/60 hover:text-slate-700 active:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 sm:h-11 sm:gap-2 sm:px-3 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 dark:active:bg-slate-800"
          aria-label="Войти как администратор"
          @click="emit('admin-enter')"
        >
          <span aria-hidden="true">🔐</span>
          <span :class="headerActionsWrap ? 'inline' : 'hidden sm:inline'">Войти</span>
        </button>
      </div>
    </div>

    <Transition
      enter-active-class="transition-all duration-300 ease-out overflow-hidden"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-40 opacity-100"
      leave-active-class="transition-all duration-200 ease-in overflow-hidden"
      leave-from-class="max-h-40 opacity-100"
      leave-to-class="max-h-0 opacity-0"
      @after-enter="scrollExpandedPanelIntoView"
    >
      <div
        v-if="matchStatus === 'live' && liveHomeTeam && liveAwayTeam"
        class="border-t border-red-500/20 bg-red-500/5"
      >
        <div
          class="mx-auto flex w-full min-w-0 max-w-4xl items-center justify-center gap-2 px-4 sm:px-6 pt-2 pb-1"
        >
          <span
            class="min-w-0 flex items-center justify-end gap-1.5 text-right text-sm font-semibold text-slate-800 dark:text-slate-100 flex-1"
          >
            <AtomsTeamMarkerOrLogo
              :team-name="liveHomeTeam"
              :marker="liveHomeMarker"
              size="md"
            />
            <span class="truncate">{{ liveHomeTeam }}</span>
          </span>
          <span
            class="shrink-0 inline-flex min-w-[3.5rem] items-center justify-center rounded-lg px-2 py-0.5 text-center text-base font-extrabold tabular-nums tracking-tight ring-1"
            :class="liveScorePillClass"
          >
            {{ liveHomeScore }}&thinsp;:&thinsp;{{ liveAwayScore }}
          </span>
          <span
            class="min-w-0 flex items-center justify-start gap-1.5 text-left text-sm font-semibold text-slate-800 dark:text-slate-100 flex-1"
          >
            <span class="truncate">{{ liveAwayTeam }}</span>
            <AtomsTeamMarkerOrLogo
              :team-name="liveAwayTeam"
              :marker="liveAwayMarker"
              size="md"
            />
          </span>
        </div>

        <div
          v-if="livePlayerRows.length > 0"
          class="mx-auto w-full min-w-0 max-w-4xl px-4 sm:px-6 pb-2.5"
        >
          <div class="mb-2 border-t border-red-500/15" />
          <div class="grid grid-cols-2 gap-x-2">
            <div class="flex flex-col gap-1">
              <div
                v-for="row in livePlayerRows.filter((r) => r.side === 'home')"
                :key="row.playerId"
                class="flex min-w-0 items-center gap-1"
                :class="
                  row.badges.length > maxVisibleBadges &&
                    'cursor-pointer select-none'
                "
                @click="
                  row.badges.length > maxVisibleBadges &&
                    togglePlayerExpand(row.playerId)
                "
              >
                <AtomsPlayerAvatar
                  class="shrink-0"
                  size="xs"
                  :photo="row.photo"
                  :fallback-name="row.avatarFallbackName"
                />
                <span
                  class="min-w-0 truncate text-[11px] font-medium leading-none text-slate-800 dark:text-slate-100"
                >{{ row.name }}</span>
                <div class="flex shrink-0 items-center gap-0.5">
                  <span
                    v-for="badge in row.badges.slice(
                      0,
                      visibleBadgeCount(row.playerId, row.badges.length),
                    )"
                    :key="badge.key"
                    class="inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[10px] font-semibold tabular-nums leading-none"
                    :class="badge.bgClass + ' ' + badge.textClass"
                  >
                    {{ badge.icon }}{{ badge.count }}
                  </span>
                  <span
                    v-if="
                      row.badges.length > maxVisibleBadges &&
                        !expandedPlayerIds.has(row.playerId)
                    "
                    class="inline-flex items-center rounded-md px-1 py-0.5 text-[10px] font-semibold leading-none bg-slate-200/80 text-slate-600 dark:bg-slate-700/80 dark:text-slate-400 transition-opacity"
                  >+{{ row.badges.length - maxVisibleBadges }}</span>
                </div>
              </div>
            </div>
            <div class="flex flex-col gap-1">
              <div
                v-for="row in livePlayerRows.filter((r) => r.side === 'away')"
                :key="row.playerId"
                class="flex min-w-0 items-center justify-end gap-1"
                :class="
                  row.badges.length > maxVisibleBadges &&
                    'cursor-pointer select-none'
                "
                @click="
                  row.badges.length > maxVisibleBadges &&
                    togglePlayerExpand(row.playerId)
                "
              >
                <div class="flex shrink-0 items-center gap-0.5">
                  <span
                    v-if="
                      row.badges.length > maxVisibleBadges &&
                        !expandedPlayerIds.has(row.playerId)
                    "
                    class="inline-flex items-center rounded-md px-1 py-0.5 text-[10px] font-semibold leading-none bg-slate-200/80 text-slate-600 dark:bg-slate-700/80 dark:text-slate-400 transition-opacity"
                  >+{{ row.badges.length - maxVisibleBadges }}</span>
                  <span
                    v-for="badge in row.badges.slice(
                      0,
                      visibleBadgeCount(row.playerId, row.badges.length),
                    )"
                    :key="badge.key"
                    class="inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[10px] font-semibold tabular-nums leading-none"
                    :class="badge.bgClass + ' ' + badge.textClass"
                  >
                    {{ badge.icon }}{{ badge.count }}
                  </span>
                </div>
                <span
                  class="min-w-0 truncate text-[11px] font-medium leading-none text-slate-800 dark:text-slate-100"
                >{{ row.name }}</span>
                <AtomsPlayerAvatar
                  class="shrink-0"
                  size="xs"
                  :photo="row.photo"
                  :fallback-name="row.avatarFallbackName"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, watch } from 'vue'
import type { LiveViewerPlayerRow } from '~/composables/useTournamentViewerLivePlayerRows'
import { scrollExpandedPanelIntoView } from '~/utils/scrollExpandedPanelIntoView'

const props = defineProps<{
  tournamentName: string
  matchStatus: string
  isRefreshing: boolean
  liveHomeTeam: string
  liveAwayTeam: string
  liveHomeMarker: string
  liveAwayMarker: string
  liveHomeScore: number
  liveAwayScore: number
  liveScorePillClass: string
  livePlayerRows: LiveViewerPlayerRow[]
  expandedPlayerIds: Set<number>
  maxVisibleBadges: number
  togglePlayerExpand: (playerId: number) => void
  visibleBadgeCount: (playerId: number, totalBadges: number) => number
}>()

const emit = defineEmits<{
  refresh: []
  'admin-enter': []
  'header-wrap': [wrapped: boolean]
}>()

const headerRootRef = useTemplateRef<HTMLElement>('headerRootRef')
const headerLeftRef = useTemplateRef<HTMLElement>('headerLeftRef')
const headerActionsRef = useTemplateRef<HTMLElement>('headerActionsRef')
const headerActionsWrap = ref(false)

function syncHeaderWrap() {
  const root = headerRootRef.value
  const left = headerLeftRef.value
  const actions = headerActionsRef.value
  if (!root || !left || !actions) return
  headerActionsWrap.value = false
  nextTick(() => {
    requestAnimationFrame(() => {
      const lr = left.getBoundingClientRect()
      const ar = actions.getBoundingClientRect()
      headerActionsWrap.value = lr.right > ar.left - 2
      emit('header-wrap', headerActionsWrap.value)
    })
  })
}

let headerResizeObserver: ResizeObserver | null = null

onMounted(() => {
  syncHeaderWrap()
  headerResizeObserver = new ResizeObserver(() => syncHeaderWrap())
  if (headerRootRef.value) headerResizeObserver.observe(headerRootRef.value)
})

onUnmounted(() => {
  headerResizeObserver?.disconnect()
  headerResizeObserver = null
})

watch(
  () => [props.tournamentName, props.matchStatus],
  () => nextTick(() => syncHeaderWrap()),
)

watch(
  () => [props.liveHomeTeam, props.liveAwayTeam],
  () => nextTick(() => syncHeaderWrap()),
)
</script>
