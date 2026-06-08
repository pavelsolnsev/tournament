<template>
  <!-- min-h-full вместо min-h-screen — высота от #scroll-root (fixed контейнера). -->
  <div
    class="flex min-h-full flex-col bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
  >
    <OrganismsViewerTournamentViewerHeader
      :tournament-name="tournamentName"
      :match-status="matchStatus"
      :is-refreshing="isRefreshing"
      :live-home-team="liveHomeTeam"
      :live-away-team="liveAwayTeam"
      :live-home-marker="liveHomeMarker"
      :live-away-marker="liveAwayMarker"
      :live-home-score="liveHomeScore"
      :live-away-score="liveAwayScore"
      :live-score-pill-class="liveScorePillClass"
      :live-player-rows="livePlayerRows"
      :expanded-player-ids="expandedPlayerIds"
      :max-visible-badges="maxVisibleBadges"
      :toggle-player-expand="togglePlayerExpand"
      :visible-badge-count="visibleBadgeCount"
      :on-back-to-admin="props.onBackToAdmin"
      @refresh="handleRefresh"
      @admin-enter="onAdminEnter"
      @header-wrap="headerActionsWrap = $event"
    />

    <main
      class="relative z-10 mx-auto flex w-full min-w-0 max-w-4xl flex-1 flex-col overflow-hidden px-4 transition-[padding] duration-300 print:max-w-none print:px-4 sm:px-6 print:!pt-6"
      :class="mainTopPaddingClass"
    >
      <!-- Фоновое видео — только пока турнир не начался, не в live-режиме.
           showBgVideo откладывает загрузку до idle, чтобы не мешать открытию на сотовой.
           poster показывает лёгкую картинку сразу, видео догружается следом. -->
      <video
        v-if="!hasViewerData && showBgVideo"
        class="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center opacity-50 dark:opacity-[0.25] sm:hidden"
        autoplay
        muted
        loop
        playsinline
        preload="none"
        poster="/bg-video-poster.webp"
      >
        <source src="/bg-video.mp4" type="video/mp4" />
      </video>

      <div class="relative z-10 flex flex-1 flex-col py-5 sm:py-8">
        <div
          v-if="!hasViewerData"
          class="flex flex-1 flex-col items-center justify-center"
        >
          <div
            class="flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-dashed border-slate-700 dark:border-slate-400 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm px-6 py-10 text-center"
          >
            <span class="text-5xl" aria-hidden="true">⚽</span>

            <p
              class="text-base font-semibold text-slate-700 dark:text-slate-300"
            >
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
        </div>

        <div
          v-else-if="matchStatus === 'finished' && tournamentSummary"
          class="flex flex-col gap-3"
        >
          <div
            class="overflow-hidden bg-white/90 dark:bg-slate-900/60 sm:rounded-2xl sm:border sm:border-slate-200/90 dark:sm:border-slate-700/50 print:rounded-2xl print:border print:border-slate-300 print:shadow-none"
          >
            <OrganismsViewerTournamentSummary
              :summary="tournamentSummary"
              :venue-label="venueLabel"
              :format-label="formatLabel"
              :tournament-date="tournamentDate"
              :team-colors="teamColors"
              :players="players"
              :assignment-by-player-id="assignmentByPlayerId"
              :aggregate-player-stats="
                initialSnapshot?.aggregatePlayerStats ?? {}
              "
              :player-rating-deltas="initialSnapshot?.playerRatingDeltas ?? {}"
              :played-matches-list="finishedPlayedMatches"
            />
          </div>
        </div>

        <OrganismsTournamentStepStandings
          v-else-if="hasViewerData"
          :key="snapshotKey"
          :tournament-name="tournamentName"
          :tournament-date="tournamentDate"
          :teams="teams"
          :team-colors="teamColors"
          :players="players"
          :assignment-by-player-id="assignmentByPlayerId"
          :initial-snapshot="initialSnapshot"
          :readonly="true"
          :show-clear-tournament-confirm="false"
          :clear-tournament-seconds-left="0"
          :clear-tournament-busy="false"
          @update:snapshot="onViewerSnapshotUpdate"
          @tournament-finished="onViewerTournamentFinished"
        />
      </div>
    </main>

    <OrganismsAdminLoginModal
      v-if="showLoginModal"
      @close="showLoginModal = false"
    />

    <MoleculesFeedbackModal />

    <!-- Футер с перелинковкой на связанные ресурсы РФОИ для SEO -->
    <footer
      class="mt-auto border-t border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 py-4 px-4 sm:px-6"
    >
      <div
        class="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400"
      >
        <span class="font-medium text-slate-600 dark:text-slate-300"
          >РФОИ — Раменское Футбол | Открытые Игры</span
        >
        <nav
          class="flex flex-wrap items-center gap-4"
          aria-label="Ресурсы РФОИ"
        >
          <a
            href="https://football.pavelsolntsev.ru"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            title="Рейтинги игроков и команды РФОИ"
            >Рейтинги игроков</a
          >
          <a
            href="https://vk.com/rmsfootball"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            title="Группа РФОИ ВКонтакте"
          >
            <svg
              class="h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14C20.67 22 22 20.67 22 15.07V8.93C22 3.33 20.67 2 15.07 2zm3.08 13.27h-1.5c-.57 0-.74-.45-1.76-1.49-.88-.87-1.27-.99-1.49-.99-.3 0-.39.09-.39.51v1.36c0 .36-.11.57-1.06.57-1.56 0-3.29-.95-4.51-2.71C6 10.31 5.5 8.5 5.5 8.09c0-.22.09-.43.51-.43h1.5c.38 0 .52.17.67.57.74 2.07 1.97 3.88 2.48 3.88.19 0 .28-.09.28-.57V9.7c-.06-1.02-.6-1.11-.6-1.47 0-.18.15-.36.38-.36h2.36c.32 0 .43.17.43.54v2.9c0 .32.14.43.23.43.19 0 .36-.11.72-.47 1.11-1.25 1.9-3.17 1.9-3.17.1-.22.28-.43.66-.43h1.5c.45 0 .55.23.45.54-.19.88-2.01 3.44-2.01 3.44-.16.26-.22.38 0 .67.16.21.68.66 1.03 1.06.64.72 1.13 1.33 1.26 1.75.14.41-.09.62-.51.62z"
              />
            </svg>
            ВКонтакте
          </a>
          <a
            href="https://t.me/RmsFootball"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            title="РФОИ в Telegram"
          >
            <svg
              class="h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.69 7.97c-.12.57-.46.71-.93.44l-2.58-1.9-1.24 1.2c-.14.14-.26.26-.52.26l.18-2.62 4.74-4.28c.21-.18-.04-.28-.32-.1L7.46 14.9l-2.54-.8c-.55-.17-.56-.55.12-.82l9.95-3.84c.46-.17.86.11.65.76z"
              />
            </svg>
            Telegram
          </a>
        </nav>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import type { MatchStatus, Player } from "~/types/tournament";
