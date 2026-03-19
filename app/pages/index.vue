<template>
  <div class="flex min-h-screen flex-col bg-slate-900 text-slate-100 overflow-x-hidden">
    <!-- Этап 0: приветствие -->
    <template v-if="wizard.step.value === 0">
      <div class="relative flex flex-1 min-h-0 flex-col items-center justify-center px-2 sm:px-4 py-8 bg-gradient-to-b from-slate-900 via-slate-800/50 to-slate-900">
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.15),transparent)] pointer-events-none" />
        <main class="relative z-10 text-center max-w-xl mx-auto">
          <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-3">
            Турниры
          </h1>
          <p class="text-slate-400 text-lg sm:text-xl mb-10">
            Организуйте турнир и управляйте им в одном месте
          </p>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl bg-emerald-500 text-slate-900 font-semibold text-lg shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 focus:outline-none"
            @click="wizard.step.value = 1"
          >
            Создать турнир
            <span class="text-xl" aria-hidden="true">→</span>
          </button>
        </main>
      </div>
    </template>

    <!-- Этапы 1–4: мастер создания турнира -->
    <template v-else>
      <main class="mx-auto flex w-full max-w-4xl flex-col gap-4 px-2 py-4 sm:px-4 sm:py-8">
        <section class="rounded-xl bg-slate-900/70 py-2 sm:py-4 space-y-6">
          <!-- Кнопка назад на этапах 1–4 -->
          <div class="flex justify-start">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded text-sm text-slate-400 transition hover:text-slate-200 focus:outline-none"
              @click="wizard.step.value = (Math.max(0, wizard.step.value - 1) as 0 | 1 | 2 | 3 | 4)"
            >
              <span aria-hidden="true">←</span>
              Назад
            </button>
          </div>

          <!-- Этап 1: название и дата -->
          <template v-if="wizard.step.value === 1">
            <OrganismsTournamentStepDetails
              :tournament-name="wizard.tournamentName.value"
              :tournament-date="wizard.tournamentDate.value"
              @update:tournament-name="(v) => { wizard.tournamentName.value = v }"
              @update:tournament-date="(v) => { wizard.tournamentDate.value = v }"
              @next="wizard.goToPlayers"
            />
          </template>

          <!-- Этап 2: выбор игроков и этап 3: распределение по командам -->
          <template v-if="wizard.step.value === 2 || wizard.step.value === 3">
            <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-50">
              {{ wizard.step.value === 2 ? 'Игроки на турнир' : 'Команды' }}
            </h1>
            <p class="text-slate-400 text-sm">
              <span v-if="wizard.tournamentName.value" class="truncate">{{ wizard.tournamentName.value }}</span>
              <span v-if="wizard.tournamentName.value && wizard.tournamentDate.value"> · </span>
              <span v-if="wizard.tournamentDate.value">{{ wizard.tournamentDate.value }}</span>
              <span v-if="!wizard.tournamentName.value && !wizard.tournamentDate.value && wizard.step.value === 2">Название и дата не указаны</span>
            </p>

            <!-- Подэтап: распределение по командам -->
            <template v-if="wizard.step.value === 3">
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
                @back-to-players="wizard.step.value = 2"
                @go-to-standings="wizard.step.value = 4"
              />
            </template>

            <!-- Подэтап: выбор игроков -->
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
                @go-to-teams="wizard.step.value = 3"
              />
            </template>
          </template>

          <!-- Этап 4: турнирная таблица -->
          <template v-if="wizard.step.value === 4">
            <OrganismsTournamentStepStandings
              :tournament-name="wizard.tournamentName.value"
              :tournament-date="wizard.tournamentDate.value"
              :teams="wizard.confirmedTeamsList.value"
              :team-colors="wizard.assignment.teamColors.value"
              :players="wizard.players.value ?? []"
              :assignment-by-player-id="wizard.assignment.assignment.value"
            />
          </template>
        </section>
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useTournamentWizard } from '~/composables/useTournamentWizard'

definePageMeta({ layout: 'landing' })

// Страница только рендерит UI по шагу, а вся логика живёт в composable.
const wizard = useTournamentWizard()
</script>

