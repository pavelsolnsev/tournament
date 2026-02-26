<template>
  <div class="min-h-screen overflow-x-hidden py-4 sm:py-6 sm:py-8">
    <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-50 mb-6">
      Игроки на турнир
    </h1>

    <section class="mb-6 rounded-xl bg-slate-800/50 p-2 sm:p-4 sm:p-5">
      <div class="mb-4 min-w-0">
        <p v-if="tournamentName" class="truncate text-slate-200 font-medium">
          {{ tournamentName }}
        </p>
        <p v-if="tournamentDate" class="truncate text-slate-400 text-sm">
          {{ tournamentDate }}
        </p>
        <p v-if="!tournamentName && !tournamentDate" class="text-slate-500 text-sm">
          Название и дата не указаны
        </p>
      </div>

      <template v-if="showDistribution">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h2 class="text-sm font-semibold text-slate-400">
            Распределение по командам
          </h2>
          <button
            type="button"
            class="shrink-0 text-sm text-slate-400 underline hover:text-slate-200"
            @click="backToPlayers"
          >
            ← Назад к списку игроков
          </button>
        </div>
        <p class="mb-4 text-slate-400 text-sm">
          Выберите команду из базы или создайте новую для каждого игрока.
        </p>
        <OrganismsPlayerTeamAssignmentList
          :players="selectedPlayers"
          :team-options="assignment.teamOptions"
          :get-team="assignment.getTeam"
          :new-team-input-for-player="assignment.newTeamInputForPlayer"
          :new-team-name="assignment.newTeamName"
          @update:new-team-name="(v) => { assignment.newTeamName.value = v }"
          @set-team="assignment.setTeam"
          @confirm-new-team="assignment.confirmNewTeam"
          @close-new-team-input="assignment.closeNewTeamInput"
        />
      </template>

      <template v-else>
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
              @click="goToTeams"
            >
              Распределить по командам →
            </button>
          </div>
        </template>
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
  </div>
</template>

<script setup lang="ts">
import type { Player, Team } from '~/types/tournament'

definePageMeta({ layout: 'default' })

const route = useRoute()
const tournamentName = computed(() => (route.query.tournamentName as string) || '')
const tournamentDate = computed(() => (route.query.tournamentDate as string) || '')

const { data: players, refresh: refreshPlayers } = await useFetch<Player[]>('/api/players', {
  default: () => [],
})
const { data: teamsFromApi } = await useFetch<Team[]>('/api/teams', { default: () => [] })

const existingTeamNames = computed(() => (teamsFromApi.value ?? []).map((t) => t.name))
const assignment = useTeamAssignment(existingTeamNames)

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

const showDistribution = ref(false)
function goToTeams() {
  showDistribution.value = true
}
function backToPlayers() {
  showDistribution.value = false
}
</script>