import type {
  SavedTournamentContext,
  SavedStandingsSnapshot,
} from "~/composables/useTournamentWizard";
import { useAdminAuth } from "~/composables/useAdminAuth";
import { useTeamColors } from "~/composables/useTeamColors";
import { useTournamentSummary } from "~/composables/useTournamentSummary";
import { useTournamentViewerLivePlayerRows } from "~/composables/useTournamentViewerLivePlayerRows";
import {
  dedupeTeamNamesPreservingOrder,
  normalizeTeamColorsMap,
  normalizeTeamName,
  resolveTeamColorIndex,
} from "~/utils/teamNames";

const props = defineProps<{
  state: SavedTournamentContext | null;
  players: Player[];
  onRefresh: () => void | Promise<void>;
  onBackToAdmin?: () => void;
}>();

const showLoginModal = ref(false);
const { restoreSession } = useAdminAuth();

const headerActionsWrap = ref(false);
const isRefreshing = ref(false);

// Фоновое видео (только мобильные) монтируем не сразу, а когда браузер освободится.
// На сотовой сети это критично: иначе видео конкурирует за канал с HTML/CSS/JS
// и страница «висит». Откладываем до idle после первого рендера — тогда видео
// догружается фоном и не мешает открытию сайта.
const showBgVideo = ref(false);
onMounted(() => {
  const start = () => {
    showBgVideo.value = true;
  };
  // requestIdleCallback есть не везде (Safari) — там просто короткий таймаут.
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(start, { timeout: 3000 });
  } else {
    setTimeout(start, 1500);
  }
});

async function handleRefresh() {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  try {
    await props.onRefresh();
  } finally {
    await new Promise((r) => setTimeout(r, 600));
    isRefreshing.value = false;
  }
}

function onAdminEnter() {
  if (restoreSession()) return;
  showLoginModal.value = true;
}

const tournamentName = computed(() => props.state?.tournamentName ?? "");
const tournamentDate = computed(() => props.state?.tournamentDate ?? "");
const venueLabel = computed(() => props.state?.venueLabel ?? "");
const formatLabel = computed(() => props.state?.formatLabel ?? "");
const teams = computed(() =>
  dedupeTeamNamesPreservingOrder(props.state?.confirmedTeamNames ?? []),
);
const teamColors = computed(() =>
  normalizeTeamColorsMap(props.state?.teamColors ?? {}),
);
const assignmentByPlayerId = computed(() => {
  const raw = props.state?.assignmentByPlayerId ?? {};
  const out: Record<number, string> = {};
  for (const [idStr, team] of Object.entries(raw)) {
    const n = normalizeTeamName(String(team));
    if (n) out[Number(idStr)] = n;
  }
  return out;
});
const initialSnapshot = computed<SavedStandingsSnapshot | null>(
  () => props.state?.standingsSnapshot ?? null,
);

