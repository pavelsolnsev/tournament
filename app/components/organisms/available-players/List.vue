<!-- Компонент AvailablePlayersList: тот же набор атомов, что в мастере турнира. -->
<template>
  <AtomsTournamentPanel root-class="min-w-0">
    <p v-if="!players?.length" class="text-slate-500 text-xs">
      Нет игроков в базе. Добавьте выше.
    </p>
    <p v-else-if="allSelected" class="text-slate-500 text-xs">
      Все игроки уже выбраны.
    </p>
    <div v-else class="space-y-3">
      <MoleculesFieldBlock id="player-search" label="Поиск">
        <AtomsTournamentTextInput
          :model-value="searchQuery"
          variant="search"
          size="xs"
          placeholder="От 3 символов — имя или username"
          @update:model-value="emit('update:searchQuery', $event)"
        />
      </MoleculesFieldBlock>

      <p v-if="filteredPlayers.length === 0" class="text-slate-500 text-xs">
        По этому запросу игроков не найдено.
      </p>
      <AtomsPlayerListUl v-else>
        <MoleculesPlayerListRow
          v-for="p in filteredPlayers"
          :key="p.id"
          :photo="p.photo"
          :avatar-fallback-name="p.name"
          :label="displayPlayerLabel(p)"
          :title="'Добавить в турнир: ' + displayPlayerLabel(p)"
          action="add"
          @activate="emit('select', p.id)"
        />
      </AtomsPlayerListUl>
      <p class="text-slate-500 text-xs">
        Клик по строке добавляет игрока в турнир.
      </p>
    </div>
  </AtomsTournamentPanel>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import { usePlayerDisplay } from '~/composables/usePlayerDisplay'

defineProps<{
  players: Player[]
  filteredPlayers: Player[]
  searchQuery: string
  allSelected: boolean
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  select: [id: number]
}>()

const { displayPlayerLabel } = usePlayerDisplay()
</script>
