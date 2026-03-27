<template>
  <!-- Режим администратора: полный интерфейс управления турниром. -->
  <template v-if="isAdmin">
    <div class="flex min-h-screen flex-col bg-slate-900 text-slate-100">
      <!-- Шапка: sticky, safe-area сверху, высота 56px — удобно тапать -->
      <header
        class="sticky top-0 z-20 border-b border-slate-800/70 bg-slate-900/95 backdrop-blur-md"
        style="padding-top: env(safe-area-inset-top)"
      >
        <div class="mx-auto flex w-full min-w-0 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6 h-14">
          <span class="flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <span class="inline-block h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
            Администратор
          </span>
          <!-- Кнопка «Выйти»: минимум 44px высота -->
          <button
            type="button"
            class="inline-flex h-11 items-center rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100 active:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            @click="logout"
          >
            Выйти
          </button>
        </div>
      </header>

      <!-- main всегда в DOM — каркас стабилен при refresh, нет прыжков -->
      <main class="mx-auto flex w-full min-w-0 max-w-4xl flex-1 flex-col px-4 sm:px-6">
        <!-- Спиннер: занимает то же место, что и контент, чтобы не было layout shift -->
        <div
          v-if="!wizard.stateRestored.value"
          class="flex flex-1 items-center justify-center py-16"
        >
          <div class="h-9 w-9 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500" />
        </div>

        <!-- Основной контент -->
        <section v-else class="flex flex-col gap-6 py-5 sm:py-8">
          <!-- Кнопка «Назад» -->
          <div v-if="wizard.step.value > 0">
            <button
              type="button"
              class="inline-flex h-11 items-center gap-2 rounded-xl px-1 text-sm font-medium text-slate-400 transition-colors hover:text-slate-200 active:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              @click="wizard.step.value = (wizard.step.value - 1) as 0 | 1 | 2"
            >
              <span aria-hidden="true" class="text-base">←</span>
              Назад
            </button>
          </div>

          <!-- Шаги 0–1: игроки и команды -->
          <template v-if="wizard.step.value === 0 || wizard.step.value === 1">
            <h1 class="text-2xl font-bold text-slate-50 sm:text-3xl">
              {{ wizard.step.value === 0 ? 'Игроки на турнир' : 'Команды' }}
            </h1>

            <OrganismsTournamentStepTeams
              v-if="wizard.step.value === 1"
              :selected-players="wizard.selectedPlayers.value"
              :team-options="wizard.assignment.teamOptions"
              :get-team="wizard.assignment.getTeam"
              :get-team-color="wizard.assignment.getTeamColor"
              :new-team-name="wizard.assignment.newTeamName"
              :confirmed-team-names="wizard.assignment.confirmedTeamNames"
              :confirmed-teams-count="wizard.confirmedTeamsList.value.length"
              @update:new-team-name="(v) => { wizard.assignment.newTeamName.value = v }"
              @set-team="wizard.assignment.setTeam"
              @set-team-color="wizard.assignment.setTeamColor"
              @add-new-team="wizard.onAddNewTeam"
              @remove-from-team="wizard.assignment.removeFromTeam"
              @confirm-team="wizard.assignment.confirmTeam"
              @unconfirm-team="wizard.assignment.unconfirmTeam"
              @remove-team="wizard.assignment.removeTeam"
              @back-to-players="wizard.step.value = 0"
              @go-to-standings="wizard.step.value = 2"
            />

            <OrganismsTournamentStepPlayers
              v-else
              :players="wizard.players.value ?? []"
              :selected-players="wizard.selectedPlayers.value"
              :available-players="wizard.availablePlayers.value"
              :filtered-available-players="wizard.filteredAvailablePlayers.value"
              :player-search="wizard.playerSearch.value"
              @select-player="wizard.selectPlayer"
              @remove-player="wizard.removePlayer"
              @update:player-search="(v) => { wizard.playerSearch.value = v }"
              @refresh-players="wizard.refreshPlayers()"
              @go-to-teams="wizard.step.value = 1"
            />
          </template>

          <!-- Шаг 2: турнирная таблица -->
          <OrganismsTournamentStepStandings
            v-if="wizard.step.value === 2"
            :tournament-name="wizard.tournamentName.value"
            :tournament-date="wizard.tournamentDate.value"
            :teams="wizard.confirmedTeamsList.value"
            :team-colors="wizard.assignment.teamColors.value"
            :players="wizard.players.value ?? []"
            :assignment-by-player-id="wizard.assignment.assignment.value"
            :initial-snapshot="wizard.standingsSnapshot.value"
            @update:snapshot="wizard.saveStandingsSnapshot"
            @tournament-finished="wizard.resetWizard()"
          />
        </section>
      </main>
    </div>
  </template>

  <!-- Режим зрителя: только просмотр (таблица, составы, матчи). -->
  <OrganismsViewerTournamentViewer
    v-else
    :state="viewerState"
    :players="allPlayers"
  />
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import { useAdminAuth } from '~/composables/useAdminAuth'
import { useTournamentWizard } from '~/composables/useTournamentWizard'
import { useTournamentState } from '~/composables/useTournamentState'

definePageMeta({ layout: 'landing' })

const { isAdmin, logout } = useAdminAuth()

const { serverState, query: stateQuery } = useTournamentState()
await stateQuery.suspense()

const viewerState = computed(() => serverState.value)
const wizard = useTournamentWizard()

const { data: allPlayers } = useFetch<Player[]>('/api/players', {
  default: () => [],
})
</script>
