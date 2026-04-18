<template>
  <!-- Simple10: Аккордеон выбора дом/гость — как у остальных секций турнира. -->
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
          :get-team-color-index="getTeamColorIndex"
          @update:home-team="$emit('update:homeTeam', $event)"
          @update:away-team="$emit('update:awayTeam', $event)"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { scrollExpandedPanelIntoView } from '~/utils/scrollExpandedPanelIntoView'

defineProps<{
  teams: string[]
  homeTeam: string
  awayTeam: string
  teamMarker: (teamName: string) => string
  getTeamColorIndex: (teamName: string) => number
}>()

defineEmits<{
  'update:homeTeam': [value: string]
  'update:awayTeam': [value: string]
}>()

const uid = useId?.() ?? Math.random().toString(36).slice(2)
const teamPickersToggleId = `match-team-pickers-toggle-${uid}`
const teamPickersPanelId = `match-team-pickers-panel-${uid}`
const isTeamPickersOpen = ref(true)

/** Simple10: Родитель вызывает после выбора обеих команд — ref снаружи разворачивается, нельзя писать в .value. */
function collapseTeamPickersSection() {
  isTeamPickersOpen.value = false
}

defineExpose({
  collapseTeamPickersSection,
})
</script>
