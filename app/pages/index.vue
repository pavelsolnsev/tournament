<template>
  <div class="flex min-h-screen flex-col bg-slate-900 text-slate-100 overflow-x-hidden">
    <main class="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-4 px-2 py-4 sm:px-4 sm:py-8">
      <section class="min-w-0 space-y-6 rounded-xl bg-slate-900/70 py-2 sm:py-4">
        <!-- Назад только после шага игроков: с главного экрана уходить некуда. -->
        <div v-if="wizard.step.value > 0" class="flex justify-start">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded text-sm text-slate-400 transition hover:text-slate-200 focus:outline-none"
            @click="wizard.step.value = (wizard.step.value - 1) as 0 | 1 | 2"
          >
            <span aria-hidden="true">←</span>
            Назад
          </button>
        </div>

        <!-- Шаги 0–1: игроки и команды с общим заголовком. -->
        <template v-if="wizard.step.value === 0 || wizard.step.value === 1">
          <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-50">
            {{ wizard.step.value === 0 ? 'Игроки на турнир' : 'Команды' }}
          </h1>

          <template v-if="wizard.step.value === 1">
            <OrganismsTournamentStepTeams
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
          </template>

          <template v-else>
            <OrganismsTournamentStepPlayers
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
        </template>

        <!-- Шаг 2: турнирная таблица. -->
        <template v-if="wizard.step.value === 2">
          <OrganismsTournamentStepStandings
            :tournament-name="wizard.tournamentName.value"
            :tournament-date="wizard.tournamentDate.value"
            :teams="wizard.confirmedTeamsList.value"
            :team-colors="wizard.assignment.teamColors.value"
            :players="wizard.players.value ?? []"
            :assignment-by-player-id="wizard.assignment.assignment.value"
            :initial-snapshot="wizard.standingsSnapshot.value"
            @update:snapshot="wizard.saveStandingsSnapshot"
          />
        </template>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useTournamentWizard } from '~/composables/useTournamentWizard'

definePageMeta({ layout: 'landing' })

const wizard = useTournamentWizard()
</script>
