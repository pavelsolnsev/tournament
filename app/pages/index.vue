<template>
  <div
    class="flex flex-col bg-slate-900 text-slate-100"
    :class="step === 0 ? 'h-screen overflow-hidden' : 'min-h-screen'"
  >
    <!-- Этап 0: приветствие -->
    <template v-if="step === 0">
      <div class="flex flex-1 min-h-0 flex-col items-center justify-center px-2 sm:px-4 py-8 bg-gradient-to-b from-slate-900 via-slate-800/50 to-slate-900">
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
            class="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl bg-emerald-500 text-slate-900 font-semibold text-lg shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            @click="step = 1"
          >
            Создать турнир
            <span class="text-xl" aria-hidden="true">→</span>
          </button>
        </main>
      </div>
    </template>

    <!-- Этапы 1–3: форма -->
    <template v-else>
      <main class="mx-auto flex w-full max-w-4xl flex-col gap-4 px-2 py-4 sm:px-4 sm:py-8">
        <section class="rounded-xl bg-slate-900/70 py-2 sm:py-4 space-y-6">
          <!-- Кнопка назад на этапах 1–4 -->
          <div class="flex justify-start">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded text-sm text-slate-400 transition hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              @click="step = (Math.max(0, step - 1) as 0 | 1 | 2 | 3 | 4)"
            >
              <span aria-hidden="true">←</span>
              Назад
            </button>
          </div>

          <!-- Этап 1: название и дата -->
          <template v-if="step === 1">
            <OrganismsTournamentStepDetails
              :tournament-name="tournamentName"
              :tournament-date="tournamentDate"
              @update:tournament-name="(v) => { tournamentName = v }"
              @update:tournament-date="(v) => { tournamentDate = v }"
              @next="goToPlayers"
            />
          </template>

          <!-- Этап 2: выбор игроков и этап 3: распределение по командам -->
          <template v-if="step === 2 || step === 3">
            <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-50">
              {{ step === 2 ? 'Игроки на турнир' : 'Команды' }}
            </h1>
            <p class="text-slate-400 text-sm">
              <span v-if="tournamentName" class="truncate">{{ tournamentName }}</span>
              <span v-if="tournamentName && tournamentDate"> · </span>
              <span v-if="tournamentDate">{{ tournamentDate }}</span>
              <span v-if="!tournamentName && !tournamentDate && step === 2">Название и дата не указаны</span>
              <span v-if="!tournamentName && !tournamentDate && step === 3">Назначьте игроков командам</span>
            </p>

            <!-- Подэтап: распределение по командам -->
            <template v-if="step === 3">
              <p
                v-if="selectedPlayers.length === 0"
                class="rounded-xl bg-slate-800/50 p-4 text-slate-500 text-sm"
              >
                Нет выбранных игроков.
                <button
                  type="button"
                  class="text-emerald-400 underline transition hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded"
                  @click="step = 2"
                >
                  Вернуться к выбору игроков
                </button>.
              </p>
              <template v-else>
                <p class="text-slate-400 text-sm mb-2">
                  Создайте команды и добавляйте в них игроков.
                </p>
                <OrganismsPlayerTeamAssignmentList
                  :players="selectedPlayers"
                  :team-options="assignment.teamOptions"
                  :get-team="assignment.getTeam"
                  :get-team-color="assignment.getTeamColor"
                  :new-team-name="assignment.newTeamName"
                  :confirmed-team-names="assignment.confirmedTeamNames"
                  @update:new-team-name="(v) => { assignment.newTeamName.value = v }"
                  @set-team="assignment.setTeam"
                  @set-team-color="assignment.setTeamColor"
                  @add-new-team="onAddNewTeam"
                  @remove-from-team="assignment.removeFromTeam"
                  @confirm-team="assignment.confirmTeam"
                  @unconfirm-team="assignment.unconfirmTeam"
                />
                <div v-if="confirmedTeamsList.length >= 2" class="pt-2">
                  <button
                    type="button"
                    class="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 sm:w-auto sm:min-w-[220px]"
                    @click="step = 4"
                  >
                    Турнирная таблица →
                  </button>
                </div>
              </template>
            </template>

            <!-- Подэтап: выбор игроков -->
            <template v-else>
              <section class="mb-6 rounded-xl bg-slate-800/50 p-2 sm:p-4 sm:p-5">
                <h2 class="text-sm font-semibold text-slate-400 mb-2">
                  Выбранные игроки (клик — убрать)
                </h2>
                <div
                  v-if="selectedPlayers.length === 0"
                  class="rounded-lg bg-slate-800/30 px-3 py-4 sm:px-4 sm:py-6 text-center text-slate-500 text-sm"
                >
                  Выберите игроков из списка ниже — клик по игроку добавит его сюда
                </div>
                <template v-else>
                  <MoleculesSelectedPlayersChips :players="selectedPlayers" @remove="removePlayer" />
                  <div class="mt-4">
                    <button
                      type="button"
                      class="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 sm:w-auto sm:min-w-[220px]"
                      @click="step = 3"
                    >
                      Распределить по командам →
                    </button>
                  </div>
                </template>
              </section>

              <OrganismsPlayerCreateForm @created="refreshPlayers()" />

              <OrganismsAvailablePlayersList
                :players="players ?? []"
                :filtered-players="filteredAvailablePlayers"
                v-model:search-query="playerSearch"
                :all-selected="availablePlayers.length === 0"
                @select="selectPlayer"
              />
            </template>
          </template>

          <!-- Этап 4: турнирная таблица -->
          <template v-if="step === 4">
            <OrganismsTournamentStepStandings
              :tournament-name="tournamentName"
              :tournament-date="tournamentDate"
              :teams="confirmedTeamsList"
              :team-colors="assignment.teamColors.value"
            />
          </template>
        </section>
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Player, Team } from '~/types/tournament'

