<!-- StepStandingsMatchManagement.vue -->
<template>
  <div class="flex flex-col gap-4">

    <!-- Заголовок секции — единый стиль с остальными заголовками сайта -->
    <h3 class="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">
      Управление матчем
    </h3>

    <!-- Выбор команд (дом/гость) — overflow-hidden как у остальных аккордеонов; списки рендерятся через Teleport -->
    <div
      class="overflow-hidden rounded-2xl border bg-slate-50 dark:bg-slate-900/60 transition-colors"
      :class="isTeamPickersOpen ? 'border-slate-300 dark:border-slate-700/60' : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/50'"
    >
      <button
        :id="teamPickersToggleId"
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left
               transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        :class="isTeamPickersOpen ? 'bg-slate-100 dark:bg-slate-800/80' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'"
        :aria-expanded="isTeamPickersOpen"
        :aria-controls="teamPickersPanelId"
        @click="isTeamPickersOpen = !isTeamPickersOpen"
      >
        <span class="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          Команды (дом/гость)
          <span
            class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            :class="isTeamPickersOpen ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'"
          >
            {{ isTeamPickersOpen ? 'Открыт' : 'Скрыт' }}
          </span>
        </span>
        <svg
          class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200"
          :class="isTeamPickersOpen && 'rotate-180'"
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
          v-if="isTeamPickersOpen"
          :id="teamPickersPanelId"
          role="region"
          :aria-labelledby="teamPickersToggleId"
          class="pt-1 pb-2"
        >
          <OrganismsTournamentStepStandingsTeamPickers
            :teams="teams"
            :home-team="homeTeam"
            :away-team="awayTeam"
            :team-marker="teamMarker"
            :get-team-color-index="teamColorIndexForName"
            @update:home-team="$emit('update:homeTeam', $event)"
            @update:away-team="$emit('update:awayTeam', $event)"
          />
        </div>
      </Transition>
    </div>

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
        <div
          v-if="isMgmtOpen"
          :id="mgmtPanelId"
          role="region"
          :aria-labelledby="mgmtToggleId"
          class="flex flex-col gap-2 border-t border-slate-200 dark:border-slate-700/60 px-3 py-3"
        >
          <!-- Завершить матч — активна только когда есть текущий матч -->
          <button
            v-if="canFinishMatchAction"
            type="button"
            class="inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white dark:text-slate-900
                   transition-colors md:hover:bg-emerald-400 active:bg-emerald-600
                   disabled:cursor-not-allowed disabled:opacity-40
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            :disabled="!canFinishMatch"
            @click="openActionConfirm('finish')"
          >
            Завершить матч
          </button>

          <!-- Подтверждение «Завершить матч» — 3 секунды до кнопки подтверждения, как при сбросе турнира -->
          <div v-if="canFinishMatchAction" ref="finishConfirmAnchor">
            <MoleculesDangerConfirmInline
              :open="isActionConfirmOpen && pendingAction === 'finish'"
              :seconds-left="finishMatchSecondsLeft"
              :busy="false"
              aria-label="Подтверждение завершения матча"
              title="Завершить матч? Результат текущего матча будет записан в историю."
              cancel-text="Отмена"
              confirm-text="Завершить"
              @cancel="closeActionConfirm"
              @confirm="confirmPendingAction"
            />
          </div>

          <div class="border-t border-slate-200 dark:border-slate-700/60" />

          <!-- Сообщение об успехе / ошибке завершения турнира -->
          <div
            v-if="finishTournamentStatus === 'success'"
            class="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300"
          >
            <span aria-hidden="true">✅</span>
            <span>Данные сохранены в базу!</span>
          </div>
          <div
            v-else-if="finishTournamentStatus === 'error' && finishTournamentError"
            class="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300"
          >
            <span aria-hidden="true" class="mt-0.5 shrink-0">⚠️</span>
            <span>{{ finishTournamentError }}</span>
          </div>

          <!-- Завершить турнир — сначала панель с отсчётом 3 сек, потом сохранение в БД -->
          <button
            v-if="canFinishTournament"
            type="button"
            class="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border px-4
                   text-sm font-semibold transition-all
                   disabled:cursor-not-allowed disabled:opacity-40
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            :class="finishTournamentStatus === 'success'
              ? 'border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
              : finishTournamentStatus === 'loading'
                ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 md:hover:bg-amber-500/20 md:hover:border-amber-500/50'"
            :disabled="!canFinishTournament || !hasPlayedMatches || finishTournamentStatus === 'loading' || finishTournamentStatus === 'success' || showFinishTournamentConfirm"
            @click="openFinishTournamentConfirm"
          >
            <span
              v-if="finishTournamentStatus === 'loading'"
              class="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 dark:border-slate-500 border-t-slate-700 dark:border-t-slate-200"
              aria-hidden="true"
            />
            <span v-else class="text-base leading-none" aria-hidden="true">
              {{ finishTournamentStatus === 'success' ? '✅' : '🏆' }}
            </span>
            <span>{{
              finishTournamentStatus === 'loading' ? 'Сохранение...'
              : finishTournamentStatus === 'success' ? 'Турнир завершён'
              : 'Завершить турнир'
            }}</span>
          </button>

          <div ref="finishTournamentConfirmAnchor">
            <MoleculesDangerConfirmInline
              :open="showFinishTournamentConfirm && canFinishTournament"
              :seconds-left="finishTournamentConfirmSecondsLeft"
              :busy="finishTournamentStatus === 'loading'"
              aria-label="Подтверждение завершения турнира"
              title="Завершить турнир? Статистика игроков и команд будет сохранена в базу."
              cancel-text="Отмена"
              confirm-text="Сохранить и завершить"
              busy-text="Сохранение…"
              @cancel="closeFinishTournamentConfirm"
              @confirm="confirmFinishTournament"
            />
          </div>

          <!-- Разделитель перед опасной зоной сброса -->
          <div class="border-t border-slate-200 dark:border-slate-700/60" />

          <!-- Кнопка «Очистить данные» — сбрасывает турнир полностью -->
          <button
            v-if="canClearTournament && !showClearTournamentConfirm"
            type="button"
            class="inline-flex h-10 w-full items-center justify-center rounded-xl border border-red-300/70 bg-red-50
                   px-4 text-sm font-semibold text-red-700 transition-colors
                   hover:bg-red-100 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
            @click="$emit('clear-tournament')"
          >
            Очистить данные
          </button>
          <!-- Инлайн-подтверждение сброса — обёртка для прокрутки к отсчёту и кнопкам -->
          <div v-else-if="canClearTournament" ref="clearDataConfirmAnchor">
            <MoleculesDangerConfirmInline
              :open="true"
              :seconds-left="clearTournamentSecondsLeft"
              :busy="clearTournamentBusy"
              title="Сбросить турнир? Игроки в турнире, команды, таблица и статус матча обнулятся. Список игроков в базе не трогаем."
              cancel-text="Отмена"
              confirm-text="Очистить всё"
              busy-text="Очищаем…"
              aria-label="Подтверждение полного сброса турнира"
              @cancel="$emit('cancel-clear-tournament')"
              @confirm="$emit('confirm-clear-tournament')"
            />
          </div>

          <!-- VK статус — внизу управления, чтобы не мешал кнопкам. -->
          <div
            v-if="canViewVkStatus"
            class="mt-1 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 px-3 py-2.5"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="text-xs font-semibold text-slate-700 dark:text-slate-200">
                VK статус
              </p>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200
                       transition-colors hover:bg-slate-200 dark:hover:bg-slate-700
                       disabled:cursor-not-allowed disabled:opacity-50
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40"
                :disabled="vkStatusPending"
                @click="refreshVkStatus"
              >
                {{ vkStatusPending ? 'Обновляем…' : 'Обновить' }}
              </button>
            </div>

            <p v-if="vkStatusError" class="mt-2 text-[11px] text-red-600 dark:text-red-300">
              {{ vkStatusError }}
            </p>

            <div v-else class="mt-2 flex flex-wrap gap-2">
              <span
                class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                :class="vkStatusLinked ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
              >
                {{ vkStatusLinked ? 'Привязка: есть' : 'Привязка: нет' }}
              </span>
              <span
                v-if="vkStatusLinked && vkPeerId"
                class="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
              >
                peerId: {{ vkPeerId }}
              </span>
            </div>
          </div>

          <!-- Сбросить отметки — под VK статусом (по просьбе), чтобы не мешать основным действиям. -->
          <button
            v-if="!showResetMarksConfirm"
            type="button"
            class="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-300/70 bg-slate-100/70
                   px-4 text-sm font-semibold text-slate-700 transition-colors
                   hover:bg-slate-200/70 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40"
            @click="openResetMarksConfirm"
          >
            Сбросить отметки
          </button>
          <div v-else>
            <MoleculesDangerConfirmInline
              :open="true"
              :seconds-left="isLimitedAdmin ? 0 : resetMarksSecondsLeft"
              :busy="false"
              aria-label="Подтверждение сброса отметок"
              title="Сбросить отметки и результаты?"
              subtitle="Сыгранные матчи, счёт и отметки игроков будут обнулены. Команды и игроки останутся."
              cancel-text="Отмена"
              :confirm-text="(isLimitedAdmin ? 0 : resetMarksSecondsLeft) > 0 ? `Сбросить через ${(isLimitedAdmin ? 0 : resetMarksSecondsLeft)}с` : 'Сбросить'"
              @cancel="closeResetMarksConfirm"
              @confirm="confirmResetMarks"
            />
          </div>

          <div class="border-t border-slate-200 dark:border-slate-700/60" />

          <!-- Обновить страницу — в самом низу управления, чтобы не мешала основным действиям. -->
          <button
            type="button"
            class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-300/70 bg-white/70 px-4 text-sm font-semibold text-slate-700 transition-colors
                   hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-900/70
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            aria-label="Обновить страницу"
            @click="reloadPage"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            Обновить страницу
          </button>
        </div>
      </Transition>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { StatKey } from '~/composables/tournament-standings/types'
