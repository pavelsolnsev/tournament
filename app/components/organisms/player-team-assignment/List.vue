<!-- Компонент PlayerTeamAssignmentList: две колонки — список команд слева, состав справа. -->
<template>
  <!-- На мобиле — стек; на lg — одинаковая высота колонок, слева шире, чтобы имена команд читались. -->
  <div class="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-stretch">

    <!-- Левая зона: min 22rem, до ~28rem / 36% ширины — раньше w-64 резало названия до «E..» -->
    <div class="min-w-0 lg:flex lg:min-h-0 lg:w-[36%] lg:max-w-[28rem] lg:min-w-[22rem] lg:shrink-0 lg:flex-col">
      <OrganismsPlayerTeamAssignmentTeamsPanel
        class="lg:min-h-0 lg:flex-1"
        :new-team-name-value="newTeamNameValue"
        :all-teams="allTeams"
        :selected-team-name="selectedTeamName"
        :team-player-counts="teamPlayerCounts"
        :is-team-confirmed="isTeamConfirmed"
        :is-auto-team="isAutoTeam"
        :get-team-color="getTeamColor"
        :team-marker="teamMarker"
        @update:new-team-name="emit('update:newTeamName', $event)"
        @add-new-team="emit('addNewTeam')"
        @select-team="selectedTeamName = $event"
        @confirm-team="emit('confirmTeam', $event)"
        @unconfirm-team="emit('unconfirmTeam', $event)"
        @set-team-color="(teamName, colorIndex) => emit('setTeamColor', teamName, colorIndex)"
        @remove-team="onRemoveTeam($event)"
      />
    </div>

    <!-- Правая зона: тянется по высоте вместе с левой колонкой -->
    <div class="min-w-0 flex-1 lg:flex lg:min-h-0 lg:flex-col">
      <OrganismsPlayerTeamAssignmentRosterPanel
        class="lg:min-h-0 lg:flex-1"
        :selected-team-name="selectedTeamName"
        :players="players"
        :get-team="getTeam"
        :team-marker="teamMarker"
        @remove-from-team="emit('removeFromTeam', $event)"
        @set-team="(playerId, teamName) => emit('setTeam', playerId, teamName)"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { MaybeRef, ComputedRef, Ref } from 'vue'
import { computed, ref, unref } from 'vue'
import { useTeamColors } from '~/composables/useTeamColors'
import { dedupeTeamNamesPreservingOrder, normalizeTeamName } from '~/utils/teamNames'

// Здесь создаём команды и распределяем игроков по командам.
const props = defineProps<{
  players: Player[]
  teamOptions: MaybeRef<string[]> | ComputedRef<string[]>
  getTeam: (playerId: number) => string
  newTeamName: MaybeRef<string> | Ref<string>
  confirmedTeamNames: MaybeRef<Set<string>>
  getTeamColor: (teamName: string) => number
  // Набор имён команд, созданных авто-распределением — для визуального разделения.
  autoDistributedNames?: MaybeRef<Set<string>>
}>()

const emit = defineEmits<{
  'update:newTeamName': [value: string]
  setTeam: [playerId: number, teamName: string]
  addNewTeam: []
  removeFromTeam: [playerId: number]
  confirmTeam: [teamName: string]
  unconfirmTeam: [teamName: string]
  setTeamColor: [teamName: string, colorIndex: number]
  removeTeam: [teamName: string]
}>()

const { getMarkerByIndex } = useTeamColors()

function teamMarker(teamName: string): string {
  const colorIndex = Number.isFinite(props.getTeamColor(teamName))
    ? props.getTeamColor(teamName)
    : 0
  return getMarkerByIndex(colorIndex)
}
// Это рисует цветной маркер команды по её сохранённому индексу цвета.

const teamOptionsList = computed(() => unref(props.teamOptions))
// Это список названий команд, который может приходить как ref.

const newTeamNameValue = computed(() => unref(props.newTeamName))
// Это текст для поля "Новая команда", который может приходить как ref.

const confirmedSet = computed(() => unref(props.confirmedTeamNames) ?? new Set<string>())
// Это множество команд, которые уже подтверждены как участники турнира.

const isTeamConfirmed = (name: string) => confirmedSet.value.has(normalizeTeamName(name))
// Это быстрая проверка: команда уже участвует или ещё нет.

const autoSet = computed(() => unref(props.autoDistributedNames) ?? new Set<string>())
// Это набор авто-команд — используем для разделения списка в TeamsPanel.

const isAutoTeam = (name: string) => autoSet.value.has(normalizeTeamName(name))
// Команда создана авто-распределением, если её нормализованное имя есть в autoSet.

const allTeams = computed(() => {
  const list = dedupeTeamNamesPreservingOrder(teamOptionsList.value)
  const confirmed = list.filter((name) => confirmedSet.value.has(normalizeTeamName(name)))
  const others = list.filter((name) => !confirmedSet.value.has(normalizeTeamName(name)))
  return [...confirmed, ...others]
})
// Это сортировка: сначала подтверждённые команды, потом остальные; дублей в списке нет.

const selectedTeamName = ref('')
// Это выбранная команда слева — по ней справа показывается состав.

// Считаем игроков по командам один раз, чтобы список команд не фильтровал игроков в цикле.
const teamPlayerCounts = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {}
  for (const p of props.players) {
    const teamName = props.getTeam(p.id)
    if (!teamName) continue
    counts[teamName] = (counts[teamName] ?? 0) + 1
  }
  return counts
})

function onRemoveTeam(teamName: string) {
  if (selectedTeamName.value === teamName) selectedTeamName.value = ''
  emit('removeTeam', teamName)
}
// Это удаляет команду и сбрасывает выбор, если удалили текущую.
</script>