definePageMeta({ layout: 'landing' })

type SavedTournamentContext = {
  step: number
  tournamentName: string
  tournamentDate: string
  selectedIds: number[]
  assignmentByPlayerId: Record<number, string>
  confirmedTeamNames: string[]
  teamColors: Record<string, number>
}

const step = ref<0 | 1 | 2 | 3 | 4>(0)
const tournamentName = ref('')
const tournamentDate = ref('')

watch(step, (s) => {
  setPageLayout(s === 0 ? 'landing' : 'default')
}, { immediate: true })

function goToPlayers() {
  step.value = 2
}

const { data: players, refresh: refreshPlayers } = await useFetch<Player[]>('/api/players', {
  default: () => [],
})
const { data: teamsFromApi } = await useFetch<Team[]>('/api/teams', { default: () => [] })

const existingTeamNames = computed(() => (teamsFromApi.value ?? []).map((t) => t.name))
const assignment = useTeamAssignment(existingTeamNames)

const confirmedTeamsList = computed(() => Array.from(assignment.confirmedTeamNames.value))

const selectedIds = ref<Set<number>>(new Set())
const selectedPlayers = computed(() => {
  const list = players.value ?? []
  return list.filter(p => selectedIds.value.has(p.id))
})
const availablePlayers = computed(() => {
  const list = players.value ?? []
  return list.filter(p => !selectedIds.value.has(p.id))
})

const playerSearch = ref('')
const filteredAvailablePlayers = computed(() => {
  const list = availablePlayers.value
  const term = playerSearch.value.trim().toLowerCase()
  if (term.length < 3) return list
  const normalized = term.replace(/^@/, '')
  return list.filter((p) => {
    const name = p.name.toLowerCase()
    const username = (p.username || '').replace(/^@/, '').toLowerCase()
    return name.includes(term) || (!!username && username.includes(normalized))
  })
})

function selectPlayer(id: number) {
  const next = new Set(selectedIds.value)
  next.add(id)
  selectedIds.value = next
}

function removePlayer(id: number) {
  const next = new Set(selectedIds.value)
  next.delete(id)
  selectedIds.value = next
}

function onAddNewTeam() {
  assignment.addNewTeam(assignment.newTeamName.value)
  assignment.newTeamName.value = ''
}

const contextCookie = useCookie<SavedTournamentContext | null>('tournament-context', {
  default: () => null,
  // Храним состояние турнира 30 дней
  maxAge: 60 * 60 * 24 * 30,
})

if (contextCookie.value) {
  const ctx = contextCookie.value
  const restoredStep = Math.min(4, Math.max(0, ctx.step))
  step.value = restoredStep as 0 | 1 | 2 | 3 | 4
  tournamentName.value = ctx.tournamentName ?? ''
  tournamentDate.value = ctx.tournamentDate ?? ''
  selectedIds.value = new Set((ctx.selectedIds ?? []).filter((id) => Number.isFinite(id)))
  assignment.assignment.value = ctx.assignmentByPlayerId ?? {}
  assignment.confirmedTeamNames.value = new Set(ctx.confirmedTeamNames ?? [])
  assignment.teamColors.value = ctx.teamColors ?? {}
}

const savedContext = computed<SavedTournamentContext>(() => ({
  step: step.value,
  tournamentName: tournamentName.value,
  tournamentDate: tournamentDate.value,
  selectedIds: Array.from(selectedIds.value),
  assignmentByPlayerId: assignment.assignment.value,
  confirmedTeamNames: Array.from(assignment.confirmedTeamNames.value),
  teamColors: assignment.teamColors.value,
}))

watch(savedContext, (val) => {
  contextCookie.value = val
}, { deep: true })
</script>
