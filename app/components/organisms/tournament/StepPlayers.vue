<!-- Компонент StepPlayers: мастер-обёртка шага выбора игроков (библиотека + выбранные + место/формат). -->
<template>
  <div class="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-5 lg:items-start">
    <!-- Левая колонка: липкая на десктопе — прокручивается независимо от правой. -->
    <div class="min-w-0 lg:sticky lg:top-20 lg:col-span-2 lg:h-[calc(100dvh-6rem)]">
      <OrganismsTournamentStepPlayersLibraryPanel
        :players="players"
        :available-players="availablePlayers"
        :filtered-available-players="filteredAvailablePlayers"
        :player-search="playerSearch"
        @update:player-search="emit('update:playerSearch', $event)"
        @select-player="emit('selectPlayer', $event)"
        @refresh-players="emit('refreshPlayers')"
      />
    </div>

    <!-- Правая колонка: выбранные игроки + блок место/формат -->
    <div class="flex min-w-0 flex-col gap-4 lg:col-span-3">
      <!-- Дата, место и формат обычно приходят из формы «Создать матч» — тогда показываем одну строку.
           Полный блок — если чего-то не хватает (список создан командой в чате) или админ нажал «Изменить». -->
      <div
        v-if="!showVenueBlock"
        class="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white/70 px-3 py-2.5 dark:border-slate-700/55 dark:bg-slate-800/35"
      >
        <p class="min-w-0 truncate text-sm text-slate-700 dark:text-slate-300">
          {{ venueSummary }}
        </p>
        <button
          type="button"
          class="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:text-emerald-300"
          @click="venueEditing = true"
        >
          Изменить
        </button>
      </div>
      <OrganismsTournamentStepPlayersVenueFormat
        v-else
        :venue-label="venueLabel"
        :format-label="formatLabel"
        :tournament-date="tournamentDate"
        @update:venue-label="venueEditing = true; emit('update:venueLabel', $event)"
        @update:format-label="venueEditing = true; emit('update:formatLabel', $event)"
        @update:tournament-date="venueEditing = true; emit('update:tournamentDate', $event)"
      />

      <OrganismsTournamentStepPlayersSelectedPanel
        :selected-players="selectedPlayers"
        :can-go-to-teams="canGoToTeams"
        :paid-player-ids="paidPlayerIds"
        :vk-list-tournament="vkListTournament"
        :vk-tr-tournament="vkTrTournament"
        :vk-team-label-by-player-id="vkTeamLabelByPlayerId"
        :vk-team-slots="vkTeamSlots"
        :vk-team-limits="vkTeamLimits"
        :vk-list-limit="vkListLimit"
        :queued-players="queuedPlayers"
        :tournament-sync-busy="tournamentSyncBusy"
        @remove-player="emit('removePlayer', $event)"
        @set-player-vk-team="(id, t) => emit('setPlayerVkTeam', id, t)"
        @add-vk-team-slot="emit('addVkTeamSlot', $event)"
        @remove-vk-team-slot="(v, l) => emit('removeVkTeamSlot', v, l)"
        @set-vk-team-limit="(name, limit) => emit('setVkTeamLimit', name, limit)"
        @set-vk-list-limit="(limit) => emit('setVkListLimit', limit)"
        @go-to-teams="emit('goToTeams')"
        @go-to-standings="emit('goToStandings')"
        @toggle-player-paid="(id, paid) => emit('togglePlayerPaid', id, paid)"
        @sync-tournament-from-server="emit('syncTournamentFromServer')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
  /** Лимиты команд (ключ — нормализованное имя в нижнем регистре). */
  vkTeamLimits: Record<string, number>
  /** Общий лимит списка (без команд); undefined = без лимита. */
  vkListLimit?: number
  /** Игроки в очереди (скрыты с сайта): с командой — командная очередь, без — общая. */
  queuedPlayers: { player: Player, team: string }[]
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
  goToStandings: []
  togglePlayerPaid: [playerId: number, paid: boolean]
  setPlayerVkTeam: [playerId: number, team: string | null]
  addVkTeamSlot: [name: string]
  removeVkTeamSlot: [value: string, label: string]
  setVkTeamLimit: [name: string, limit: number | null]
  setVkListLimit: [limit: number | null]
  syncTournamentFromServer: []
}>()

// Всё заполнено — достаточно строки-сводки. Начали править руками — блок остаётся открытым, пока шаг на экране
// (иначе он пропадал бы прямо во время ввода, как только заполнится последнее поле).
const venueEditing = ref(false)
const venueFilled = computed(
  () => props.tournamentDate.trim() !== '' && props.venueLabel.trim() !== '' && props.formatLabel.trim() !== '',
)
const showVenueBlock = computed(() => venueEditing.value || !venueFilled.value)
watch(venueFilled, (filled) => {
  if (!filled) venueEditing.value = true
})

// Сводка: «11.10.2026 · Красное Знамя · Турнир 8x8».
const venueSummary = computed(() => {
  const [y, m, d] = props.tournamentDate.split('-')
  const date = y && m && d ? `${d}.${m}.${y}` : props.tournamentDate
  return [date, props.venueLabel, props.formatLabel].filter((v) => v.trim()).join(' · ')
})

// Переход к командам разрешён только если выбраны игроки, место и формат.
const canGoToTeams = computed(
  () => props.selectedPlayers.length > 0 && props.venueLabel.trim() !== '' && props.formatLabel.trim() !== '',
)
// Этот компонент склеивает блоки UI и пробрасывает события наверх.
</script>
