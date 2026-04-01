<template>
  <!-- h-full продолжает цепочку высоты от #scroll-root → landing → сюда. -->
  <div class="h-full">
    <!-- clientReady становится true только после монтирования на клиенте.
         До этого рендерим нейтральный скелетон — он совпадает с SSR и не даёт hydration mismatch. -->
    <div v-if="!clientReady" class="bg-slate-900" aria-hidden="true" />

    <!-- После монтирования на клиенте показываем реальный UI -->
    <template v-else>
      <!-- Режим администратора -->
      <template v-if="isAdmin">
        <!-- min-h-full растягивает до высоты #scroll-root (= весь экран). -->
        <div class="flex min-h-full flex-col">
          <header class="absolute inset-x-0 top-0 z-20 border-b border-slate-800/70 bg-slate-900/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
            <div class="mx-auto flex w-full min-w-0 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6 h-14">
              <span class="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <span class="inline-block h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                Администратор
              </span>
              <button
                type="button"
                class="inline-flex h-11 items-center rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100 active:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                @click="logout"
              >
                Выйти
              </button>
            </div>
          </header>

          <!-- flex-1 растягивает main; pt — отступ под абсолютный header. Контент идёт сверху. -->
          <main class="mx-auto flex w-full min-w-0 max-w-4xl flex-1 flex-col px-4 sm:px-6 pt-[calc(theme(spacing.14)+env(safe-area-inset-top))]">
            <div v-if="!wizard.stateRestored.value" class="flex items-center gap-3 py-8 text-sm text-slate-400">
              <div class="h-9 w-9 shrink-0 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500" />
              <span>Загружаем…</span>
            </div>

            <section v-else class="flex w-full flex-col gap-6 py-5 sm:py-8">
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

              <template v-if="wizard.step.value === 0 || wizard.step.value === 1">
                <h1 class="text-2xl font-bold text-slate-50 sm:text-3xl">
                  {{ wizard.step.value === 0 ? 'Выберите игроков' : 'Команды' }}
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
                @tournament-cleared="wizard.resetWizard()"
              />
            </section>
          </main>
        </div>
      </template>

      <!-- Режим зрителя -->
      <OrganismsViewerTournamentViewer
        v-else
        :state="viewerState"
        :players="allPlayers"
      />
    </template>

</div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import { useAdminAuth } from '~/composables/useAdminAuth'
import { useTournamentWizard } from '~/composables/useTournamentWizard'
import { useTournamentState } from '~/composables/useTournamentState'

definePageMeta({ layout: 'landing' })

const { isAdmin, logout } = useAdminAuth()

// clientReady становится true только после монтирования.
// До этого рендерим пустой div — он совпадает с SSR и не даёт hydration mismatch.
const clientReady = ref(false)
onMounted(() => {
  // Явно читаем cookie на клиенте: useCookie при гидрации может вернуть undefined
  // в первый тик, поэтому синхронизируем isAdmin вручную из document.cookie.
  const match = document.cookie.match(/(?:^|; )admin_session=([^;]*)/)
  const cookieValue = match ? decodeURIComponent(match[1] ?? '') : ''
  isAdmin.value = cookieValue === 'true'
  clientReady.value = true
})

const { serverState, query: stateQuery } = useTournamentState()
await stateQuery.suspense()

const viewerState = computed(() => serverState.value)
const wizard = useTournamentWizard()

const { data: allPlayers } = useFetch<Player[]>('/api/players', {
  default: () => [],
})
</script>