import { computed, nextTick, onUnmounted, watch } from 'vue'
import { displayPlayerLabelWithoutRating } from '~/composables/usePlayerDisplay'
import { useAdminAuth } from '~/composables/useAdminAuth'
import { useTeamColors } from '~/composables/useTeamColors'
import MoleculesConfirmInline from '~/components/molecules/ConfirmInline.vue'
import MoleculesDangerConfirmInline from '~/components/molecules/DangerConfirmInline.vue'
import { scrollExpandedPanelIntoView } from '~/utils/scrollExpandedPanelIntoView'
import { reloadWithScrollRestore } from '~/utils/reloadWithScrollRestore'
import { resolveTeamColorIndex } from '~/utils/teamNames'

type Side = 'home' | 'away'

type PlayerMatchStats = {
  goals: number
  assists: number
  saves: number
  yellows: number
}

type VkStatusResponse = {
  ok: true
  linked: boolean
  closeVkListRequested: boolean
  peerId: number | null
  gameEventId: string | null
}

const props = defineProps<{
  teams: string[]
  homeTeam: string
  awayTeam: string
  homeGoals: number
  awayGoals: number
  hasNextMatch: boolean
  canFinishMatch: boolean
  hasPlayedMatches: boolean
  playersByTeam: (teamName: string) => Player[]
  teamMarker: (teamName: string) => string
  effectiveTeamColors: Record<string, number>
  displayPlayerLabel: (player: Player) => string
  isActivePlayer: (side: Side, playerId: number) => boolean
  selectPlayerForMark: (side: Side, playerId: number) => void
  playerStat: (side: Side, playerId: number) => PlayerMatchStats
  onSelectAction: (side: Side, playerId: number, event: Event) => void
  addPlayerEvent: (side: Side, playerId: number, key: StatKey) => void
  removePlayerEvent: (side: Side, playerId: number, key: StatKey) => void
  goToNextMatch: () => void
  resetMatchStats: () => void
  resetTournamentMarks: () => void
  finishMatch: () => void
  finishTournamentStatus: 'idle' | 'loading' | 'success' | 'error'
  finishTournamentError: string | null
  onFinishTournament: () => void
  // Данные для кнопки «Очистить данные» — управляются родителем.
  showClearTournamentConfirm: boolean
  clearTournamentSecondsLeft: number
  clearTournamentBusy: boolean
}>()

