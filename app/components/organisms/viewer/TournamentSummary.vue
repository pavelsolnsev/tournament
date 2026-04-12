<template>
  <!-- print: чёрный текст на белом — чтобы PDF не зависел от тёмной темы. -->
  <section class="flex flex-col print:bg-white print:text-black">

    <!-- ─── ШАПКА: дата, место, формат ──────────────────────────── -->
    <div v-if="props.tournamentDate || props.venueLabel || props.formatLabel" class="px-4 pt-5 pb-4 sm:px-6">
      <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
        <!-- Дата -->
        <span v-if="props.tournamentDate" class="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-500">
          <span aria-hidden="true">📅</span>{{ formattedDate }}
        </span>
        <!-- Разделитель -->
        <span v-if="props.tournamentDate && (props.venueLabel || props.formatLabel)" class="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
        <!-- Место -->
        <span v-if="props.venueLabel" class="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-500">
          <span aria-hidden="true">🏟️</span>{{ props.venueLabel }}
        </span>
        <!-- Разделитель -->
        <span v-if="props.venueLabel && props.formatLabel" class="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
        <!-- Формат -->
        <span v-if="props.formatLabel" class="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-500">
          <span aria-hidden="true">⚽</span>{{ props.formatLabel }}
        </span>
      </div>
    </div>

    <div v-if="props.tournamentDate || props.venueLabel || props.formatLabel" class="mx-4 border-t border-slate-200 dark:border-slate-700/50 sm:mx-6" />

    <!-- Цифры, чемпион, якорная навигация и печать — компактный вводный блок. -->
    <MoleculesViewerTournamentSummaryIntroBar
      v-if="showIntroBar"
      :stats="props.summary.stats"
      :champion="championStandingsRow"
      :champion-marker="championTeamMarker"
      :nav-items="summaryNavItems"
    />

    <div
      v-if="showIntroBar && props.summary.standingsRows.length > 0"
      class="mx-4 border-t border-slate-200 dark:border-slate-700/50 sm:mx-6"
    />

    <!-- ─── 1. ИТОГОВАЯ ТАБЛИЦА ───────────────────────────────── -->
    <div
      v-if="props.summary.standingsRows.length > 0"
      id="summary-standings"
      class="scroll-mt-24 px-4 pt-5 pb-4 sm:px-6"
    >
      <p class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">📊 Итоговая таблица</p>
      <OrganismsStandingsTable
        :teams="props.summary.standingsRows.map(r => r.teamName)"
        :rows="props.summary.standingsRows"
        :team-colors="effectiveTeamColors"
      />
    </div>

    <div class="mx-4 border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />

    <!-- ─── 2. MVP ТУРНИРА ─────────────────────────────────────── -->
    <div
      v-if="props.summary.mvp.length > 0"
      id="summary-mvp"
      class="scroll-mt-24 px-4 pt-5 pb-5 sm:px-6"
    >
      <p class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">⭐ MVP турнира</p>

      <div
        v-for="player in props.summary.mvp"
        :key="player.playerId"
        class="relative overflow-hidden rounded-2xl border border-amber-300/50 bg-slate-50 p-4
               dark:border-amber-500/25 dark:bg-slate-800/70"
      >
        <div class="pointer-events-none absolute -left-4 -top-4 h-32 w-32 rounded-full bg-amber-300/10 blur-3xl" aria-hidden="true" />

        <div class="relative flex items-center gap-3">
          <div class="relative shrink-0 h-9 w-9">
            <AtomsPlayerAvatar
              :photo="player.photo"
              :fallback-name="player.name"
              size="md"
              class="ring-2 ring-amber-400/50"
            />
            <span
              class="absolute -bottom-1 -right-1 flex h-[16px] w-[16px] items-center justify-center rounded-full bg-white dark:bg-slate-900 text-[9px] ring-1 ring-amber-500/40 leading-none"
              aria-hidden="true"
            >🏆</span>
          </div>

          <div class="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
            <div class="flex min-w-0 items-center gap-1.5">
              <p class="min-w-0 truncate text-[14px] font-bold leading-tight text-slate-800 dark:text-amber-200">{{ player.name }}</p>
              <div
                v-if="player.tournamentStats && mvpMarksTotal(player.tournamentStats) > 0"
                class="flex shrink-0 flex-wrap items-center gap-1"
              >
                <span v-if="player.tournamentStats.goals > 0" class="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-900 dark:text-emerald-300">⚽ {{ player.tournamentStats.goals }}</span>
                <span v-if="player.tournamentStats.assists > 0" class="inline-flex items-center gap-0.5 rounded bg-sky-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-sky-900 dark:text-sky-300">🎯 {{ player.tournamentStats.assists }}</span>
                <span v-if="player.tournamentStats.saves > 0" class="inline-flex items-center gap-0.5 rounded bg-violet-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-violet-900 dark:text-violet-300">🧤 {{ player.tournamentStats.saves }}</span>
                <span v-if="player.tournamentStats.yellows > 0" class="inline-flex items-center gap-0.5 rounded bg-yellow-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-yellow-900 dark:text-yellow-300">🟨 {{ player.tournamentStats.yellows }}</span>
              </div>
            </div>
            <p class="flex items-center gap-1 text-[11px] leading-none text-slate-600 dark:text-slate-400">
              <AtomsTeamMarkerOrLogo
                :team-name="player.teamName"
                :marker="player.teamMarker"
                size="xs"
              />
              <span class="truncate">{{ player.teamName }}</span>
            </p>
          </div>

          <span class="shrink-0 self-center rounded-md bg-amber-400/15 px-2 py-1 text-[11px] font-bold tracking-wider text-amber-800 ring-1 ring-amber-300/40 dark:text-amber-300 dark:ring-amber-500/25">
            MVP
          </span>
        </div>
      </div>
    </div>

    <div class="mx-4 border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />

    <!-- ─── 3. ИНДИВИДУАЛЬНЫЕ НАГРАДЫ ─────────────────────────── -->
    <div
      v-if="hasAnyStats"
      id="summary-awards"
      class="scroll-mt-24 px-4 pt-5 pb-5 sm:px-6"
    >
      <p class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">🎖️ Индивидуальные награды</p>

      <div class="flex flex-col gap-2 sm:grid sm:grid-cols-3">
        <AtomsAwardCard
          v-if="props.summary.topScorers.length > 0"
          icon="⚽"
          label="Бомбардир"
          :value-label="pluralGoals(props.summary.topScorers[0]!.value)"
          color="emerald"
          :winners="props.summary.topScorers"
        />
        <EmptyAward v-else icon="⚽" text="Голов не забито" />

        <AtomsAwardCard
          v-if="props.summary.topAssisters.length > 0"
          icon="🎯"
          label="Ассистент"
          :value-label="pluralAssists(props.summary.topAssisters[0]!.value)"
          color="sky"
          :winners="props.summary.topAssisters"
        />
        <EmptyAward v-else icon="🎯" text="Передач не было" />

        <AtomsAwardCard
          v-if="props.summary.topGoalkeepers.length > 0"
          icon="🧤"
          label="Вратарь"
          :value-label="pluralSaves(props.summary.topGoalkeepers[0]!.value)"
          color="violet"
          :winners="props.summary.topGoalkeepers"
        />
        <EmptyAward v-else icon="🧤" text="Сейвов не было" />
      </div>
    </div>

    <!-- ─── 4. ЖЁЛТЫЕ КАРТОЧКИ ──────────────────────────────── -->
    <div
      v-if="props.summary.yellowCards.length > 0"
      id="summary-yellows"
      class="scroll-mt-24 px-4 pb-5 sm:px-6"
    >
      <p class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">🟨 Жёлтые карточки</p>

      <div class="flex flex-col gap-1.5">
        <div
          v-for="player in props.summary.yellowCards"
          :key="player.playerId"
          class="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5
                 dark:border-yellow-500/15 dark:bg-yellow-500/5"
        >
          <AtomsPlayerAvatar
            :photo="player.photo"
            :fallback-name="player.name"
            size="sm"
            class="shrink-0"
          />

          <div class="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
            <p class="truncate text-[13px] font-semibold leading-tight text-slate-800 dark:text-slate-200">{{ player.name }}</p>
            <p class="flex items-center gap-1 text-[11px] leading-none text-slate-600 dark:text-slate-500">
              <AtomsTeamMarkerOrLogo
                :team-name="player.teamName"
                :marker="player.teamMarker"
                size="xs"
              />
              <span class="truncate">{{ player.teamName }}</span>
            </p>
          </div>

          <div class="shrink-0 flex items-center gap-1">
            <span
              v-for="n in player.count"
              :key="n"
              class="inline-block h-4 w-3 rounded-sm bg-yellow-400 ring-1 ring-yellow-500/50"
              aria-hidden="true"
            />
            <span class="ml-1 text-[12px] font-bold tabular-nums text-amber-800 dark:text-yellow-300">{{ player.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="mx-4 border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />

    <!-- ─── 5. СОСТАВЫ (аккордеон) ──────────────────────────── -->
    <template v-if="hasRosterData">
      <div id="summary-rosters" class="scroll-mt-24 px-4 pt-5 pb-5 sm:px-6">
        <div
          class="overflow-hidden rounded-2xl border bg-slate-50/90 dark:bg-slate-900/60 transition-colors"
          :class="isRosterOpen ? 'border-slate-300 dark:border-slate-700/60' : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/50'"
        >
          <button
            :id="rosterToggleId"
            type="button"
            class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            :class="isRosterOpen ? 'bg-slate-50/80 dark:bg-slate-800/80' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'"
            :aria-expanded="isRosterOpen"
            :aria-controls="rosterPanelId"
            @click="isRosterOpen = !isRosterOpen"
          >
            <span class="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <span class="truncate">👥 Составы</span>
              <span
                class="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                :class="isRosterOpen ? 'bg-emerald-400/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'"
              >
                {{ isRosterOpen ? 'Открыт' : 'Скрыт' }}
              </span>
            </span>
            <svg
              class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200"
              :class="isRosterOpen && 'rotate-180'"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <Transition
            enter-active-class="transition-all duration-200 ease-out overflow-hidden"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-[120rem] opacity-100"
            leave-active-class="transition-all duration-150 ease-in overflow-hidden"
            leave-from-class="max-h-[120rem] opacity-100"
            leave-to-class="max-h-0 opacity-0"
            @after-enter="scrollExpandedPanelIntoView"
          >
            <div
              v-if="isRosterOpen"
              :id="rosterPanelId"
              role="region"
              :aria-labelledby="rosterToggleId"
              class="border-t border-slate-200 px-3 pb-4 pt-3 dark:border-slate-700/60"
            >
              <OrganismsTournamentStepStandingsTeamRosterTotals
                :teams="rosterTeams"
                :players-by-team="rosterPlayersByTeam"
                :team-marker="teamMarkerForRow"
                :display-player-label="displayPlayerLabelWithoutRating"
                :aggregate-player-stats="props.aggregatePlayerStats ?? {}"
                :player-rating-deltas="props.playerRatingDeltas ?? {}"
                :hide-base-player-rating="hideBasePlayerRating"
                :show-heading="false"
              />
            </div>
          </Transition>
        </div>
      </div>
      <div class="mx-4 border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />
    </template>

    <!-- ─── 6. MVP КОМАНД ─────────────────────────────────────── -->
    <div
      v-if="props.summary.teamMvps.length > 0"
      id="summary-team-mvps"
      class="scroll-mt-24 px-4 pt-5 pb-5 sm:px-6"
    >
      <p class="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">👑 MVP команд</p>

      <div class="flex flex-col gap-2 sm:grid sm:grid-cols-2">
        <div
          v-for="teamMvp in props.summary.teamMvps"
          :key="teamMvp.teamName"
          class="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700/60 dark:bg-slate-800/50"
        >
          <div class="relative shrink-0">
            <AtomsPlayerAvatar
              :photo="teamMvp.players[0]?.photo"
              :fallback-name="teamMvp.players[0]?.name ?? teamMvp.teamName"
              size="md"
            />
            <div
              class="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-slate-300 dark:bg-slate-900 dark:ring-slate-700/60"
              aria-hidden="true"
            >
              <AtomsTeamMarkerOrLogo
                :team-name="teamMvp.teamName"
                :marker="teamMvp.teamMarker"
                size="xs"
              />
            </div>
          </div>

          <div class="min-w-0 flex-1">
            <p class="text-[10px] font-semibold uppercase tracking-widest text-slate-600 leading-none dark:text-slate-400">{{ teamMvp.teamName }}</p>
            <p v-if="teamMvp.players.length > 0" class="mt-1 truncate text-[13px] font-semibold text-slate-800 leading-tight dark:text-slate-100">
              {{ teamMvp.players[0]!.name }}
            </p>
            <p v-else class="mt-1 text-[13px] text-slate-600 dark:text-slate-500">—</p>
          </div>

          <div v-if="teamMvp.players.length > 0" class="flex shrink-0 items-center gap-1">
            <span v-if="teamMvp.goals > 0" class="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-900 dark:text-emerald-300">⚽ {{ teamMvp.goals }}</span>
            <span v-if="teamMvp.assists > 0" class="inline-flex items-center gap-0.5 rounded bg-sky-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-sky-900 dark:text-sky-300">🎯 {{ teamMvp.assists }}</span>
            <span v-if="teamMvp.saves > 0" class="inline-flex items-center gap-0.5 rounded bg-violet-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-violet-900 dark:text-violet-300">🧤 {{ teamMvp.saves }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="mx-4 border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />

    <!-- ─── 7. РЕЗУЛЬТАТЫ МАТЧЕЙ (как на шаге турнира, только чтение) ─ -->
    <div
      v-if="hasPlayedMatches"
      id="summary-results"
      class="scroll-mt-24 px-4 pt-5 pb-5 sm:px-6"
    >
      <div
        class="overflow-hidden rounded-2xl border bg-slate-50/90 dark:bg-slate-900/60 transition-colors"
        :class="isResultsOpen ? 'border-slate-300 dark:border-slate-700/60' : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/50'"
      >
        <button
          :id="resultsToggleId"
          type="button"
          class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          :class="isResultsOpen ? 'bg-slate-50/80 dark:bg-slate-800/80' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'"
          :aria-expanded="isResultsOpen"
          :aria-controls="resultsPanelId"
          @click="isResultsOpen = !isResultsOpen"
        >
          <span class="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <span class="truncate">Результаты</span>
            <span
              class="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              :class="isResultsOpen ? 'bg-emerald-400/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'"
            >
              {{ isResultsOpen ? 'Открыт' : 'Скрыт' }}
            </span>
          </span>
          <div class="flex shrink-0 items-center gap-2">
            <span
              class="rounded-full bg-slate-100/90 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            >
              {{ playedMatchesForResults.length }}
            </span>
            <svg
              class="h-5 w-5 text-slate-400 transition-transform duration-200"
              :class="isResultsOpen && 'rotate-180'"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        </button>

        <Transition
          enter-active-class="transition-all duration-200 ease-out overflow-hidden"
          enter-from-class="max-h-0 opacity-0"
          enter-to-class="max-h-[120rem] opacity-100"
          leave-active-class="transition-all duration-150 ease-in overflow-hidden"
          leave-from-class="max-h-[120rem] opacity-100"
          leave-to-class="max-h-0 opacity-0"
          @after-enter="scrollExpandedPanelIntoView"
        >
          <div
            v-if="isResultsOpen"
            :id="resultsPanelId"
            role="region"
            :aria-labelledby="resultsToggleId"
            class="border-t border-slate-200 px-3 pb-3 pt-1 dark:border-slate-700/60"
          >
            <OrganismsTournamentStepStandingsPlayedMatches
              :played-matches-list="playedMatchesForResults"
              :team-marker="teamMarkerForRow"
              :team-color-by-name="effectiveTeamColors"
              :players-by-team="rosterPlayersByTeam"
              :display-player-label="displayPlayerLabelWithoutRating"
              :player-avatars-by-id="playerAvatarsById"
              :update-played-match="noopUpdatePlayedMatch"
              :delete-played-match="noopDeletePlayedMatch"
              :show-heading="false"
              :readonly="true"
            />
          </div>
        </Transition>
      </div>
    </div>

    <div v-if="hasPlayedMatches" class="mx-4 border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />

    <!-- ─── 8. ТОП-МАТЧ (макс. голов; карточка как «Результаты») ─ -->
    <div
      v-if="props.summary.stats.topScoringMatch"
      id="summary-top-match"
      class="scroll-mt-24 px-4 pt-5 pb-5 sm:px-6"
    >
      <div
        class="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/90 transition-colors dark:border-slate-600/50 dark:bg-transparent"
      >
        <!-- Шапка без отдельного тёмного слоя — фон как у карточки (в тёмной теме тоже прозрачно к странице). -->
        <div class="flex w-full items-center justify-between gap-3 bg-slate-50/80 px-4 py-3.5 dark:bg-transparent">
          <span class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <span class="truncate">🔥 Топ-матч</span>
            <span class="flex shrink-0 flex-wrap items-center gap-1">
              <span
                v-if="topScoringMatchTotals.goals > 0"
                class="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-900 dark:text-emerald-300"
              >⚽ {{ topScoringMatchTotals.goals }}</span>
              <span
                v-if="topScoringMatchTotals.assists > 0"
                class="inline-flex items-center gap-0.5 rounded bg-sky-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-sky-900 dark:text-sky-300"
              >🎯 {{ topScoringMatchTotals.assists }}</span>
              <span
                v-if="topScoringMatchTotals.saves > 0"
                class="inline-flex items-center gap-0.5 rounded bg-violet-500/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-violet-900 dark:text-violet-300"
              >🧤 {{ topScoringMatchTotals.saves }}</span>
            </span>
          </span>
          <span
            class="shrink-0 rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600 tabular-nums dark:bg-slate-800/70 dark:text-slate-400"
          >
            М{{ props.summary.stats.topScoringMatch.matchNumber }}
          </span>
        </div>

        <div class="border-t border-slate-200 bg-slate-50/80 px-3 pb-3 pt-1 dark:border-slate-700/50 dark:bg-transparent">
          <!-- Строка счёта и список игроков — без вложенной карточки с отдельным бордером. -->
          <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-1 py-3 sm:px-2">
            <div class="flex min-w-0 items-center gap-2">
              <AtomsTeamMarkerOrLogo
                :team-name="props.summary.stats.topScoringMatch.homeTeam"
                :marker="homeTeamMarker"
                size="md"
              />
              <span class="min-w-0 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{{ props.summary.stats.topScoringMatch.homeTeam }}</span>
            </div>
            <div class="flex shrink-0 flex-col items-center gap-0.5">
              <span
                class="rounded-md px-3 py-1 font-mono text-base font-bold tabular-nums ring-1"
                :class="topScoringMatchPillClass"
              >
                {{ props.summary.stats.topScoringMatch.homeGoals }}&nbsp;:&nbsp;{{ props.summary.stats.topScoringMatch.awayGoals }}
              </span>
            </div>
            <div class="flex min-w-0 items-center justify-end gap-2">
              <span class="min-w-0 truncate text-right text-sm font-semibold text-slate-700 dark:text-slate-200">{{ props.summary.stats.topScoringMatch.awayTeam }}</span>
              <AtomsTeamMarkerOrLogo
                :team-name="props.summary.stats.topScoringMatch.awayTeam"
                :marker="awayTeamMarker"
                size="md"
              />
            </div>
          </div>

          <!-- Как панель «Детали» в StepStandingsPlayedMatches: та же строка, кнопка h-9, нативный details. -->
          <details
            class="border-t border-slate-100 dark:border-slate-800/60"
            @toggle="onTopMatchDetailsToggle"
          >
            <summary
              class="flex cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 [&::-webkit-details-marker]:hidden"
            >
              <span
                class="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium transition-colors"
                :class="
                  topMatchDetailsOpen
                    ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                    : 'text-slate-600 md:hover:bg-slate-100 md:hover:text-slate-800 dark:md:hover:bg-slate-800 dark:md:hover:text-slate-300'
                "
              >
                <svg
                  class="h-3.5 w-3.5 shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clip-rule="evenodd"
                  />
                </svg>
                Детали
              </span>
            </summary>
            <OrganismsTournamentPlayedMatchesPlayedMatchDetails
              :match="props.summary.stats.topScoringMatch"
              :team-marker="teamMarkerForRow"
              :player-avatars-by-id="playerAvatarsById"
              embedded
              omit-top-border
            />
          </details>
        </div>
      </div>
    </div>

    <div class="mx-4 border-t border-slate-300 dark:border-slate-700/50 sm:mx-6" />

    <!-- ─── 9. ССЫЛКИ ────────────────────────────────────────── -->
    <div id="summary-links" class="scroll-mt-24 px-4 pt-4 pb-5 sm:px-6 print:break-inside-avoid">
      <p class="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">🔗 Полезные ссылки</p>
      <!-- Телефон: кнопки на всю ширину. Десктоп (sm+): чипы по тексту и перенос строки. -->
      <ul class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2">
        <li v-for="item in usefulLinks" :key="item.href" class="w-full min-w-0 sm:w-auto">
          <a
            :href="item.href"
            target="_blank"
            rel="noopener noreferrer"
            class="flex w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-white sm:inline-flex sm:w-auto sm:max-w-full sm:py-2 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/70"
          >
            <span class="shrink-0" aria-hidden="true">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </a>
        </li>
      </ul>
    </div>

  </section>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { TournamentSummary } from '~/composables/useTournamentSummary'
import type { PlayedMatch, PlayerMatchStats } from '~/composables/tournament-standings/types'
import { useTeamColors } from '~/composables/useTeamColors'
import { normalizeTeamColorsMap, normalizeTeamName, resolveTeamColorIndex } from '~/utils/teamNames'
import { displayPlayerLabelWithoutRating } from '~/composables/usePlayerDisplay'
import { scrollExpandedPanelIntoView } from '~/utils/scrollExpandedPanelIntoView'

// Ссылки внизу итогов — один массив, чтобы не копировать длинные классы на каждую строку.
const usefulLinks = [
  { href: 'https://football.pavelsolntsev.ru/', icon: '🌐', label: 'Рейтинг игроков' },
  { href: 'https://football.pavelsolntsev.ru/tournament/', icon: '🏆', label: 'Список команд' },
  { href: 'https://football.pavelsolntsev.ru/info', icon: 'ℹ️', label: 'Информация' },
  { href: 'https://vk.com/rmsfootball', icon: '📣', label: 'Группа ВКонтакте' },
] as const

// Сумма отметок MVP — если ноль, строку с плашками не показываем.
function mvpMarksTotal(s: PlayerMatchStats): number {
  return s.goals + s.assists + s.saves + s.yellows
}

// Вспомогательный компонент-заглушка — render-функция вместо template-строки,
// потому что runtime-компилятор недоступен в production-сборке Nuxt.
const EmptyAward = defineComponent({
  props: { icon: String, text: String },
  setup(props) {
    return () =>
      h(
        'div',
        { class: 'flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-3 dark:border-slate-700/40 dark:bg-slate-800/20' },
        [
          h('span', { class: 'text-base opacity-40 dark:opacity-30', 'aria-hidden': 'true' }, props.icon),
          h('span', { class: 'text-[12px] text-slate-600 dark:text-slate-500' }, props.text),
        ],
      )
  },
})

// Получаем итоги турнира снаружи — компонент только отображает данные.
const props = defineProps<{
  summary: TournamentSummary
  tournamentDate?: string
  /** Место проведения — отображается в шапке итогов. */
  venueLabel?: string
  /** Формат турнира — отображается в шапке итогов. */
  formatLabel?: string
  /** Цвета команд с мастера; если пусто — индекс берём из места в таблице. */
  teamColors?: Record<string, number>
  /** Игроки турнира — нужны для раздела «Составы». */
  players?: Player[]
  /** Назначение игроков по командам. */
  assignmentByPlayerId?: Record<number, string>
  /** Суммарная статистика игроков за весь турнир. */
  aggregatePlayerStats?: Record<number, PlayerMatchStats>
  /** Дельты рейтинга игроков за турнир. */
  playerRatingDeltas?: Record<number, number>
  /** Сыгранные матчи — тот же список, что в шаге «Результаты» у админа. */
  playedMatchesList?: PlayedMatch[]
}>()

const { teamMarkers, getMarkerByIndex, getMatchScorePillClass } = useTeamColors()

// Список матчей для блока «Результаты»; пустой массив если проп не передали.
const playedMatchesForResults = computed(() => props.playedMatchesList ?? [])
const hasPlayedMatches = computed(() => playedMatchesForResults.value.length > 0)

// Итоги зрителя: если в списке уже есть матчи — базовый рейтинг в составах не показываем (остаётся дельта).
const hideBasePlayerRating = computed(() => playedMatchesForResults.value.length > 0)

// Карта цветов с добивкой по командам из таблицы и из матчей — как в турнирной таблице.
const effectiveTeamColors = computed(() => {
  const map = normalizeTeamColorsMap(props.teamColors)
  const ordered: string[] = []
  const seen = new Set<string>()
  for (const r of props.summary.standingsRows) {
    const nk = normalizeTeamName(r.teamName)
    if (!nk || seen.has(nk)) continue
    seen.add(nk)
    ordered.push(nk)
  }
  for (const m of playedMatchesForResults.value) {
    for (const raw of [m.homeTeam, m.awayTeam]) {
      const nk = normalizeTeamName(raw)
      if (!nk || seen.has(nk)) continue
      seen.add(nk)
      ordered.push(nk)
    }
  }
  let next = 0
  for (const nk of ordered) {
    if (map[nk] !== undefined) continue
    map[nk] = next % teamMarkers.length
    next += 1
  }
  return map
})

// Аватары для деталей матча в списке результатов.
const playerAvatarsById = computed(() => {
  const out: Record<number, { photo: string | null; name: string }> = {}
  for (const p of props.players ?? []) {
    out[p.id] = { photo: p.photo ?? null, name: p.name }
  }
  return out
})

// В режиме только чтения кнопок правки нет — заглушки удовлетворяют тип пропсов.
function noopUpdatePlayedMatch(
  _matchNumber: number,
  _homeGoals: number,
  _awayGoals: number,
  _homeStats: Record<number, PlayerMatchStats>,
  _awayStats: Record<number, PlayerMatchStats>,
) {}

function noopDeletePlayedMatch(_matchNumber: number) {}

const rosterSectionUid = useId?.() ?? Math.random().toString(36).slice(2)
const rosterToggleId = `viewer-summary-roster-${rosterSectionUid}`
const rosterPanelId = `viewer-summary-roster-panel-${rosterSectionUid}`
const isRosterOpen = ref(false)

const resultsSectionUid = useId?.() ?? Math.random().toString(36).slice(2)
const resultsToggleId = `viewer-summary-results-${resultsSectionUid}`
const resultsPanelId = `viewer-summary-results-panel-${resultsSectionUid}`
const isResultsOpen = ref(false)

// «Детали» топ-матча — те же визуальные состояния, что кнопка в списке сыгранных матчей.
const topMatchDetailsOpen = ref(false)

function onTopMatchDetailsToggle(ev: Event) {
  const el = ev.target
  if (el instanceof HTMLDetailsElement) topMatchDetailsOpen.value = el.open
}

watch(
  () => props.summary.stats.topScoringMatch?.matchNumber,
  () => {
    topMatchDetailsOpen.value = false
  },
)

// Плашка лучшего матча — тот же резолвер цвета, что и у таблицы/итогов.
function scorePillColorIndexForTeam(teamName: string): number {
  const idx = props.summary.standingsRows.findIndex((r) => normalizeTeamName(r.teamName) === normalizeTeamName(teamName))
  return resolveTeamColorIndex(teamName, effectiveTeamColors.value, idx >= 0 ? idx : 0)
}

// Плашка «самый результативный матч»: ничья — нейтрально, иначе — цвет победителя.
const topScoringMatchPillClass = computed(() => {
  const m = props.summary.stats.topScoringMatch
  if (!m) return 'bg-slate-100 text-slate-800 ring-slate-300/90 dark:bg-slate-800/90 dark:text-slate-400 dark:ring-slate-600/40'
  return getMatchScorePillClass(
    m.homeGoals,
    m.awayGoals,
    m.homeTeam,
    m.awayTeam,
    scorePillColorIndexForTeam,
  )
})

// Голы в шапке — из счёта матча; пасы и сейвы — сумма по игрокам в записи топ-матча.
const topScoringMatchTotals = computed(() => {
  const m = props.summary.stats.topScoringMatch
  if (!m) return { goals: 0, assists: 0, saves: 0 }
  let assists = 0
  let saves = 0
  for (const st of Object.values(m.homeStats)) {
    assists += st.assists ?? 0
    saves += st.saves ?? 0
  }
  for (const st of Object.values(m.awayStats)) {
    assists += st.assists ?? 0
    saves += st.saves ?? 0
  }
  return {
    goals: m.homeGoals + m.awayGoals,
    assists,
    saves,
  }
})

// Форматируем дату из ISO-строки "YYYY-MM-DD" в читаемый вид "2 апреля 2026".
// Если дата не передана — computed вернёт пустую строку.
const formattedDate = computed(() => {
  if (!props.tournamentDate) return ''
  const d = new Date(props.tournamentDate)
  if (isNaN(d.getTime())) return props.tournamentDate
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
})

// Маркер у составов — каноническое сопоставление имени команды с цветом.
function teamMarkerForRow(teamName: string): string {
  const idx = props.summary.standingsRows.findIndex((r) => normalizeTeamName(r.teamName) === normalizeTeamName(teamName))
  const colorIdx = resolveTeamColorIndex(teamName, effectiveTeamColors.value, idx >= 0 ? idx : 0)
  return getMarkerByIndex(colorIdx)
}

// Маркеры команд для блока «лучший матч».
const homeTeamMarker = computed(() => teamMarkerForRow(props.summary.stats.topScoringMatch?.homeTeam ?? ''))
const awayTeamMarker = computed(() => teamMarkerForRow(props.summary.stats.topScoringMatch?.awayTeam ?? ''))

// Список команд в порядке таблицы — нужен для StepStandingsTeamRosterTotals.
const rosterTeams = computed(() => props.summary.standingsRows.map(r => r.teamName))

// Возвращает игроков команды из пропса players + assignmentByPlayerId.
function rosterPlayersByTeam(teamName: string): Player[] {
  if (!props.players || !props.assignmentByPlayerId) return []
  // Фильтруем всех игроков турнира по принадлежности к этой команде.
  return props.players.filter(p => props.assignmentByPlayerId![p.id] === teamName)
}

// Показываем раздел «Составы» только если переданы игроки.
const hasRosterData = computed(() => (props.players?.length ?? 0) > 0)

// Вводный блок: есть сыгранные матчи — тогда цифры и навигация имеют смысл.
const showIntroBar = computed(() => props.summary.stats.totalMatches > 0)

// Чемпион — первая строка таблицы по месту (итог уже отсортирован на сервере, но сортируем на всякий случай).
const championStandingsRow = computed(() => {
  const rows = props.summary.standingsRows
  if (!rows.length) return null
  return [...rows].sort((a, b) => a.place - b.place)[0] ?? null
})

// Маркер цвета для карточки чемпиона — тот же резолвер, что у строк таблицы.
const championTeamMarker = computed(() => {
  const row = championStandingsRow.value
  if (!row) return ''
  return teamMarkerForRow(row.teamName)
})

// Блок «Индивидуальные награды» нужен только если хоть у кого-то есть статистика.
// Если все матчи прошли без голов/пасов/сейвов/карточек — этот блок скрываем.
const hasAnyStats = computed(() =>
  props.summary.topScorers.length > 0 ||
  props.summary.topAssisters.length > 0 ||
  props.summary.topGoalkeepers.length > 0 ||
  props.summary.yellowCards.length > 0,
)

// Якоря в навигации — пропускаем пустые разделы, чтобы ссылки не вели в никуда.
const summaryNavItems = computed(() => {
  const items: { href: string; label: string }[] = []
  if (props.summary.standingsRows.length > 0) items.push({ href: '#summary-standings', label: 'Таблица' })
  if (props.summary.mvp.length > 0) items.push({ href: '#summary-mvp', label: 'MVP' })
  if (hasAnyStats.value) items.push({ href: '#summary-awards', label: 'Награды' })
  if (props.summary.yellowCards.length > 0) items.push({ href: '#summary-yellows', label: 'Карточки' })
  if (hasRosterData.value) items.push({ href: '#summary-rosters', label: 'Составы' })
  if (props.summary.teamMvps.length > 0) items.push({ href: '#summary-team-mvps', label: 'MVP команд' })
  if (hasPlayedMatches.value) items.push({ href: '#summary-results', label: 'Матчи' })
  if (props.summary.stats.topScoringMatch) items.push({ href: '#summary-top-match', label: 'Топ-матч' })
  items.push({ href: '#summary-links', label: 'Ссылки' })
  return items
})

// Склонение: голы.
function pluralGoals(n: number): string {
  if (n === 1) return '1 гол'
  if (n >= 2 && n <= 4) return `${n} гола`
  return `${n} голов`
}

// Склонение: передачи.
function pluralAssists(n: number): string {
  if (n === 1) return '1 передача'
  if (n >= 2 && n <= 4) return `${n} передачи`
  return `${n} передач`
}

// Склонение: сейвы.
function pluralSaves(n: number): string {
  if (n === 1) return '1 сейв'
  if (n >= 2 && n <= 4) return `${n} сейва`
  return `${n} сейвов`
}
</script>
