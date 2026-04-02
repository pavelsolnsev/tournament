<!-- Компонент TeamsPanel: список команд с разделением на авто-сгенерированные и ручные. -->
<template>
  <AtomsTournamentPanel as="section" root-class="lg:col-span-2">
    <!-- Поле + кнопка: items-end выравнивает кнопку с инпутом, игнорируя лейбл -->
    <div class="flex items-end gap-2">
      <MoleculesFieldBlock
        id="new-team-name"
        wrapper-class="flex-1"
      >
        <AtomsTournamentTextInput
          :model-value="newTeamNameValue"
          variant="field"
          size="sm"
          placeholder="Название команды"
          id="new-team-name"
          @update:model-value="emit('update:newTeamName', $event)"
          @keydown.enter.prevent="emit('addNewTeam')"
        />
      </MoleculesFieldBlock>

      <!-- size="md" даёт h-11 — совпадает с высотой инпута -->
      <AtomsPrimaryButton
        size="md"
        title="Создать команду"
        @click="emit('addNewTeam')"
      >
        +
      </AtomsPrimaryButton>
    </div>

    <AtomsEmptyStateBox v-if="allTeams.length === 0" align="start" size="sm">
      Команд пока нет — создайте первую.
    </AtomsEmptyStateBox>

    <div v-else class="max-h-96 overflow-y-auto pr-1">

      <!-- Секция авто-команд (появились после «Распределить по рейтингу») -->
      <template v-if="autoTeams.length > 0">
        <p class="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          <span aria-hidden="true">⚡</span>По рейтингу
        </p>
        <ul class="space-y-1.5" role="list">
          <li
            v-for="name in autoTeams"
            :key="name"
            class="rounded-xl border px-3 py-2 transition"
            :class="selectedTeamName === name
              ? 'border-emerald-500/60 bg-emerald-500/5'
              : 'border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/50'"
          >
          <OrganismsPlayerTeamAssignmentTeamRowContent
            :name="name"
            :selected-team-name="selectedTeamName"
            :team-player-counts="teamPlayerCounts"
            :is-team-confirmed="isTeamConfirmed"
            :get-team-color="getTeamColor"
            :team-marker="teamMarker"
            :team-markers="teamMarkers"
            :remove-confirm-team-name="removeConfirmTeamName"
            @select="emit('selectTeam', name)"
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

      <!-- Разделитель — виден только когда есть обе группы -->
      <div
        v-if="autoTeams.length > 0 && manualTeams.length > 0"
        class="my-3 flex items-center gap-2"
        aria-hidden="true"
      >
        <div class="h-px flex-1 bg-slate-300 dark:bg-slate-700/50" />
        <span class="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">вручную</span>
        <div class="h-px flex-1 bg-slate-300 dark:bg-slate-700/50" />
      </div>

      <!-- Секция ручных команд -->
      <ul v-if="manualTeams.length > 0" class="space-y-1.5" role="list">
        <li
          v-for="name in manualTeams"
          :key="name"
          class="rounded-xl border px-3 py-2 transition"
          :class="selectedTeamName === name
            ? 'border-emerald-500/60 bg-emerald-500/5'
            : 'border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/50'"
        >
          <OrganismsPlayerTeamAssignmentTeamRowContent
            :name="name"
            :selected-team-name="selectedTeamName"
            :team-player-counts="teamPlayerCounts"
            :is-team-confirmed="isTeamConfirmed"
            :get-team-color="getTeamColor"
            :team-marker="teamMarker"
            :team-markers="teamMarkers"
            :remove-confirm-team-name="removeConfirmTeamName"
            @select="emit('selectTeam', name)"
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
</script>
