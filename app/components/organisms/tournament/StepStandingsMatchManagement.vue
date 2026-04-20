<!-- StepStandingsMatchManagement.vue -->
<template>
  <div class="flex flex-col gap-4">

    <!-- Заголовок секции — единый стиль с остальными заголовками сайта -->
    <h3 class="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">
      Управление матчем
    </h3>

    <OrganismsTournamentStepStandingsMatchTeamPickersAccordion
      ref="teamPickersAccordionRef"
      :teams="teams"
      :home-team="homeTeam"
      :away-team="awayTeam"
      :team-marker="teamMarker"
      :get-team-color-index="teamColorIndexForName"
      @update:home-team="$emit('update:homeTeam', $event)"
      @update:away-team="$emit('update:awayTeam', $event)"
    />

    <!-- Карточка матча — только при двух командах; ref — прокрутка сюда после выбора пары. -->
    <div
      v-if="homeTeam && awayTeam"
      ref="matchCardRef"
      class="rounded-2xl border border-slate-300 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900"
    >

      <!-- Табло — ref для скролла ровно к счёту (видно строку команд + 0:0). -->
      <div
        ref="matchScoreBoardRef"
        class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-slate-200 dark:border-slate-700/60 px-4 py-3 scroll-mt-[calc(theme(spacing.14)+env(safe-area-inset-top)+0.5rem)]"
      >
        <p class="flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
          <AtomsTeamMarkerOrLogo :team-name="homeTeam" :marker="teamMarker(homeTeam)" size="md" />
          <span class="min-w-0 truncate">{{ homeTeam }}</span>
          <AtomsTeamColorDot :team-name="homeTeam" :color-index="homeTeamColorIndex" />
        </p>

        <div class="text-center">
          <p
            class="inline-block rounded-md px-3 py-1 font-mono text-xl font-semibold tabular-nums ring-1"
            :class="boardScorePillClass"
          >
            {{ homeGoals }}&nbsp;:&nbsp;{{ awayGoals }}
          </p>
        </div>

        <p class="flex min-w-0 items-center justify-end gap-1.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
          <AtomsTeamColorDot :team-name="awayTeam" :color-index="awayTeamColorIndex" />
          <span class="min-w-0 truncate">{{ awayTeam }}</span>
          <AtomsTeamMarkerOrLogo :team-name="awayTeam" :marker="teamMarker(awayTeam)" size="md" />
        </p>
      </div>

      <!-- Составы: на мобайле — друг под другом, на широком — рядом -->
      <!-- show-player-rating=false — в отметке событий рейтинг в строке не нужен, только имя. -->
      <div class="flex flex-col divide-y divide-slate-200 dark:divide-slate-700/60 sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <OrganismsTournamentStepStandingsTeamRosterColumn
          side="home"
          :team-name="homeTeam"
          :players="playersByTeam(homeTeam)"
          active-shadow-class="border-sky-300 bg-sky-50 shadow-sm shadow-sky-200/30 dark:border-sky-500/40 dark:bg-sky-500/10 dark:shadow-none"
          :team-marker="teamMarker"
          :show-player-rating="false"
          :display-player-label="displayPlayerLabelWithoutRating"
          :is-active-player="isActivePlayer"
          :select-player-for-mark="selectPlayerForMark"
          :player-stat="playerStat"
          :add-player-event="addPlayerEvent"
          :remove-player-event="removePlayerEvent"
        />
        <OrganismsTournamentStepStandingsTeamRosterColumn
          side="away"
          :team-name="awayTeam"
          :players="playersByTeam(awayTeam)"
          active-shadow-class="border-emerald-300 bg-emerald-50 shadow-sm shadow-emerald-200/30 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:shadow-none"
          :team-marker="teamMarker"
          :show-player-rating="false"
          :display-player-label="displayPlayerLabelWithoutRating"
          :is-active-player="isActivePlayer"
          :select-player-for-mark="selectPlayerForMark"
          :player-stat="playerStat"
          :add-player-event="addPlayerEvent"
          :remove-player-event="removePlayerEvent"
        />
      </div>

      <!-- Кнопка "Следующий матч" — только когда выбраны команды; на телефоне на всю ширину карточки. -->
      <div class="border-t border-slate-200 dark:border-slate-700/60 px-3 py-2.5">
        <button
          type="button"
          class="inline-flex h-11 w-full items-center justify-center rounded-xl bg-sky-500 px-5 text-sm font-semibold text-white dark:text-slate-900
                 transition-colors sm:w-auto md:hover:bg-sky-400 active:bg-sky-600
                 disabled:cursor-not-allowed disabled:opacity-40
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
          :disabled="!hasNextMatch"
          @click="openActionConfirm('next')"
        >
          Следующий матч →
        </button>
      </div>

      <!-- Подтверждение для "Следующий матч" — обёртка для scrollIntoView к кнопкам подтверждения -->
      <div ref="nextConfirmAnchor" class="border-t border-slate-200 dark:border-slate-700/60">
        <MoleculesConfirmInline
          class="px-3 py-2.5"
          :open="isActionConfirmOpen && pendingAction === 'next'"
          :busy="false"
          tone="neutral"
          aria-label="Подтверждение следующего матча"
          title="Перейти к следующему матчу?"
          :subtitle="nextMatchConfirmSubtitle"
          cancel-text="Отмена"
          confirm-text="Да, следующий"
          @cancel="closeActionConfirm"
          @confirm="confirmPendingAction"
        />
      </div>

      <!-- Подсказка когда все пары сыграли -->
      <p
        v-if="!hasNextMatch"
        class="px-4 pb-3 text-[11px] text-slate-600 dark:text-slate-500"
      >
        Все пары команд уже сыграли между собой.
      </p>
    </div>

    <!-- Кнопка "Управление" — всегда видна, вне карточки матча -->
    <div class="overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900">
      <button
        :id="mgmtToggleId"
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        :class="isMgmtOpen ? 'bg-slate-100 dark:bg-slate-800/80' : 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/20'"
        :aria-expanded="isMgmtOpen"
        :aria-controls="mgmtPanelId"
        @click="isMgmtOpen = !isMgmtOpen"
      >
        <span class="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          Управление
          <span
            class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            :class="isMgmtOpen ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'"
          >
            {{ isMgmtOpen ? 'Открыт' : 'Скрыт' }}
          </span>
        </span>
        <svg
          class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200"
          :class="isMgmtOpen && 'rotate-180'"
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
        enter-to-class="max-h-[32rem] opacity-100"
        leave-active-class="transition-all duration-150 ease-in overflow-hidden"
        leave-from-class="max-h-[32rem] opacity-100"
        leave-to-class="max-h-0 opacity-0"
        @after-enter="scrollExpandedPanelIntoView"
      >
        <OrganismsTournamentStepStandingsMatchManagementPanel
          v-if="isMgmtOpen"
          :mgmt-panel-id="mgmtPanelId"
          :mgmt-toggle-id="mgmtToggleId"
          :can-finish-match-show-results="canFinishMatchShowResults"
          :can-finish-match-silent="canFinishMatchSilent"
          :can-finish-match="canFinishMatch"
          :can-finish-tournament="canFinishTournament"
          :can-clear-tournament="canClearTournament"
          :can-view-vk-status="canViewVkStatus"
          :is-limited-admin="isLimitedAdmin"
          :has-played-matches="hasPlayedMatches"
          :finish-tournament-status="finishTournamentStatus"
          :finish-tournament-error="finishTournamentError"
          :show-clear-tournament-confirm="showClearTournamentConfirm"
          :clear-tournament-seconds-left="clearTournamentSecondsLeft"
          :clear-tournament-busy="clearTournamentBusy"
          :is-action-confirm-open="isActionConfirmOpen"
          :pending-action="pendingAction"
          :finish-match-seconds-left="finishMatchSecondsLeft"
          :show-finish-tournament-confirm="showFinishTournamentConfirm"
          :finish-tournament-confirm-seconds-left="finishTournamentConfirmSecondsLeft"
          :show-reset-marks-confirm="showResetMarksConfirm"
          :reset-marks-seconds-left="resetMarksSecondsLeft"
          :vk-status-pending="vkStatusPending"
          :vk-status-error="vkStatusError"
          :vk-status-linked="vkStatusLinked"
          :vk-peer-id="vkPeerId"
          :open-action-confirm="openActionConfirm"
          :close-action-confirm="closeActionConfirm"
          :confirm-pending-action="confirmPendingAction"
          :open-finish-tournament-confirm="openFinishTournamentConfirm"
          :close-finish-tournament-confirm="closeFinishTournamentConfirm"
          :confirm-finish-tournament="confirmFinishTournament"
          :open-reset-marks-confirm="openResetMarksConfirm"
          :close-reset-marks-confirm="closeResetMarksConfirm"
          :confirm-reset-marks="confirmResetMarks"
          :refresh-vk-status="refreshVkStatus"
          :reload-page="reloadPage"
          @clear-tournament="$emit('clear-tournament')"
          @cancel-clear-tournament="$emit('cancel-clear-tournament')"
          @confirm-clear-tournament="$emit('confirm-clear-tournament')"
        />
      </Transition>
    </div>

  </div>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import { displayPlayerLabelWithoutRating } from '~/composables/usePlayerDisplay'
