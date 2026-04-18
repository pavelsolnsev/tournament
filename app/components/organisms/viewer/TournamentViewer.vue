<template>
  <!-- min-h-full вместо min-h-screen — высота от #scroll-root (fixed контейнера). -->
  <!-- Светлая тема: белый фон. Тёмная: slate-900. -->
  <div
    class="flex min-h-full flex-col bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
  >
    <!-- Шапка: absolute + safe-area сверху, не двигает контент -->
    <header
      class="absolute inset-x-0 top-0 z-20 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pt-[env(safe-area-inset-top)] print:hidden"
    >
      <!-- Одна строка по умолчанию; вторую включаем только если левая группа реально наезжает на кнопки (syncHeaderWrap). -->
      <div
        ref="headerRootRef"
        class="mx-auto flex w-full min-w-0 max-w-4xl gap-2 px-3 sm:gap-3 sm:px-6"
        :class="
          headerActionsWrap
            ? 'flex-col py-2'
            : 'h-14 flex-row items-center justify-between py-0'
        "
      >
        <!-- Лого снаружи min-w-0 — иначе на узком экране flex сжимает колонку с заголовком и картинка пропадает. -->
        <!-- Между лого и текстом/бейджем узкий зазор — визуально одна группа. -->
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
          <div
            class="flex min-w-0 min-h-0 flex-1 items-center gap-1.5 sm:gap-2"
          >
            <!-- Без названия не даём колонке flex-1 — иначе пустое место раздвигает лого и бейдж. -->
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

            <!-- Бейдж статуса — сразу видно идёт ли матч сейчас -->
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
          <!-- Кнопка обновить — зритель может вручную получить свежие данные в любой момент. -->
          <AtomsHeaderRefreshButton :busy="isRefreshing" @click="handleRefresh" />
          <AtomsFeedbackButton />
          <AtomsThemeToggle />
          <!-- Кнопка «Войти»: спокойная (для владельца), но с нормальной тач-зоной -->
          <button
            type="button"
            class="inline-flex h-10 items-center gap-1 rounded-xl px-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100/60 hover:text-slate-700 active:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 sm:h-11 sm:gap-2 sm:px-3 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 dark:active:bg-slate-800"
            aria-label="Войти как администратор"
            @click="onAdminEnter"
          >
            <span aria-hidden="true">🔐</span>
            <span :class="headerActionsWrap ? 'inline' : 'hidden sm:inline'">Войти</span>
          </button>
        </div>
      </div>

      <!-- Строка с текущими командами Live-матча — показывается только когда матч идёт -->
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
          <!-- Строка счёта: маркер + название команды — СЧЁТ — маркер + название команды -->
          <div
            class="mx-auto flex w-full min-w-0 max-w-4xl items-center justify-center gap-2 px-4 sm:px-6 pt-2 pb-1"
          >
            <!-- Домашняя команда: маркер слева, название по правому краю -->
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
            <!-- Счёт: ничья — серая плашка; лидер — в цвете команды из настроек турнира. -->
            <span
              class="shrink-0 inline-flex min-w-[3.5rem] items-center justify-center rounded-lg px-2 py-0.5 text-center text-base font-extrabold tabular-nums tracking-tight ring-1"
              :class="liveScorePillClass"
            >
              {{ liveHomeScore }}&thinsp;:&thinsp;{{ liveAwayScore }}
            </span>
            <!-- Гостевая команда: название по левому краю, маркер справа -->
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

          <!-- Статистика игроков текущего матча — показывается если есть хоть одно событие -->
          <div
            v-if="livePlayerRows.length > 0"
            class="mx-auto w-full min-w-0 max-w-4xl px-3 sm:px-6 pb-2.5"
          >
            <!-- Разделитель между счётом и статистикой -->
            <div class="mb-2 border-t border-red-500/15" />
            <!-- Два столбца: домашняя команда слева, гостевая справа -->
            <div class="grid grid-cols-2 gap-x-2">
              <!-- Левая колонка — домашняя команда -->
              <div class="flex flex-col gap-1">
                <div
                  v-for="row in livePlayerRows.filter((r) => r.side === 'home')"
                  :key="row.playerId"
                  class="flex min-w-0 items-center gap-1"
                  :class="
                    row.badges.length > MAX_VISIBLE_BADGES &&
                    'cursor-pointer select-none'
                  "
                  @click="
                    row.badges.length > MAX_VISIBLE_BADGES &&
                    togglePlayerExpand(row.playerId)
                  "
                >
                  <!-- Аватар у края своей половины — сразу видно чей игрок -->
                  <AtomsPlayerAvatar
                    class="shrink-0"
                    size="xs"
                    :photo="row.photo"
                    :fallback-name="row.avatarFallbackName"
                  />
                  <!-- Имя — нейтральный slate, без оттенка команды; длинное имя режется truncate. -->
                  <span
                    class="min-w-0 truncate text-[11px] font-medium leading-none text-slate-800 dark:text-slate-100"
                    >{{ row.name }}</span
                  >
                  <!-- Бейджи событий: показываем лимит или все если раскрыто -->
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
                    <!-- Чип "+N" — показываем если игрок свёрнут и есть скрытые бейджи -->
                    <span
                      v-if="
                        row.badges.length > MAX_VISIBLE_BADGES &&
                        !expandedPlayerIds.has(row.playerId)
                      "
                      class="inline-flex items-center rounded-md px-1 py-0.5 text-[10px] font-semibold leading-none bg-slate-200/80 text-slate-600 dark:bg-slate-700/80 dark:text-slate-400 transition-opacity"
                      >+{{ row.badges.length - MAX_VISIBLE_BADGES }}</span
                    >
                  </div>
                </div>
              </div>
              <!-- Правая колонка — гостевая команда, выровнена вправо -->
              <div class="flex flex-col gap-1">
                <div
                  v-for="row in livePlayerRows.filter((r) => r.side === 'away')"
                  :key="row.playerId"
                  class="flex min-w-0 items-center justify-end gap-1"
                  :class="
                    row.badges.length > MAX_VISIBLE_BADGES &&
                    'cursor-pointer select-none'
                  "
                  @click="
                    row.badges.length > MAX_VISIBLE_BADGES &&
                    togglePlayerExpand(row.playerId)
                  "
                >
                  <!-- Бейджи событий идут перед именем (зеркально левой колонке) -->
                  <div class="flex shrink-0 items-center gap-0.5">
                    <!-- Чип "+N" (зеркально — слева от бейджей) если игрок свёрнут -->
                    <span
                      v-if="
                        row.badges.length > MAX_VISIBLE_BADGES &&
                        !expandedPlayerIds.has(row.playerId)
                      "
                      class="inline-flex items-center rounded-md px-1 py-0.5 text-[10px] font-semibold leading-none bg-slate-200/80 text-slate-600 dark:bg-slate-700/80 dark:text-slate-400 transition-opacity"
                      >+{{ row.badges.length - MAX_VISIBLE_BADGES }}</span
                    >
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
                  <!-- Имя — нейтральный slate, без оттенка команды; длинное имя режется truncate. -->
                  <span
                    class="min-w-0 truncate text-[11px] font-medium leading-none text-slate-800 dark:text-slate-100"
                    >{{ row.name }}</span
                  >
                  <!-- Аватар у правого края гостевой колонки — зеркально домашней -->
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

    <!-- main: если шапка в два ряда — больше pt на мобилке; одна строка — как h-14. -->
    <main
      class="mx-auto flex w-full min-w-0 max-w-4xl flex-1 flex-col px-0 transition-[padding] duration-300 print:max-w-none print:px-4 sm:px-6 print:!pt-6"
      :class="mainTopPaddingClass"
    >
      <div class="flex flex-1 flex-col py-5 sm:py-8">
        <!-- Заглушка «турнир не начался» — сверху, как обычный контент -->
        <div
          v-if="!hasViewerData"
          class="flex flex-col items-center justify-center"
        >
          <div
            class="flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700/60 px-6 py-10 text-center"
          >
            <!-- Иконка футбольного мяча -->
            <span class="text-5xl" aria-hidden="true">⚽</span>

            <div class="flex flex-col gap-2">
              <p
                class="text-base font-semibold text-slate-700 dark:text-slate-300"
              >
                Турнир ещё не начался
              </p>
              <p
                class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
              >
                После старта обновите страницу — кнопка в шапке.
              </p>
            </div>

            <!-- Ссылка на архив — пока турнир не стартовал, зритель может уйти к прошлым. -->
            <NuxtLink
              to="/tournaments"
              class="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 transition-all hover:border-emerald-400/60 dark:hover:border-emerald-500/40 hover:text-emerald-700 dark:hover:text-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            >
              <span aria-hidden="true">🏆</span>
              Прошлые турниры
            </NuxtLink>
          </div>
        </div>

        <!-- Итоги турнира — показываются когда турнир завершён -->
        <div
          v-else-if="matchStatus === 'finished' && tournamentSummary"
          class="flex flex-col gap-3"
        >
          <!-- Обёртка даёт чуть более тёмный фон в светлой теме для контраста со страницей -->
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

        <!-- Таблица зрителя — показывается во время турнира.
             Пропы clearTournament* обязательны в StepStandings, в readonly-режиме не используются — передаём заглушки. -->
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

    <!-- Модальное окно входа администратора -->
    <OrganismsAdminLoginModal
      v-if="showLoginModal"
      @close="showLoginModal = false"
    />

    <!-- Модальное окно пожеланий — доступно любому зрителю. -->
    <MoleculesFeedbackModal />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, watch } from "vue";
