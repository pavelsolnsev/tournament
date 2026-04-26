<!-- Компонент TeamsPanel: список команд с разделением на авто-сгенерированные и ручные. -->
<template>
  <AtomsTournamentPanel
    as="section"
    root-class="min-w-0 flex flex-col"
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

    <!-- Поле создания команды: на телефоне столбиком на всю ширину, на sm+ — строка. -->
    <div class="flex min-w-0 shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
      <AtomsTournamentTextInput
        :model-value="newTeamNameValue"
        variant="field"
        size="sm"
        placeholder="Название команды"
        class="min-w-0 w-full sm:flex-1"
        :disabled="!canManageTeams"
        @update:model-value="emit('update:newTeamName', $event)"
        @keydown.enter.prevent="canManageTeams && emit('addNewTeam')"
      />
      <AtomsPrimaryButton
        size="md"
        class="w-full shrink-0 sm:w-auto sm:min-w-[9rem]"
        title="Создать команду"
        aria-label="Добавить команду"
        :disabled="!canManageTeams"
        @click="canManageTeams && emit('addNewTeam')"
      >
        <span class="inline-flex items-center justify-center gap-2">
          <svg
            class="h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Добавить</span>
        </span>
      </AtomsPrimaryButton>
    </div>

    <!-- Пустое состояние — команд нет -->
    <AtomsEmptyStateBox v-if="allTeams.length === 0" align="start" size="sm">
      Команд пока нет — создайте первую.
    </AtomsEmptyStateBox>

    <!-- Список команд: ~4 строки карточек (+ место под подпись «По рейтингу»), дальше скролл -->
    <div
      v-else
      class="-mx-1 max-h-[min(22rem,calc(2.25rem+4*3.75rem+3*0.25rem))] min-h-0 overflow-y-auto px-1"
    >

      <!-- Авто-команды: созданы кнопкой «По рейтингу» -->
      <template v-if="autoTeams.length > 0">
        <p class="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-500">
          <span aria-hidden="true">⚡</span> По рейтингу
        </p>
        <ul class="space-y-1" role="list">
          <li
            v-for="name in autoTeams"
            :key="name"
            class="min-w-0 cursor-pointer rounded-xl border px-3 py-2.5 transition-colors"
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
          class="min-w-0 cursor-pointer rounded-xl border px-3 py-2.5 transition-colors"
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
import { useAdminAuth } from '~/composables/useAdminAuth'
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

// Simple10: Ограниченный админ (limited) не может создавать и удалять команды.
const { adminRole } = useAdminAuth()
const canManageTeams = computed(() => adminRole.value === 'full')

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
  // Simple10: Для limited блокируем удаление команд.
  if (!canManageTeams.value) return
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
