<!-- Компонент RosterPanel: состав и свободные игроки на общих атомах списка и полей. -->
<template>
  <AtomsTournamentPanel as="section" root-class="min-w-0 lg:col-span-3">

    <!-- Пустое состояние — ни одна команда не выбрана -->
    <AtomsEmptyStateBox v-if="!selectedTeamName" align="center" size="sm" root-class="py-8">
      ← Выберите команду
    </AtomsEmptyStateBox>

    <template v-else>
      <!-- Заголовок: маркер + название выбранной команды слева, счётчик игроков справа -->
      <div class="mb-4 flex min-w-0 items-center justify-between gap-3">
        <p class="min-w-0 truncate text-sm font-semibold text-slate-100">
          {{ teamMarker(selectedTeamName) }} {{ selectedTeamName }}
        </p>
        <span class="shrink-0 rounded-full bg-slate-800/60 px-2.5 py-0.5 text-xs text-slate-400">
          {{ playersInTeam.length }} / {{ players.length }}
        </span>
      </div>

      <!-- Два столбца: «В команде» и «Свободные игроки» -->
      <div class="grid gap-4 sm:grid-cols-2">

        <!-- Левый блок: игроки, назначенные в эту команду -->
        <div class="flex flex-col gap-2 rounded-xl border border-slate-800/50 bg-slate-900/30 p-3">
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-400">В команде</h4>
            <span class="text-xs tabular-nums text-slate-500">{{ playersInTeam.length }}</span>
          </div>

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

          <!-- Подсказка при пустой команде — приглашение добавить -->
          <p v-else class="flex-1 rounded-lg bg-slate-800/20 px-3 py-4 text-center text-xs text-slate-500">
            Добавьте игроков →
          </p>
        </div>

        <!-- Правый блок: нераспределённые игроки с поиском -->
        <div class="flex flex-col gap-2 rounded-xl border border-slate-800/50 bg-slate-900/30 p-3">
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-400">Свободные</h4>
            <span class="text-xs tabular-nums text-slate-500">{{ unassignedPlayers.length }}</span>
          </div>

          <!-- Поиск только когда есть из кого выбирать -->
          <AtomsTournamentTextInput
            v-if="unassignedPlayers.length > 0"
            v-model="unassignedSearch"
            variant="search"
            size="xs"
            placeholder="Поиск…"
          />

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

          <!-- Пустое состояние: нет результатов поиска -->
          <p v-else-if="unassignedSearch" class="flex-1 rounded-lg bg-slate-800/20 px-3 py-4 text-center text-xs text-slate-500">
            Никого не найдено.
          </p>

          <!-- Пустое состояние: все распределены -->
          <p v-else class="flex-1 rounded-lg bg-slate-800/20 px-3 py-4 text-center text-xs text-slate-500">
            Все игроки распределены.
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
