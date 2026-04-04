<!-- Компонент RosterPanel: состав выбранной команды и пул свободных игроков. -->
<template>
  <AtomsTournamentPanel
    as="section"
    root-class="min-w-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col"
  >

    <!-- Пустое состояние — никакая команда не выбрана -->
    <AtomsEmptyStateBox
      v-if="!selectedTeamName"
      align="center"
      size="sm"
      root-class="py-10 lg:flex lg:flex-1 lg:items-center lg:justify-center"
    >
      ← Выберите команду слева
    </AtomsEmptyStateBox>

    <template v-else>
      <div class="flex min-h-0 flex-1 flex-col gap-4 lg:min-h-0">

      <!-- Шапка панели: маркер + имя команды + счётчик игроков -->
      <div class="flex min-w-0 shrink-0 items-center justify-between gap-3">
        <h2 class="min-w-0 text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100 line-clamp-2 break-words">
          {{ teamMarker(selectedTeamName) }} {{ selectedTeamName }}
        </h2>
        <span class="shrink-0 rounded-full bg-slate-200 dark:bg-slate-700/60 px-2.5 py-0.5 text-xs tabular-nums text-slate-600 dark:text-slate-400">
          {{ playersInTeam.length }}&thinsp;/&thinsp;{{ players.length }}
        </span>
      </div>

      <!-- Два столбца: на lg тянутся по высоте, списки скроллятся внутри -->
      <div class="grid min-h-0 flex-1 gap-3 sm:grid-cols-2 lg:min-h-0">

        <!-- Левый блок: игроки в команде -->
        <div class="flex min-h-[12rem] flex-col gap-2 lg:min-h-0 lg:h-full">
          <!-- Заголовок блока с цифрой -->
          <div class="flex shrink-0 items-center justify-between gap-2 px-0.5">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">В команде</h3>
            <span class="text-xs tabular-nums text-slate-600 dark:text-slate-500">{{ playersInTeam.length }}</span>
          </div>

          <!-- Список или подсказка -->
          <div class="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/30 p-2">
            <AtomsPlayerListUl v-if="playersInTeam.length > 0">
              <MoleculesPlayerListRow
                v-for="p in playersInTeam"
                :key="p.id"
                v-bind="rosterRowBind(p, 'Убрать из команды: ')"
                action="remove"
                @activate="emit('removeFromTeam', p.id)"
              />
            </AtomsPlayerListUl>
            <p v-else class="px-2 py-4 text-center text-xs text-slate-600 dark:text-slate-500">
              Добавьте игроков
            </p>
          </div>
        </div>

        <!-- Правый блок: нераспределённые игроки с поиском -->
        <div class="flex min-h-[12rem] flex-col gap-2 lg:min-h-0 lg:h-full">
          <!-- Заголовок блока с цифрой -->
          <div class="flex shrink-0 items-center justify-between gap-2 px-0.5">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Свободные</h3>
            <span class="text-xs tabular-nums text-slate-600 dark:text-slate-500">{{ unassignedPlayers.length }}</span>
          </div>

          <!-- Поиск — показываем только когда есть кто-то свободный -->
          <AtomsTournamentTextInput
            v-if="unassignedPlayers.length > 0"
            v-model="unassignedSearch"
            variant="search"
            size="xs"
            placeholder="Поиск…"
            class="shrink-0"
          />

          <!-- Список свободных или текстовые состояния -->
          <div class="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/30 p-2">
            <AtomsPlayerListUl v-if="filteredUnassignedPlayers.length > 0">
              <MoleculesPlayerListRow
                v-for="p in filteredUnassignedPlayers"
                :key="p.id"
                v-bind="rosterRowBind(p, 'Добавить в команду: ')"
                action="add"
                @activate="emit('setTeam', p.id, selectedTeamName)"
              />
            </AtomsPlayerListUl>
            <p v-else-if="unassignedSearch" class="px-2 py-4 text-center text-xs text-slate-600 dark:text-slate-500">
              Никого не найдено
            </p>
            <p v-else class="px-2 py-4 text-center text-xs text-slate-600 dark:text-slate-500">
              Все игроки распределены
            </p>
          </div>
        </div>

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

const { displayPlayerLabel, playerLabelRatingParts } = usePlayerDisplay()

function rosterRowBind(p: Player, titlePrefix: string) {
  const { name, rating } = playerLabelRatingParts(p)
  return {
    photo: p.photo,
    avatarFallbackName: p.name,
    label: name,
    rating,
    title: `${titlePrefix}${displayPlayerLabel(p)}`,
  }
}

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
