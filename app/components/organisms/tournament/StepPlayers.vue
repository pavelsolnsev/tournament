<!-- Компонент StepPlayers: мастер-обёртка шага выбора игроков (библиотека + выбранные). -->
<template>
  <div class="grid min-w-0 gap-4 lg:grid-cols-5">
    <OrganismsTournamentStepPlayersLibraryPanel
      :players="players"
      :available-players="availablePlayers"
      :filtered-available-players="filteredAvailablePlayers"
      :player-search="playerSearch"
      @update:player-search="emit('update:playerSearch', $event)"
      @select-player="emit('selectPlayer', $event)"
      @refresh-players="emit('refreshPlayers')"
    />

    <OrganismsTournamentStepPlayersSelectedPanel
      :selected-players="selectedPlayers"
      @remove-player="emit('removePlayer', $event)"
      @go-to-teams="emit('goToTeams')"
    />
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'

// Этот шаг показывает игроков и даёт добавить новых.
defineProps<{
  players: Player[] | null
  selectedPlayers: Player[]
  availablePlayers: Player[]
  filteredAvailablePlayers: Player[]
  playerSearch: string
}>()

const emit = defineEmits<{
  selectPlayer: [id: number]
  removePlayer: [id: number]
  'update:playerSearch': [value: string]
  refreshPlayers: []
  goToTeams: []
}>()
// Этот компонент только склеивает два блока UI и пробрасывает события наверх.
</script>
