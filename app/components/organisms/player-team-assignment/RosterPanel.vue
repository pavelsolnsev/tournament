<!-- Компонент RosterPanel: состав и свободные игроки на общих атомах списка и полей. -->
<template>
  <AtomsTournamentPanel as="section" root-class="min-w-0 lg:col-span-3">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <AtomsPanelHeading>Состав</AtomsPanelHeading>
      </div>

      <div v-if="selectedTeamName" class="shrink-0 text-right">
        <p class="text-xs text-slate-400">
          Команда
        </p>
        <p class="max-w-full min-w-0 truncate text-sm font-semibold text-slate-100 sm:max-w-[14rem]">
          {{ teamMarker(selectedTeamName) }} {{ selectedTeamName }}
        </p>
      </div>
    </div>

    <AtomsEmptyStateBox v-if="!selectedTeamName" align="center" size="sm" root-class="py-6">
      Выберите команду слева.
    </AtomsEmptyStateBox>

    <template v-else>
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-xl border border-slate-800/50 bg-slate-900/30 p-2 sm:p-3">
          <h4 class="mb-2 text-xs font-semibold text-slate-300">
            В команде
          </h4>

          <AtomsPlayerListUl v-if="playersInTeam.length > 0">
            <MoleculesPlayerListRow
              v-for="p in playersInTeam"
              :key="p.id"
              :label="displayPlayerLabel(p)"
              :title="'Убрать из команды: ' + displayPlayerLabel(p)"
              action="remove"
              @activate="emit('removeFromTeam', p.id)"
            />
          </AtomsPlayerListUl>

          <p v-else class="rounded bg-slate-800/30 px-2 py-2 text-xs text-slate-500">
            Пусто. Добавьте игроков справа.
          </p>
        </div>

        <div class="rounded-xl border border-slate-800/50 bg-slate-900/30 p-2 sm:p-3">
          <div class="mb-2 flex items-center justify-between gap-2">
            <h4 class="text-xs font-semibold text-slate-300">
              Свободные игроки
            </h4>

            <AtomsTournamentTextInput
              v-model="unassignedSearch"
              variant="search"
              size="xs"
              placeholder="Поиск…"
              :block="false"
              input-class="w-32"
            />
          </div>

          <AtomsPlayerListUl v-if="filteredUnassignedPlayers.length > 0">
            <MoleculesPlayerListRow
              v-for="p in filteredUnassignedPlayers"
              :key="p.id"
              :label="displayPlayerLabel(p)"
              :title="'Добавить в команду: ' + displayPlayerLabel(p)"
              action="add"
              @activate="emit('setTeam', p.id, selectedTeamName)"
            />
          </AtomsPlayerListUl>

          <p v-else class="rounded bg-slate-800/30 px-2 py-2 text-xs text-slate-500">
            Все игроки распределены по командам.
          </p>
        </div>
      </div>
    </template>
  </AtomsTournamentPanel>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import { computed, ref } from 'vue'
import { usePlayerDisplay } from '~/composables/usePlayerDisplay'

const props = defineProps<{
  selectedTeamName: string
  players: Player[]
  getTeam: (playerId: number) => string
  teamMarker: (teamName: string) => string
}>()

const emit = defineEmits<{
  removeFromTeam: [playerId: number]
  setTeam: [playerId: number, teamName: string]
}>()

const { displayPlayerLabel } = usePlayerDisplay()

const unassignedSearch = ref('')

const playersInTeam = computed(() => {
  const name = props.selectedTeamName
  if (!name) return []
  return props.players.filter((p) => props.getTeam(p.id) === name)
})

const unassignedPlayers = computed(() =>
  props.players.filter((p) => !props.getTeam(p.id)),
)

const filteredUnassignedPlayers = computed(() => {
  const term = unassignedSearch.value.trim().toLowerCase()
  if (!term) return unassignedPlayers.value
  const normalized = term.replace(/^@/, '')
  return unassignedPlayers.value.filter((p) => {
    const name = (p.name || '').toLowerCase()
    const username = (p.username || '').replace(/^@/, '').toLowerCase()
    return name.includes(term) || (!!username && username.includes(normalized))
  })
})
</script>