import type { Player } from "~/types/tournament";
import type { SavedTournamentContext } from "~/composables/useTournamentWizard";
import type { SavedStandingsSnapshot } from "~/composables/useTournamentWizard";
import { useAdminAuth } from "~/composables/useAdminAuth";
import { useTeamColors } from "~/composables/useTeamColors";
import { displayPlayerLabelWithoutRating } from "~/composables/usePlayerDisplay";
import { useTournamentSummary } from "~/composables/useTournamentSummary";
import {
  dedupeTeamNamesPreservingOrder,
  normalizeTeamColorsMap,
  normalizeTeamName,
  resolveTeamColorIndex,
} from "~/utils/teamNames";
import { scrollExpandedPanelIntoView } from "~/utils/scrollExpandedPanelIntoView";

const props = defineProps<{
  state: SavedTournamentContext | null;
  players: Player[];
  onRefresh: () => void | Promise<void>;
}>();

const showLoginModal = ref(false);
const { restoreSession } = useAdminAuth();

// Шапка: перенос кнопок на вторую строку только если правая граница левого блока заходит на кнопки.
const headerRootRef = ref<HTMLElement | null>(null);
const headerLeftRef = ref<HTMLElement | null>(null);
const headerActionsRef = ref<HTMLElement | null>(null);
const headerActionsWrap = ref(false);