defineEmits<{
  'update:homeTeam': [value: string]
  'update:awayTeam': [value: string]
  // Три события для управления сбросом турнира из родителя.
  'clear-tournament': []
  'cancel-clear-tournament': []
  'confirm-clear-tournament': []
}>()

const { getMatchScorePillClass } = useTeamColors()

// Simple10: Ограниченный админ (limited) может управлять матчем, но не может делать опасные действия.
const { adminRole } = useAdminAuth()
const canFinishTournament = computed(() => adminRole.value === 'full')
const canClearTournament = computed(() => adminRole.value === 'full')
const canFinishMatchAction = computed(() => adminRole.value === 'full')
const canViewVkStatus = computed(() => adminRole.value === 'full')
const isLimitedAdmin = computed(() => adminRole.value === 'limited')

// Simple10: Индекс цвета команды в турнире — для маленького кружка рядом с названием (только при логотипе).
const homeTeamColorIndex = computed(() =>
  resolveTeamColorIndex(props.homeTeam, props.effectiveTeamColors, 0),
)
const awayTeamColorIndex = computed(() =>
  resolveTeamColorIndex(props.awayTeam, props.effectiveTeamColors, 1),
)

function teamColorIndexForName(teamName: string): number {
  return resolveTeamColorIndex(teamName, props.effectiveTeamColors, 0)
}

