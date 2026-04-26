<!-- Компонент StepTeams: шаг распределения выбранных игроков по командам. -->
<template>
  <div class="min-w-0 flex flex-col gap-4">

    <!-- Пустое состояние — нет выбранных игроков -->
    <p
      v-if="selectedPlayers.length === 0"
      class="rounded-xl border border-slate-200 dark:border-slate-700/40 bg-slate-50 dark:bg-slate-800/30 p-4 text-sm text-slate-600 dark:text-slate-400"
    >
      Нет выбранных игроков.
      <button
        type="button"
        class="text-emerald-600 dark:text-emerald-400 underline transition hover:text-emerald-700 dark:hover:text-emerald-300 focus:outline-none rounded"
        @click="emit('backToPlayers')"
      >
        Вернуться к выбору игроков
      </button>.
    </p>

    <template v-else>
      <!-- Авто-распределение — компактная верхняя полоса -->
      <MoleculesRatingDistributionControls
        v-model="teamCountForDistribution"
        :free-players="freePlayers"
        @distribute="onDistribute"
        @remove-free-player="emit('removePlayer', $event)"
      />

      <OrganismsTournamentStepTeamsRostersOverview
        :players="selectedPlayers"
        :team-options="teamOptions"
        :get-team="getTeam"
        :get-team-color="getTeamColor"
        :confirmed-team-names="confirmedTeamNames"
      />

      <!-- Основная зона: команды + состав -->
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

      <!-- Кнопка перехода к турниру — на всю ширину, активна при 2+ подтверждённых командах -->
      <div class="flex flex-col gap-1.5">
        <button
          type="button"
          class="w-full rounded-xl px-5 py-3 text-sm font-semibold transition focus:outline-none"
          :class="confirmedTeamsCount >= 2
            ? 'bg-emerald-500 text-white dark:text-slate-900 md:hover:bg-emerald-400 active:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500/50'
            : 'border border-slate-200 dark:border-transparent bg-slate-100 dark:bg-slate-700/50 text-slate-400 cursor-not-allowed'"
          :disabled="confirmedTeamsCount < 2"
          @click="emit('goToStandings')"
        >
          Переход к турниру
        </button>
        <!-- Подсказка: показываем только когда кнопка задизейблена — объясняем что нужно сделать -->
        <p
          v-if="confirmedTeamsCount < 2"
          class="text-center text-xs text-slate-600 dark:text-slate-500"
        >
          Подтвердите минимум 2 команды чтобы начать турнир
          <span v-if="confirmedTeamsCount === 1">(ещё одну)</span>
          <span v-else-if="confirmedTeamsCount === 0">(пока ни одной)</span>
        </p>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { MaybeRef, ComputedRef, Ref } from 'vue'
import { ref, computed } from 'vue'

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
  /** Убрать игрока из выбранных (из списка свободных на шаге команд). */
  removePlayer: [playerId: number]
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