function syncHeaderWrap() {
  const root = headerRootRef.value;
  const left = headerLeftRef.value;
  const actions = headerActionsRef.value;
  if (!root || !left || !actions) return;
  headerActionsWrap.value = false;
  nextTick(() => {
    requestAnimationFrame(() => {
      const lr = left.getBoundingClientRect();
      const ar = actions.getBoundingClientRect();
      headerActionsWrap.value = lr.right > ar.left - 2;
    });
  });
}

let headerResizeObserver: ResizeObserver | null = null;

onMounted(() => {
  syncHeaderWrap();
  headerResizeObserver = new ResizeObserver(() => syncHeaderWrap());
  if (headerRootRef.value) headerResizeObserver.observe(headerRootRef.value);
});

onUnmounted(() => {
  headerResizeObserver?.disconnect();
  headerResizeObserver = null;
});

watch(
  () => [props.state?.tournamentName, props.state?.matchStatus],
  () => nextTick(() => syncHeaderWrap()),
);

watch(
  () => [props.state?.liveHomeTeam, props.state?.liveAwayTeam],
  () => nextTick(() => syncHeaderWrap()),
);

function onAdminEnter() {
  // Если сессия уже есть — входим сразу, без пароля.
  if (restoreSession()) return;
  showLoginModal.value = true;
}

// Крутим иконку пока идёт запрос — даём зрителю визуальный отклик.
const isRefreshing = ref(false);