import { matchManagementConfirmAnchorsKey } from '~/composables/stepStandingsMatchManagementAnchors'
import {
  useStepStandingsMatchManagement,
  type StepStandingsMatchManagementProps,
} from '~/composables/useStepStandingsMatchManagement'

const props = defineProps<StepStandingsMatchManagementProps>()
defineEmits<{
  'update:homeTeam': [value: string]
  'update:awayTeam': [value: string]
  'clear-tournament': []
  'cancel-clear-tournament': []
  'confirm-clear-tournament': []
}>()

const {
  scrollExpandedPanelIntoView,
  canFinishTournament,
  canClearTournament,
  canFinishMatchShowResults,
  canFinishMatchSilent,
  canViewVkStatus,
  isLimitedAdmin,
  homeTeamColorIndex,
  awayTeamColorIndex,
  teamColorIndexForName,
  reloadPage,
  boardScorePillClass,
  nextMatchConfirmSubtitle,
  teamPickersAccordionRef,
  mgmtToggleId,
  mgmtPanelId,
  isMgmtOpen,
  pendingAction,
  isActionConfirmOpen,
  showResetMarksConfirm,
  resetMarksSecondsLeft,
  openResetMarksConfirm,
  closeResetMarksConfirm,
  confirmResetMarks,
  vkStatusPending,
  vkStatusError,
  vkStatusLinked,
  vkPeerId,
  refreshVkStatus,
  finishMatchSecondsLeft,
  showFinishTournamentConfirm,
  finishTournamentConfirmSecondsLeft,
  openFinishTournamentConfirm,
  closeFinishTournamentConfirm,
  confirmFinishTournament,
  nextConfirmAnchor,
  finishConfirmAnchor,
  finishSilentConfirmAnchor,
  finishTournamentConfirmAnchor,
  clearDataConfirmAnchor,
  matchCardRef,
  matchScoreBoardRef,
  closeActionConfirm,
  openActionConfirm,
  confirmPendingAction,
} = useStepStandingsMatchManagement(props)

provide(matchManagementConfirmAnchorsKey, {
  finishConfirmAnchor,
  finishSilentConfirmAnchor,
  finishTournamentConfirmAnchor,
  clearDataConfirmAnchor,
})
</script>