function reloadPage() {
  reloadWithScrollRestore()
}

// Табло: ничья — серая плашка; лидер — в цвете его команды.
const boardScorePillClass = computed(() =>
  getMatchScorePillClass(
    props.homeGoals,
    props.awayGoals,
    props.homeTeam,
    props.awayTeam,
    (name) => resolveTeamColorIndex(name, props.effectiveTeamColors, 0),
  ),
)

// Подпись в диалоге «Следующий матч»: предупреждаем о счёте 0:0 чтобы не записать пустой матч случайно.
const nextMatchConfirmSubtitle = computed(() => {
  const isZeroZero = props.homeGoals === 0 && props.awayGoals === 0
  if (isZeroZero) {
    return `Внимание: счёт ${props.homeGoals}:${props.awayGoals}. Матч будет записан с нулевым счётом.`
  }
  return 'Текущий матч будет завершён и записан в историю.'
})

const uid = useId?.() ?? Math.random().toString(36).slice(2)

// Управление видимостью блока "Команды (дом/гость)".
const teamPickersToggleId = `match-team-pickers-toggle-${uid}`
const teamPickersPanelId = `match-team-pickers-panel-${uid}`
const isTeamPickersOpen = ref(true)

// Управление видимостью блока "Управление" (Завершить матч, Завершить турнир).
const mgmtToggleId = `match-mgmt-toggle-${uid}`
const mgmtPanelId = `match-mgmt-panel-${uid}`
const isMgmtOpen = ref(false)

const pendingAction = ref<'next' | 'finish' | null>(null)
const isActionConfirmOpen = computed(() => pendingAction.value !== null)

// Simple10: Отдельное подтверждение для «Сбросить отметки» (обнуляет результаты и события).
const showResetMarksConfirm = ref(false)
const resetMarksSecondsLeft = ref(3)
let resetMarksCountdown: ReturnType<typeof setInterval> | null = null

function startResetMarksCountdown() {
  resetMarksSecondsLeft.value = 3
  if (resetMarksCountdown) clearInterval(resetMarksCountdown)
  resetMarksCountdown = setInterval(() => {
    resetMarksSecondsLeft.value -= 1
    if (resetMarksSecondsLeft.value <= 0 && resetMarksCountdown) {
      clearInterval(resetMarksCountdown)
      resetMarksCountdown = null
    }
  }, 1000)
}

function stopResetMarksCountdown() {
  if (resetMarksCountdown) {
    clearInterval(resetMarksCountdown)
    resetMarksCountdown = null
  }
  resetMarksSecondsLeft.value = 3
}

