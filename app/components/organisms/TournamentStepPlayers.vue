<template>
  <div>
    <section class="mb-6 rounded-xl bg-slate-800/50 p-2 sm:p-4 sm:p-5">
      <h2 class="text-sm font-semibold text-slate-400 mb-2">
        Выбранные игроки (клик — убрать)
      </h2>
      <div
        v-if="selectedPlayers.length === 0"
        class="rounded-lg bg-slate-800/30 px-3 py-4 sm:px-4 sm:py-6 text-center text-slate-500 text-sm"
      >
        Выберите игроков из списка ниже — клик по игроку добавит его сюда
      </div>
      <template v-else>
        <MoleculesSelectedPlayersChips :players="selectedPlayers" @remove="emit('removePlayer', $event)" />
        <div class="mt-4">
          <button
            type="button"
            class="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 sm:w-auto sm:min-w-[220px]"
            @click="emit('goToTeams')"
          >
            Распределить по командам →
          </button>
        </div>
      </template>
    </section>

    <OrganismsPlayerCreateForm @created="emit('refreshPlayers')" />

    <OrganismsAvailablePlayersList
      :players="players ?? []"
      :filtered-players="filteredAvailablePlayers"
      :search-query="playerSearch"
      :all-selected="availablePlayers.length === 0"
      @update:search-query="(v) => emit('update:playerSearch', v)"
      @select="emit('selectPlayer', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'

const props = defineProps<{
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
</script>

