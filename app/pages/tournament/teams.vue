<template>
  <div class="min-h-screen overflow-x-hidden py-4 sm:py-6 sm:py-8">
    <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-50 mb-2">
      Команды
    </h1>
    <p class="text-slate-400 text-sm mb-6">
      <span v-if="tournamentName" class="truncate">{{ tournamentName }}</span>
      <span v-if="tournamentName && tournamentDate"> · </span>
      <span v-if="tournamentDate">{{ tournamentDate }}</span>
      <span v-if="!tournamentName && !tournamentDate">Назначьте игроков командам</span>
    </p>

    <p
      v-if="selectedPlayers.length === 0"
      class="rounded-xl bg-slate-800/50 p-4 text-slate-500 text-sm"
    >
      Нет выбранных игроков.
      <NuxtLink
        :to="{
          path: '/tournament/players',
          query: {
            tournamentName: tournamentName || undefined,
            tournamentDate: tournamentDate || undefined,
          },
        }"
        class="text-emerald-400 underline"
      >
        Вернуться к выбору игроков
      </NuxtLink>.
    </p>

    <div v-else class="space-y-4">
      <p class="text-slate-400 text-sm">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player, Team } from '~/types/tournament'

definePageMeta({ layout: 'default' })

const route = useRoute()
const tournamentName = computed(() => (route.query.tournamentName as string) || '')
const tournamentDate = computed(() => (route.query.tournamentDate as string) || '')

const playerIdsParam = computed(() => (route.query.playerIds as string) || '')
const playerIds = computed(() => {
  const s = playerIdsParam.value.trim()
  if (!s) return []
  return s.split(',').map((id) => Number(id)).filter((id) => Number.isFinite(id))
})

const { data: allPlayers } = await useFetch<Player[]>('/api/players', { default: () => [] })
const { data: teamsFromApi } = await useFetch<Team[]>('/api/teams', { default: () => [] })

const selectedPlayers = computed(() => {
  const list = allPlayers.value ?? []
  const ids = new Set(playerIds.value)
  return list.filter((p) => ids.has(p.id))
})

const existingTeamNames = computed(() => (teamsFromApi.value ?? []).map((t) => t.name))
const assignment = useTeamAssignment(existingTeamNames)
</script>