function openResetMarksConfirm() {
  showResetMarksConfirm.value = true
  startResetMarksCountdown()
}

function closeResetMarksConfirm() {
  showResetMarksConfirm.value = false
  stopResetMarksCountdown()
}

function confirmResetMarks() {
  // Simple10: Сбрасываем результаты и отметки через функцию родителя.
  props.resetTournamentMarks()
  closeResetMarksConfirm()
}

// VK статус: отдельный запрос, чтобы админ видел — закрыт ли список и снята ли привязка.
const vkStatusPending = ref(false)
const vkStatusError = ref<string | null>(null)
const vkStatusLinked = ref(false)
const vkPeerId = ref<number | null>(null)

async function refreshVkStatus() {
  // Simple10: Ограниченный админ не должен видеть VK статус и не должен делать запросы к VK статусу.
  if (!canViewVkStatus.value) return
  // Делаем запрос только по кнопке: это не критично для UI и не должно спамить сервер.
  if (vkStatusPending.value) return
  vkStatusPending.value = true
  vkStatusError.value = null
  try {
    const res = await $fetch<VkStatusResponse>('/api/tournament/vk-status', { method: 'GET' })
    vkStatusLinked.value = res.linked === true
    vkPeerId.value = res.peerId ?? null
  } catch (e: unknown) {
    // Ошибку показываем коротко, чтобы было понятно что проверить (сессия/сервер).
    vkStatusError.value = 'Не удалось получить VK статус (проверьте админ-сессию и сервер).'
  } finally {
    vkStatusPending.value = false
  }
}

// Simple10: Первый запрос делаем только для полного админа — limited не должен видеть VK статус.
if (canViewVkStatus.value) {
  void refreshVkStatus()
}

// Отсчёт 3 секунды перед «Завершить матч» — та же идея что у «Очистить данные».
const finishMatchSecondsLeft = ref(3)
let finishMatchCountdown: ReturnType<typeof setInterval> | null = null

function startFinishMatchCountdown() {
  finishMatchSecondsLeft.value = 3
  if (finishMatchCountdown) clearInterval(finishMatchCountdown)
  finishMatchCountdown = setInterval(() => {
    finishMatchSecondsLeft.value -= 1
    if (finishMatchSecondsLeft.value <= 0 && finishMatchCountdown) {
      clearInterval(finishMatchCountdown)
      finishMatchCountdown = null
    }
  }, 1000)
}

function stopFinishMatchCountdown() {
  if (finishMatchCountdown) {
    clearInterval(finishMatchCountdown)
    finishMatchCountdown = null
  }
  finishMatchSecondsLeft.value = 3
}

watch(pendingAction, (action) => {
  if (action === 'finish') startFinishMatchCountdown()
  else stopFinishMatchCountdown()
})

// Подтверждение «Завершить турнир» с отсчётом 3 секунды перед сохранением в БД.
const showFinishTournamentConfirm = ref(false)
const finishTournamentConfirmSecondsLeft = ref(3)
let finishTournamentConfirmCountdown: ReturnType<typeof setInterval> | null = null

function startFinishTournamentConfirmCountdown() {
  finishTournamentConfirmSecondsLeft.value = 3
  if (finishTournamentConfirmCountdown) clearInterval(finishTournamentConfirmCountdown)
  finishTournamentConfirmCountdown = setInterval(() => {
    finishTournamentConfirmSecondsLeft.value -= 1
    if (finishTournamentConfirmSecondsLeft.value <= 0 && finishTournamentConfirmCountdown) {
      clearInterval(finishTournamentConfirmCountdown)
      finishTournamentConfirmCountdown = null
    }
  }, 1000)
}

function stopFinishTournamentConfirmCountdown() {
  if (finishTournamentConfirmCountdown) {
    clearInterval(finishTournamentConfirmCountdown)
    finishTournamentConfirmCountdown = null
  }
  finishTournamentConfirmSecondsLeft.value = 3
}

