<!-- Обзор составов на шаге «Команды» — тот же визуальный паттерн, что блок «Составы» в StepStandings + StepStandingsTeamRosterTotals. -->
<template>
  <div
    class="overflow-hidden rounded-2xl border bg-slate-50 dark:bg-slate-900/60 transition-colors"
    :class="
      open
        ? 'border-slate-300 dark:border-slate-700/60'
        : 'border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/50'
    "
  >
    <button
      :id="toggleId"
      type="button"
      class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors
             focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
      :class="open ? 'bg-slate-50 dark:bg-slate-800/80' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'"
      :aria-expanded="open"
      :aria-controls="panelId"
      @click="open = !open"
    >
      <span class="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
        Составы
        <span
          class="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          :class="
            open
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'
          "
        >
          {{ open ? 'Открыт' : 'Скрыт' }}
        </span>
      </span>
      <svg
        class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200"
        :class="open && 'rotate-180'"
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
        v-if="open"
        :id="panelId"
        role="region"
        :aria-labelledby="toggleId"
        class="w-full min-w-0 border-t border-slate-200 px-3 pb-4 pt-3 dark:border-slate-700/60 sm:px-4"
      >
        <AtomsEmptyStateBox
          v-if="visibleTeams.length === 0"
          align="center"
          size="sm"
          root-class="mx-4 mb-4"
        >
          Пока нет подтверждённых команд и составов — подтвердите команды или распределите игроков ниже.
        </AtomsEmptyStateBox>

        <section
          v-else
          class="min-w-0 w-full space-y-3"
        >
          <div
            v-for="teamName in visibleTeams"
            :key="teamName"
            class="w-full min-w-0 overflow-hidden rounded-none bg-slate-50/90 dark:bg-slate-900/30"
          >
            <div class="flex items-center gap-2 py-2.5">
              <span class="shrink-0 text-base leading-none" aria-hidden="true">
                <AtomsTeamMarkerOrLogo
                  :team-name="teamName"
                  :marker="teamMarker(teamName)"
                  size="sm"
                />
              </span>
              <span class="min-w-0 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {{ teamName }}
              </span>
            </div>

            <div class="pb-2">
              <p
                v-if="playersForTeam(teamName).length === 0"
                class="px-1 py-1.5 text-xs text-slate-400 dark:text-slate-600"
              >
                В составе нет игроков.
              </p>

              <ul
                v-else
                class="space-y-1"
                role="list"
              >
                <li
                  v-for="p in playersForTeam(teamName)"
                  :key="p.id"
                  class="flex min-w-0 items-center gap-2 rounded-xl border border-transparent bg-slate-100/80 px-3 py-2.5 dark:bg-slate-800/40"
                >
                  <AtomsPlayerAvatar
                    class="shrink-0"
                    :photo="p.photo"
                    :fallback-name="p.name"
                    size="md"
                  />
                  <span class="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                    <span class="min-w-0 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {{ labelParts(p).name }}
                    </span>
                    <span
                      v-if="labelParts(p).rating"
                      class="shrink-0 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-100 tabular-nums"
                    >{{ labelParts(p).rating }}</span>
                  </span>
                  <div class="flex shrink-0 items-center gap-1">
                    <span class="text-xs text-slate-400 dark:text-slate-700">—</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { ComputedRef, MaybeRef } from 'vue'
import { computed, ref, unref, useId } from 'vue'
import { useTeamColors } from '~/composables/useTeamColors'
import { playerLabelRatingParts } from '~/composables/usePlayerDisplay'
import { dedupeTeamNamesPreservingOrder, normalizeTeamName } from '~/utils/teamNames'
import { scrollExpandedPanelIntoView } from '~/utils/scrollExpandedPanelIntoView'

const props = defineProps<{
  players: Player[]
  teamOptions: MaybeRef<string[]> | ComputedRef<string[]>
  getTeam: (playerId: number) => string
  getTeamColor: (teamName: string) => number
  confirmedTeamNames: MaybeRef<Set<string>>
  autoDistributedNames?: MaybeRef<Set<string>>
}>()

const { getMarkerByIndex } = useTeamColors()

const uid = useId()
const toggleId = `step-teams-rosters-toggle-${uid}`
const panelId = `step-teams-rosters-panel-${uid}`

const open = ref(false)

const teamOptionsList = computed(() => unref(props.teamOptions))
const confirmedSet = computed(() => unref(props.confirmedTeamNames) ?? new Set<string>())

function teamMarker(teamName: string): string {
  const colorIndex = Number.isFinite(props.getTeamColor(teamName)) ? props.getTeamColor(teamName) : 0
  return getMarkerByIndex(colorIndex)
}

function labelParts(p: Player) {
  return playerLabelRatingParts(p)
}

const teamsOrderedFromOptions = computed(() => {
  const list = dedupeTeamNamesPreservingOrder(teamOptionsList.value)
  const confirmed = list.filter((name) => confirmedSet.value.has(normalizeTeamName(name)))
  const others = list.filter((name) => !confirmedSet.value.has(normalizeTeamName(name)))
  return [...confirmed, ...others]
})

const normalizedTeamsWithPlayers = computed(() => {
  const s = new Set<string>()
  for (const p of props.players) {
    const t = normalizeTeamName(props.getTeam(p.id) || '')
    if (t) s.add(t)
  }
  return s
})

const visibleTeams = computed(() => {
  const out: string[] = []
  const seenNorm = new Set<string>()

  for (const name of teamsOrderedFromOptions.value) {
    const n = normalizeTeamName(name)
    if (!n) continue
    const confirmed = confirmedSet.value.has(n)
    const hasPlayers = normalizedTeamsWithPlayers.value.has(n)
    if (confirmed || hasPlayers) {
      out.push(name)
      seenNorm.add(n)
    }
  }

  for (const n of normalizedTeamsWithPlayers.value) {
    if (seenNorm.has(n)) continue
    const p = props.players.find((x) => normalizeTeamName(props.getTeam(x.id) || '') === n)
    const raw = p ? String(props.getTeam(p.id) ?? '').trim() : ''
    if (raw) {
      out.push(raw)
      seenNorm.add(normalizeTeamName(raw))
    }
  }

  return out
})

function playersForTeam(teamName: string): Player[] {
  const want = normalizeTeamName(teamName)
  return props.players
    .filter((p) => normalizeTeamName(props.getTeam(p.id) || '') === want)
    .sort((a, b) => {
      const ra = a.rating != null ? Number(a.rating) : -1
      const rb = b.rating != null ? Number(b.rating) : -1
      if (rb !== ra) return rb - ra
      return labelParts(a).name.localeCompare(labelParts(b).name, 'ru')
    })
}
</script>