async function handleRefresh() {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  try {
    await props.onRefresh();
  } finally {
    // Минимум 600мс анимации — иначе иконка мигает и не успевает прокрутиться.
    await new Promise((r) => setTimeout(r, 600));
    isRefreshing.value = false;
  }
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

// Список сыгранных матчей для блока «Результаты» на экране итогов зрителя.
const finishedPlayedMatches = computed(
  () => initialSnapshot.value?.playedMatchesList ?? [],
);

// Статус матча — upcoming / live / finished. По умолчанию upcoming если данных нет.
const matchStatus = computed(() => props.state?.matchStatus ?? "upcoming");

// Итоги турнира — вычисляем только когда есть снапшот с завершёнными матчами.
// Используется для раздела «Итоги» при статусе finished.
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
// Команды текущего live-матча — отображаем в шапке когда статус Live.
const liveHomeTeam = computed(() => props.state?.liveHomeTeam ?? "");
const liveAwayTeam = computed(() => props.state?.liveAwayTeam ?? "");

// Маркеры цветов для команд live-матча — берём из teamColors через индекс.
const { getMarkerByIndex, getMatchScorePillClass } = useTeamColors();
const liveHomeMarker = computed(() => {
  const idx = resolveTeamColorIndex(liveHomeTeam.value, teamColors.value, 0);
  return getMarkerByIndex(idx);
});
const liveAwayMarker = computed(() => {
  const idx = resolveTeamColorIndex(liveAwayTeam.value, teamColors.value, 1);
  return getMarkerByIndex(idx);
});

// Счёт текущего матча — сумма голов каждого игрока из текущей статистики снапшота.
const liveHomeScore = computed(() => {
  const stats = initialSnapshot.value?.currentHomeStats ?? {};
  // Складываем голы всех домашних игроков.
  return Object.values(stats).reduce((sum, s) => sum + (s.goals ?? 0), 0);
});
const liveAwayScore = computed(() => {
  const stats = initialSnapshot.value?.currentAwayStats ?? {};
  // Складываем голы всех гостевых игроков.
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

// Максимум бейджей на одного игрока в компактной строке — остальные схлопываются в "+N".
// 2 штуки хватает чтобы влезли самые важные (голы + пасы), не перегружая строку.
const MAX_VISIBLE_BADGES = 2;

// Множество id игроков у которых сейчас раскрыты все бейджи.
// По клику добавляем/удаляем id — работает как toggle.
const expandedPlayerIds = ref<Set<number>>(new Set());

// Переключаем раскрытое состояние игрока по его id.
function togglePlayerExpand(playerId: number) {
  const next = new Set(expandedPlayerIds.value);
  if (next.has(playerId)) {
    next.delete(playerId);
  } else {
    next.add(playerId);
  }
  expandedPlayerIds.value = next;
}

// Сколько бейджей показывать для конкретного игрока — все если раскрыт, иначе лимит.
function visibleBadgeCount(playerId: number, totalBadges: number): number {
  return expandedPlayerIds.value.has(playerId)
    ? totalBadges
    : Math.min(MAX_VISIBLE_BADGES, totalBadges);
}

// Конфигурация бейджей событий — те же цвета и иконки что в менеджере матча.
// В светлой теме цифры — тёмные (читаемо на бледном фоне); в тёмной — светлые как раньше.
const LIVE_STAT_BADGES = [
  {
    key: "goals",
    icon: "⚽",
    bgClass: "bg-emerald-500/15",
    textClass: "text-emerald-900 dark:text-emerald-300",
  },
  {
    key: "assists",
    icon: "🎯",
    bgClass: "bg-sky-500/15",
    textClass: "text-sky-900 dark:text-sky-300",
  },
  {
    key: "saves",
    icon: "🧤",
    bgClass: "bg-violet-500/15",
    textClass: "text-violet-900 dark:text-violet-300",
  },
  {
    key: "yellows",
    icon: "🟨",
    bgClass: "bg-amber-500/15",
    textClass: "text-amber-950 dark:text-yellow-300",
  },
] as const;

type LiveBadge = {
  key: string;
  icon: string;
  count: number;
  bgClass: string;
  textClass: string;
};
// Строки статистики игроков текущего матча — только игроки с хотя бы одним событием.
// photo / avatarFallbackName — для AtomsPlayerAvatar (файл в public/player-photos/ или инициалы).
type LivePlayerRow = {
  playerId: number;
  name: string;
  badges: LiveBadge[];
  side: "home" | "away";
  photo: string | null;
  avatarFallbackName: string;
};

function buildPlayerRow(
  idStr: string,
  stats: { goals: number; assists: number; saves: number; yellows: number },
  side: "home" | "away",
): LivePlayerRow | null {
  // Считаем сумму всех событий — пропускаем игроков без отметок.
  const total =
    (stats.goals ?? 0) +
    (stats.assists ?? 0) +
    (stats.saves ?? 0) +
    (stats.yellows ?? 0);
  if (total === 0) return null;
  const playerId = Number(idStr);
  const player = props.players.find((p) => p.id === playerId);
  // Собираем только бейджи с ненулевым значением.
  const badges = LIVE_STAT_BADGES.filter(
    (b) => (stats[b.key as keyof typeof stats] ?? 0) > 0,
  ).map((b) => ({
    key: b.key,
    icon: b.icon,
    count: stats[b.key as keyof typeof stats] ?? 0,
    bgClass: b.bgClass,
    textClass: b.textClass,
  }));
  // Имя для инициалов в аватаре — сырое из карточки игрока, без подписи рейтинга.
  const avatarFallbackName = (player?.name ?? "").trim() || `#${playerId}`;
  return {
    playerId,
    name: player ? displayPlayerLabelWithoutRating(player) : `#${playerId}`,
    badges,
    side,
    photo: player?.photo ?? null,
    avatarFallbackName,
  };
}

const livePlayerRows = computed<LivePlayerRow[]>(() => {
  const snap = initialSnapshot.value;
  if (!snap) return [];
  const rows: LivePlayerRow[] = [];
  // Домашняя половина — только игроки с событиями в currentHomeStats.
  for (const [idStr, stats] of Object.entries(snap.currentHomeStats ?? {})) {
    const row = buildPlayerRow(idStr, stats, "home");
    if (row) rows.push(row);
  }
  // Гостевая половина — только игроки с событиями в currentAwayStats.
  for (const [idStr, stats] of Object.entries(snap.currentAwayStats ?? {})) {
    const row = buildPlayerRow(idStr, stats, "away");
    if (row) rows.push(row);
  }
  return rows;
});

// Отступ main под высоту шапки: вторая строка кнопок — только если headerActionsWrap (строки целиком для JIT).
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
