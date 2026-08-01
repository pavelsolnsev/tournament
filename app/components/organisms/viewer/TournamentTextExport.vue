<template>
  <!-- Simple10: блок для админа — разворачивает полные итоги турнира обычным текстом, который можно скопировать. -->
  <section class="px-3 pb-6 pt-2 sm:px-6 print:hidden">
    <div
      class="overflow-hidden rounded-2xl border bg-slate-50/90 transition-colors dark:bg-slate-900/60"
      :class="isOpen ? 'border-slate-300 dark:border-slate-700/60' : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/50'"
    >
      <button
        :id="toggleId"
        type="button"
        class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        :class="isOpen ? 'bg-slate-50/80 dark:bg-slate-800/80' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'"
        :aria-expanded="isOpen"
        :aria-controls="panelId"
        @click="isOpen = !isOpen"
      >
        <span class="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <span aria-hidden="true">📋</span>
          <span class="truncate">Текст</span>
          <span
            class="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            :class="isOpen ? 'bg-emerald-400/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100/80 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400'"
          >
            {{ isOpen ? 'Открыт' : 'Скрыт' }}
          </span>
        </span>
        <svg
          class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200"
          :class="isOpen && 'rotate-180'"
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

      <div
        v-if="isOpen"
        :id="panelId"
        role="region"
        :aria-labelledby="toggleId"
        class="border-t border-slate-200 px-3 pb-4 pt-3 dark:border-slate-700/60 sm:px-4"
      >
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            :class="copied ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'"
            @click="copyText"
          >
            <span aria-hidden="true">{{ copied ? '✓' : '📄' }}</span>
            {{ copied ? 'Скопировано' : 'Скопировать текст' }}
          </button>
          <span class="text-xs text-slate-500 dark:text-slate-500">
            {{ summaryText.length }} символов
          </span>
        </div>

        <!-- Текст в textarea: легко выделить целиком и вставить куда угодно. -->
        <textarea
          ref="textareaRef"
          class="h-80 w-full resize-y rounded-xl border border-slate-300 bg-white p-3 font-mono text-xs leading-normal text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200"
          readonly
          spellcheck="false"
          aria-label="Итоги турнира текстом"
          :value="summaryText"
          @focus="selectAll"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { TournamentSummary } from '~/composables/useTournamentSummary'
import type { PlayedMatch, PlayerMatchStats } from '~/composables/tournament-standings/types'
import { useTeamColors } from '~/composables/useTeamColors'
import { buildEffectiveTeamColors, normalizeTeamName, resolveTeamColorIndex } from '~/utils/teamNames'
import { buildTournamentSummaryText } from '~/utils/tournamentSummaryText'

const props = defineProps<{
  tournamentName: string
  tournamentDate?: string
  venueLabel?: string
  formatLabel?: string
  pageUrl?: string
  summary: TournamentSummary
  players: Player[]
  assignmentByPlayerId: Record<number, string>
  aggregatePlayerStats: Record<number, PlayerMatchStats>
  playerRatingDeltas: Record<number, number>
  playedMatchesList: PlayedMatch[]
  teamColors?: Record<string, number>
}>()

const sectionUid = useId?.() ?? Math.random().toString(36).slice(2)
const toggleId = `tournament-text-export-${sectionUid}`
const panelId = `tournament-text-export-panel-${sectionUid}`
const isOpen = ref(false)

// Цвета команд считаем тем же хелпером, что и остальные секции итогов — маркеры совпадут с UI.
const effectiveTeamColors = computed(() =>
  buildEffectiveTeamColors(props.teamColors, props.summary.standingsRows, props.playedMatchesList),
)

function teamMarker(teamName: string): string {
  const { getMarkerByIndex } = useTeamColors()
  const idx = props.summary.standingsRows.findIndex(r => normalizeTeamName(r.teamName) === normalizeTeamName(teamName))
  return getMarkerByIndex(resolveTeamColorIndex(teamName, effectiveTeamColors.value, idx >= 0 ? idx : 0))
}

// Сам текст — пересобирается автоматически, если данные турнира изменились.
const summaryText = computed(() =>
  buildTournamentSummaryText({
    tournamentName: props.tournamentName,
    tournamentDate: props.tournamentDate,
    venueLabel: props.venueLabel,
    formatLabel: props.formatLabel,
    pageUrl: props.pageUrl,
    summary: props.summary,
    players: props.players,
    assignmentByPlayerId: props.assignmentByPlayerId,
    aggregatePlayerStats: props.aggregatePlayerStats,
    playerRatingDeltas: props.playerRatingDeltas,
    playedMatchesList: props.playedMatchesList,
    teamMarker,
  }),
)

// Копирование: сначала пробуем буфер обмена, при отказе — выделяем текст, чтобы скопировать вручную.
const copied = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

async function copyText() {
  try {
    await navigator.clipboard.writeText(summaryText.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    textareaRef.value?.select()
  }
}

// Клик по полю сразу выделяет весь текст — удобно копировать вручную на телефоне.
function selectAll() {
  textareaRef.value?.select()
}
</script>
