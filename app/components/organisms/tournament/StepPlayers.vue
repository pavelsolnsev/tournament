<!-- Компонент StepPlayers: мастер-обёртка шага выбора игроков (библиотека + выбранные + место/формат). -->
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

    <!-- Правая колонка: выбранные игроки + блок место/формат -->
    <div class="flex min-w-0 flex-col gap-4 lg:col-span-3">
      <!-- Блок дата/место/формат — всё должно быть заполнено перед переходом к командам -->
      <OrganismsTournamentStepPlayersVenueFormat
        :venue-label="venueLabel"
        :format-label="formatLabel"
        :tournament-date="tournamentDate"
        @update:venue-label="emit('update:venueLabel', $event)"
        @update:format-label="emit('update:formatLabel', $event)"
        @update:tournament-date="emit('update:tournamentDate', $event)"
      />

      <OrganismsTournamentStepPlayersSelectedPanel
        :selected-players="selectedPlayers"
        :can-go-to-teams="canGoToTeams"
        :paid-player-ids="paidPlayerIds"
        :vk-list-tournament="vkListTournament"
        :vk-tr-tournament="vkTrTournament"
        :vk-team-label-by-player-id="vkTeamLabelByPlayerId"
        :vk-team-slots="vkTeamSlots"
        :tournament-sync-busy="tournamentSyncBusy"
        @remove-player="emit('removePlayer', $event)"
        @set-player-vk-team="(id, t) => emit('setPlayerVkTeam', id, t)"
        @add-vk-team-slot="emit('addVkTeamSlot', $event)"
        @remove-vk-team-slot="(v, l) => emit('removeVkTeamSlot', v, l)"
        @go-to-teams="emit('goToTeams')"
        @toggle-player-paid="(id, paid) => emit('togglePlayerPaid', id, paid)"
        @sync-tournament-from-server="emit('syncTournamentFromServer')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'

// Этот шаг показывает игроков и даёт добавить новых.
const props = defineProps<{
  players: Player[] | null
  selectedPlayers: Player[]
  availablePlayers: Player[]
  filteredAvailablePlayers: Player[]
  playerSearch: string
  venueLabel: string
  formatLabel: string
  tournamentDate: string
  paidPlayerIds: Set<number>
  /** Подписи команд из чата ВК (кнопки), по id игрока. */
  vkTeamLabelByPlayerId: Record<number, string>
  vkTeamSlots: string[]
  /** Список в ВК в режиме «есть слепок ВК» (s tr / s prof + эвристики). */
  vkListTournament: boolean
  /** Режим s tr — блок редактирования кнопок «Команды в списке ВК». */
  vkTrTournament: boolean
  tournamentSyncBusy?: boolean
}>()

const emit = defineEmits<{
  selectPlayer: [id: number]
  removePlayer: [id: number]
  'update:playerSearch': [value: string]
  'update:venueLabel': [value: string]
  'update:formatLabel': [value: string]
  'update:tournamentDate': [value: string]
  refreshPlayers: []
  goToTeams: []
  togglePlayerPaid: [playerId: number, paid: boolean]
  setPlayerVkTeam: [playerId: number, team: string | null]
  addVkTeamSlot: [name: string]
  removeVkTeamSlot: [value: string, label: string]
  syncTournamentFromServer: []
}>()

// Переход к командам разрешён только если выбраны игроки, место и формат.
const canGoToTeams = computed(
  () => props.selectedPlayers.length > 0 && props.venueLabel.trim() !== '' && props.formatLabel.trim() !== '',
)
// Этот компонент склеивает блоки UI и пробрасывает события наверх.
</script>