const finishedPlayedMatches = computed(
  () => initialSnapshot.value?.playedMatchesList ?? [],
);

const matchStatus = computed<MatchStatus>(
  () => props.state?.matchStatus ?? "upcoming",
);

const tournamentSummary = computed(() => {
  const snap = initialSnapshot.value;
  if (!snap || snap.playedMatchesList.length === 0) return null;
  return useTournamentSummary({
    players: props.players,
    assignmentByPlayerId: assignmentByPlayerId.value,
    aggregatePlayerStats: snap.aggregatePlayerStats,
    playedMatchesList: snap.playedMatchesList,
    standingsRows: snap.standingsRows,
    playerRatingDeltas: snap.playerRatingDeltas,
    teamColors: teamColors.value,
  });
});

const liveHomeTeam = computed(() => props.state?.liveHomeTeam ?? "");
const liveAwayTeam = computed(() => props.state?.liveAwayTeam ?? "");

const { getMarkerByIndex, getMatchScorePillClass } = useTeamColors();
const liveHomeMarker = computed(() => {
  const idx = resolveTeamColorIndex(liveHomeTeam.value, teamColors.value, 0);
  return getMarkerByIndex(idx);
});
const liveAwayMarker = computed(() => {
  const idx = resolveTeamColorIndex(liveAwayTeam.value, teamColors.value, 1);
  return getMarkerByIndex(idx);
});

const liveHomeScore = computed(() => {
  const stats = initialSnapshot.value?.currentHomeStats ?? {};
  return Object.values(stats).reduce((sum, s) => sum + (s.goals ?? 0), 0);
});
const liveAwayScore = computed(() => {
  const stats = initialSnapshot.value?.currentAwayStats ?? {};
  return Object.values(stats).reduce((sum, s) => sum + (s.goals ?? 0), 0);
});

const liveScorePillClass = computed(() => {
  const h = liveHomeTeam.value;
  const a = liveAwayTeam.value;
  if (!h || !a)
    return "bg-slate-200 text-slate-600 ring-slate-300 dark:bg-slate-800/90 dark:text-slate-400 dark:ring-slate-600/40";
  return getMatchScorePillClass(
    liveHomeScore.value,
    liveAwayScore.value,
    h,
    a,
    (name) => resolveTeamColorIndex(name, teamColors.value, 0),
  );
});

const playersRef = computed(() => props.players);
const {
  livePlayerRows,
  expandedPlayerIds,
  togglePlayerExpand,
  visibleBadgeCount,
  maxVisibleBadges,
} = useTournamentViewerLivePlayerRows(initialSnapshot, playersRef);

const mainTopPaddingClass = computed(() => {
  const wrap = headerActionsWrap.value;
  const live =
    matchStatus.value === "live" &&
    Boolean(liveHomeTeam.value) &&
    Boolean(liveAwayTeam.value);
  if (!live) {
    return wrap
      ? "pt-[calc(6.75rem+env(safe-area-inset-top))] sm:pt-[calc(theme(spacing.14)+env(safe-area-inset-top))]"
      : "pt-[calc(theme(spacing.14)+env(safe-area-inset-top))] sm:pt-[calc(theme(spacing.14)+env(safe-area-inset-top))]";
  }
  if (livePlayerRows.value.length > 0) {
    return wrap
      ? "pt-[calc(6.75rem+env(safe-area-inset-top)+6.5rem)] sm:pt-[calc(theme(spacing.14)+env(safe-area-inset-top)+6.5rem)]"
      : "pt-[calc(theme(spacing.14)+env(safe-area-inset-top)+6.5rem)] sm:pt-[calc(theme(spacing.14)+env(safe-area-inset-top)+6.5rem)]";
  }
  return wrap
    ? "pt-[calc(6.75rem+env(safe-area-inset-top)+2.75rem)] sm:pt-[calc(theme(spacing.14)+env(safe-area-inset-top)+2.75rem)]"
    : "pt-[calc(theme(spacing.14)+env(safe-area-inset-top)+2.75rem)] sm:pt-[calc(theme(spacing.14)+env(safe-area-inset-top)+2.75rem)]";
});

const snapshotKey = computed(() => {
  const matchCount = initialSnapshot.value?.playedMatchesList?.length ?? 0;
  const teamKey = teams.value.join(",");
  return `${teamKey}:${matchCount}`;
});

const hasViewerData = computed(
  () => teams.value.length > 0 || initialSnapshot.value !== null,
);

function onViewerSnapshotUpdate(_snapshot: SavedStandingsSnapshot) {}
function onViewerTournamentFinished() {}
</script>
