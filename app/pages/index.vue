<template>
  <!-- Режим администратора: полный интерфейс управления турниром. -->
  <template v-if="isAdmin">
    <div class="flex min-h-screen flex-col bg-slate-900 text-slate-100 overflow-x-hidden">
      <main class="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-4 px-2 py-4 sm:px-4 sm:py-8">

        <!-- Спиннер пока состояние турнира загружается из базы. -->
        <template v-if="!wizard.stateRestored.value">
          <div class="flex items-center justify-center py-16">
            <div class="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500" />
          </div>
        </template>

        <!-- Основной интерфейс администратора показывается только после загрузки состояния. -->
        <template v-else>

          <!-- Шапка администратора: название режима + кнопка выхода. -->
          <div class="flex items-center justify-between gap-4 rounded-xl bg-slate-800/50 border border-slate-700/40 px-4 py-2.5">
            <span class="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
              <!-- Зелёная точка — признак режима администратора. -->
              <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              Режим администратора
            </span>
            <button
              type="button"
              class="text-xs text-slate-500 hover:text-slate-300 transition focus:outline-none"
              @click="logout"
            >
              Выйти
            </button>
          </div>

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
                @tournament-finished="wizard.resetWizard()"
              />
            </template>
          </section>

        </template>
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

// isAdmin читается из cookie на SSR — значение одинаково на сервере и клиенте.
const { isAdmin, logout } = useAdminAuth()

// Загружаем состояние турнира (для зрителя и wizard).
const { serverState, query: stateQuery } = useTournamentState()
await stateQuery.suspense()

// Состояние для компонента зрителя.
const viewerState = computed(() => serverState.value)

// Данные мастера турнира — используются только в режиме администратора.
const wizard = useTournamentWizard()

// Все игроки из базы — нужны зрителю для отображения составов.
const { data: allPlayers } = useFetch<Player[]>('/api/players', {
  default: () => [],
})
</script>