function openFinishTournamentConfirm() {
  // Simple10: Для limited блокируем действие на всякий случай (даже если кто-то снимет disabled в DOM).
  if (!canFinishTournament.value) return
  showFinishTournamentConfirm.value = true
  startFinishTournamentConfirmCountdown()
}

function closeFinishTournamentConfirm() {
  if (props.finishTournamentStatus === 'loading') return
  showFinishTournamentConfirm.value = false
  stopFinishTournamentConfirmCountdown()
}

function confirmFinishTournament() {
  // Simple10: Для limited блокируем действие на всякий случай (даже если панель подтверждения была открыта).
  if (!canFinishTournament.value) return
  props.onFinishTournament()
}

watch(
  () => props.finishTournamentStatus,
  (s) => {
    if (s === 'success') {
      showFinishTournamentConfirm.value = false
      stopFinishTournamentConfirmCountdown()
    }
  },
)

// Якоря под панели подтверждения — после клика прокручиваем, чтобы кнопки были в зоне видимости.
const nextConfirmAnchor = useTemplateRef<HTMLDivElement>('nextConfirmAnchor')
const finishConfirmAnchor = useTemplateRef<HTMLDivElement>('finishConfirmAnchor')
const finishTournamentConfirmAnchor = useTemplateRef<HTMLDivElement>('finishTournamentConfirmAnchor')
const clearDataConfirmAnchor = useTemplateRef<HTMLDivElement>('clearDataConfirmAnchor')
const matchCardRef = useTemplateRef<HTMLElement>('matchCardRef')
const matchScoreBoardRef = useTemplateRef<HTMLDivElement>('matchScoreBoardRef')

// Simple10: Прокрутка к строке табло со счётом (не ко всей карточке), чтобы 0:0 был в кадре под шапкой.
function scrollMatchCardIntoView() {
  if (import.meta.server) return
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const el = matchScoreBoardRef.value ?? matchCardRef.value
      el?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
    })
  })
}

function scrollConfirmIntoView(el: HTMLElement | null | undefined) {
  // Ждём кадр: v-if внутри Confirm отрисовал панель, иначе scroll может не попасть в нужную высоту.
  void nextTick(() => {
    el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  })
}

function closeActionConfirm() {
  // Закрываем подтверждение и сбрасываем таймер «Завершить матч».
  stopFinishMatchCountdown()
  pendingAction.value = null
}

function openActionConfirm(action: 'next' | 'finish') {
  pendingAction.value = action
  const el = action === 'next' ? nextConfirmAnchor.value : finishConfirmAnchor.value
  scrollConfirmIntoView(el)
}

async function confirmPendingAction() {
  // Выполняем действие только когда таймер дошёл до нуля.
  const action = pendingAction.value
  closeActionConfirm()

  if (action === 'finish') {
    props.finishMatch()
    return
  }
  if (action === 'next') {
    props.goToNextMatch()
    await nextTick()
    await nextTick()
    scrollMatchCardIntoView()
  }
}

// «Очистить данные» открывает подтверждение в родителе — прокручиваем к красной панели.
watch(
  () => props.showClearTournamentConfirm,
  (open) => {
    if (!open) return
    scrollConfirmIntoView(clearDataConfirmAnchor.value)
  },
  // После отрисовки v-else с ref — иначе якорь ещё null в том же тике.
  { flush: 'post' },
)

watch(
  () => showFinishTournamentConfirm.value,
  (open) => {
    if (open) scrollConfirmIntoView(finishTournamentConfirmAnchor.value)
  },
  { flush: 'post' },
)

onUnmounted(() => {
  stopFinishMatchCountdown()
  stopFinishTournamentConfirmCountdown()
  stopResetMarksCountdown()
})

// Только что выбрали вторую команду: сворачиваем «Команды (дом/гость)» и крутим скролл к карточке матча.
watch(
  () => [props.homeTeam, props.awayTeam] as const,
  async ([home, away], prevPair) => {
    const both = !!(home && away)
    const hadBothBefore = !!(prevPair?.[0] && prevPair?.[1])
    if (!both || hadBothBefore) return
    isTeamPickersOpen.value = false
    await nextTick()
    scrollMatchCardIntoView()
  },
  { flush: 'post' },
)
</script>