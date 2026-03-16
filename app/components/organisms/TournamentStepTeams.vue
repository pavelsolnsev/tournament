<template>
  <div>
    <p
      v-if="selectedPlayers.length === 0"
      class="rounded-xl bg-slate-800/50 p-4 text-slate-500 text-sm"
    >
      Нет выбранных игроков.
      <button
        type="button"
        class="text-emerald-400 underline transition hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded"
        @click="emit('backToPlayers')"
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
        :team-options="teamOptions"
        :get-team="getTeam"
        :get-team-color="getTeamColor"
        :new-team-name="newTeamName"
        :confirmed-team-names="confirmedTeamNames"
        @update:new-team-name="(v) => emit('update:newTeamName', v)"
        @set-team="emit('setTeam', $event[0], $event[1])"
        @set-team-color="emit('setTeamColor', $event[0], $event[1])"
        @add-new-team="emit('addNewTeam')"
        @remove-from-team="emit('removeFromTeam', $event)"
        @confirm-team="emit('confirmTeam', $event)"
        @unconfirm-team="emit('unconfirmTeam', $event)"
      />
      <div v-if="confirmedTeamsCount >= 2" class="pt-2">
        <button
          type="button"
          class="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 sm:w-auto sm:min-w-[220px]"
          @click="emit('goToStandings')"
        >
          Турнирная таблица →
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { MaybeRef, ComputedRef, Ref } from 'vue'

const props = defineProps<{
  selectedPlayers: Player[]
  teamOptions: MaybeRef<string[]> | ComputedRef<string[]>
  getTeam: (playerId: number) => string
  getTeamColor: (teamName: string) => number
  newTeamName: MaybeRef<string> | Ref<string>
  confirmedTeamNames: MaybeRef<Set<string>>
  confirmedTeamsCount: number
}>()

const emit = defineEmits<{
  'update:newTeamName': [value: string]
  setTeam: [playerId: number, teamName: string]
  setTeamColor: [teamName: string, colorIndex: number]
  addNewTeam: []
  removeFromTeam: [playerId: number]
  confirmTeam: [teamName: string]
  unconfirmTeam: [teamName: string]
  backToPlayers: []
  goToStandings: []
}>()
</script>

