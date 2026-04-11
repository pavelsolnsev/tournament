<!-- Компонент TeamsPanel: список команд с разделением на авто-сгенерированные и ручные. -->
<template>
  <AtomsTournamentPanel
    as="section"
    root-class="min-w-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col"
  >

    <!-- Заголовок секции + счётчик команд -->
    <div class="flex shrink-0 items-center justify-between gap-2">
      <h2 class="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Команды</h2>
      <span
        v-if="allTeams.length > 0"
        class="rounded-full bg-slate-200 dark:bg-slate-700/60 px-2 py-0.5 text-xs tabular-nums text-slate-600 dark:text-slate-400"
      >
        {{ allTeams.length }}
      </span>
    </div>

    <!-- Поле создания команды: инпут + кнопка на одной высоте -->
    <div class="flex shrink-0 items-center gap-2">
      <AtomsTournamentTextInput
        :model-value="newTeamNameValue"
        variant="field"
        size="sm"
        placeholder="Название команды"
        class="flex-1"
        @update:model-value="emit('update:newTeamName', $event)"
        @keydown.enter.prevent="emit('addNewTeam')"
      />
      <AtomsPrimaryButton
        size="md"
        title="Создать команду"
        @click="emit('addNewTeam')"
      >
        +
      </AtomsPrimaryButton>
    </div>

    <!-- Пустое состояние — команд нет -->
    <AtomsEmptyStateBox v-if="allTeams.length === 0" align="start" size="sm">
      Команд пока нет — создайте первую.
    </AtomsEmptyStateBox>

    <!-- Список команд: на мобиле ограничение по высоте; на lg — заполняет карточку до низа рядом с составом -->
    <div v-else class="max-h-[26rem] overflow-y-auto -mx-1 px-1 lg:max-h-none lg:min-h-0 lg:flex-1">

      <!-- Авто-команды: созданы кнопкой «По рейтингу» -->
      <template v-if="autoTeams.length > 0">
        <p class="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-500">
          <span aria-hidden="true">⚡</span> По рейтингу
        </p>
        <ul class="space-y-1" role="list">
          <li
            v-for="name in autoTeams"
            :key="name"
            class="min-w-0 cursor-pointer rounded-xl border px-3 py-2 transition-colors"
            :class="selectedTeamName === name
              ? 'border-emerald-500/50 bg-emerald-500/8 dark:bg-emerald-500/10'
              : 'border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/50'"
            @click="onTeamLiClick($event, name)"
          >
            <OrganismsPlayerTeamAssignmentTeamRowContent
              :name="name"
              :team-player-counts="teamPlayerCounts"
              :is-team-confirmed="isTeamConfirmed"
              :get-team-color="getTeamColor"
              :team-marker="teamMarker"
              :team-markers="teamMarkers"
              :remove-confirm-team-name="removeConfirmTeamName"
              @confirm="emit('confirmTeam', name)"
              @unconfirm="emit('unconfirmTeam', name)"
              @set-color="emit('setTeamColor', name, $event)"
              @open-remove="openRemoveConfirm(name)"
              @confirm-remove="confirmRemoveTeam(name)"
              @cancel-remove="closeRemoveConfirm"
            />
          </li>
        </ul>
      </template>

      <!-- Разделитель — только когда есть оба типа команд -->
      <div
        v-if="autoTeams.length > 0 && manualTeams.length > 0"
        class="my-2.5 flex items-center gap-2"
        aria-hidden="true"
      >
        <div class="h-px flex-1 bg-slate-200 dark:bg-slate-700/50" />
        <span class="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">вручную</span>
        <div class="h-px flex-1 bg-slate-200 dark:bg-slate-700/50" />
      </div>

      <!-- Ручные команды -->
      <ul v-if="manualTeams.length > 0" class="space-y-1" role="list">
        <li
          v-for="name in manualTeams"
          :key="name"
          class="min-w-0 cursor-pointer rounded-xl border px-3 py-2 transition-colors"
          :class="selectedTeamName === name
            ? 'border-emerald-500/50 bg-emerald-500/8 dark:bg-emerald-500/10'
            : 'border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/50'"
          @click="onTeamLiClick($event, name)"
        >
          <OrganismsPlayerTeamAssignmentTeamRowContent
            :name="name"
            :team-player-counts="teamPlayerCounts"
            :is-team-confirmed="isTeamConfirmed"
            :get-team-color="getTeamColor"
            :team-marker="teamMarker"
            :team-markers="teamMarkers"
            :remove-confirm-team-name="removeConfirmTeamName"
            @confirm="emit('confirmTeam', name)"
            @unconfirm="emit('unconfirmTeam', name)"
            @set-color="emit('setTeamColor', name, $event)"
            @open-remove="openRemoveConfirm(name)"
            @confirm-remove="confirmRemoveTeam(name)"
            @cancel-remove="closeRemoveConfirm"
          />
        </li>
      </ul>

    </div>
  </AtomsTournamentPanel>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTeamColors } from '~/composables/useTeamColors'

const props = defineProps<{
  newTeamNameValue: string
  allTeams: string[]
  selectedTeamName: string
  teamPlayerCounts: Record<string, number>
  isTeamConfirmed: (name: string) => boolean
  isAutoTeam: (name: string) => boolean
  getTeamColor: (teamName: string) => number
  teamMarker: (teamName: string) => string
}>()

const emit = defineEmits<{
  'update:newTeamName': [value: string]
  addNewTeam: []
  selectTeam: [teamName: string]
  confirmTeam: [teamName: string]
  unconfirmTeam: [teamName: string]
  setTeamColor: [teamName: string, colorIndex: number]
  removeTeam: [teamName: string]
}>()

const { teamMarkers } = useTeamColors()

// Авто-команды — созданы распределением по рейтингу.
const autoTeams = computed(() => props.allTeams.filter((n) => props.isAutoTeam(n)))
// Ручные команды — все остальные.
const manualTeams = computed(() => props.allTeams.filter((n) => !props.isAutoTeam(n)))

const removeConfirmTeamName = ref<string | null>(null)

function closeRemoveConfirm() {
  removeConfirmTeamName.value = null
}

function openRemoveConfirm(teamName: string) {
  removeConfirmTeamName.value = teamName
}

function confirmRemoveTeam(teamName: string) {
  emit('removeTeam', teamName)
  closeRemoveConfirm()
}

// Клик по карточке команды (весь li, включая паддинг) выбирает строку; контролы помечены data-team-row-stop.
function onTeamLiClick(ev: MouseEvent, teamName: string) {
  const el = ev.target
  if (!(el instanceof Element)) return
  if (el.closest('[data-team-row-stop]')) return
  emit('selectTeam', teamName)
}
</script>
