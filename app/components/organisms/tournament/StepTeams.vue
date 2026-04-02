<!-- Компонент StepTeams: шаг распределения выбранных игроков по командам. -->
<template>
  <div class="min-w-0">
    <p
      v-if="selectedPlayers.length === 0"
      class="rounded-xl bg-slate-800/50 p-4 text-slate-500 text-sm"
    >
      Нет выбранных игроков.
      <button
        type="button"
        class="text-emerald-400 underline transition md:hover:text-emerald-300 focus:outline-none rounded"
        @click="emit('backToPlayers')"
      >
        Вернуться к выбору игроков
      </button>.
    </p>
    <template v-else>
      <p class="text-slate-400 text-sm mb-2">
        Создайте команды и добавляйте в них игроков.
      </p>

      <!-- Панель авто-распределения по рейтингу -->
      <MoleculesRatingDistributionControls
        v-model="teamCountForDistribution"
        :free-players="freePlayers"
        class="mb-3"
        @distribute="onDistribute"
      />

      <OrganismsPlayerTeamAssignmentList
        :players="selectedPlayers"
        :team-options="teamOptions"
        :get-team="getTeam"
        :get-team-color="getTeamColor"
        :new-team-name="newTeamName"
        :confirmed-team-names="confirmedTeamNames"
        :auto-distributed-names="autoDistributedNames"
        @update:new-team-name="(v) => emit('update:newTeamName', v)"
        @set-team="(playerId, teamName) => emit('setTeam', playerId, teamName)"
        @set-team-color="(teamName, colorIndex) => emit('setTeamColor', teamName, colorIndex)"
        @add-new-team="emit('addNewTeam')"
        @remove-from-team="emit('removeFromTeam', $event)"
        @confirm-team="emit('confirmTeam', $event)"
        @unconfirm-team="emit('unconfirmTeam', $event)"
        @remove-team="emit('removeTeam', $event)"
      />
      <div class="pt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          class="w-full rounded-xl px-4 py-3 font-semibold transition focus:outline-none sm:w-auto sm:min-w-[220px]"
          :class="confirmedTeamsCount >= 2
            ? 'bg-emerald-500 text-white dark:text-slate-900 md:hover:bg-emerald-400 active:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500/50'
            : 'border border-slate-300 dark:border-transparent bg-white dark:bg-slate-700 text-slate-400 cursor-not-allowed'"
          :disabled="confirmedTeamsCount < 2"
          @click="emit('goToStandings')"
        >
          Турнирная таблица →
        </button>
        <p v-if="confirmedTeamsCount < 2" class="text-xs text-slate-400 dark:text-slate-500">
          Нужно минимум две команды-участника.
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { MaybeRef, ComputedRef, Ref } from 'vue'
import { ref, computed, unref } from 'vue'

// Этот шаг распределяет игроков по командам.
const props = defineProps<{
  selectedPlayers: Player[]
  teamOptions: MaybeRef<string[]> | ComputedRef<string[]>
  getTeam: (playerId: number) => string
  getTeamColor: (teamName: string) => number
  newTeamName: MaybeRef<string> | Ref<string>
  confirmedTeamNames: MaybeRef<Set<string>>
  confirmedTeamsCount: number
  // Имена команд, созданных авто-распределением — для визуального разделения.
  autoDistributedNames?: MaybeRef<Set<string>>
}>()

const emit = defineEmits<{
  'update:newTeamName': [value: string]
  setTeam: [playerId: number, teamName: string]
  setTeamColor: [teamName: string, colorIndex: number]
  addNewTeam: []
  removeFromTeam: [playerId: number]
  confirmTeam: [teamName: string]
  unconfirmTeam: [teamName: string]
  removeTeam: [teamName: string]
  backToPlayers: []
  goToStandings: []
  autoDistribute: [teamCount: number]
}>()

// Количество команд для авто-распределения (2–4).
const teamCountForDistribution = ref(2)

// Свободные игроки — те, кто ещё не попал ни в одну команду.
const freePlayers = computed(() =>
  props.selectedPlayers.filter((p) => !props.getTeam(p.id)),
)

// Запускаем авто-распределение — пробрасываем наверх с выбранным количеством команд.
function onDistribute() {
  emit('autoDistribute', teamCountForDistribution.value)
}
</script>

