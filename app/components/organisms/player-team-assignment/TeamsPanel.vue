<!-- Компонент TeamsPanel: команды на тех же панели/полях, что игроки. -->
<template>
  <AtomsTournamentPanel as="section" root-class="lg:col-span-2">
    <AtomsPanelHeading>Команды</AtomsPanelHeading>

    <div class="flex items-end gap-2">
      <MoleculesFieldBlock
        id="new-team-name"
        label="Новая команда"
        wrapper-class="flex-1"
      >
        <AtomsTournamentTextInput
          :model-value="newTeamNameValue"
          variant="field"
          size="sm"
          placeholder="Напр. Леон"
          id="new-team-name"
          @update:model-value="emit('update:newTeamName', $event)"
          @keydown.enter.prevent="emit('addNewTeam')"
        />
      </MoleculesFieldBlock>

      <AtomsPrimaryButton
        size="sm"
        title="Создать команду"
        @click="emit('addNewTeam')"
      >
        +
      </AtomsPrimaryButton>
    </div>

    <AtomsEmptyStateBox v-if="allTeams.length === 0" align="start" size="sm">
      Команд пока нет — создайте первую.
    </AtomsEmptyStateBox>

    <ul v-else class="max-h-96 space-y-2 overflow-y-auto pr-1" role="list">
      <li
        v-for="name in allTeams"
        :key="name"
        class="rounded-xl border p-2 transition sm:p-3"
        :class="selectedTeamName === name ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-slate-800/50 bg-slate-900/30 hover:bg-slate-900/50'"
      >
        <div class="flex items-start justify-between gap-2">
          <button
            type="button"
            class="min-w-0 flex-1 rounded text-left focus:outline-none"
            @click="emit('selectTeam', name)"
          >
            <div class="flex min-w-0 items-center gap-2">
              <span aria-hidden="true" class="shrink-0 text-base">{{ teamMarker(name) }}</span>
              <span class="min-w-0 truncate text-sm font-medium text-slate-100">{{ name }}</span>
            </div>

            <div class="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
              <span>{{ teamPlayerCounts[name] ?? 0 }} игроков</span>
              <span v-if="isTeamConfirmed(name)" class="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] text-emerald-300">
                Участвует
              </span>
            </div>
          </button>

          <div class="flex shrink-0 items-center gap-2">
            <select
              :value="String(getTeamColor(name))"
              class="rounded border border-slate-700 bg-slate-900/70 px-1.5 py-1 text-xs text-slate-100 outline-none ring-0 ring-offset-0 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0"
              title="Цвет команды"
              @change="emit('setTeamColor', name, Number(($event.target as HTMLSelectElement).value))"
            >
              <option
                v-for="(m, idx) in teamMarkers"
                :key="idx"
                class="bg-slate-900 text-slate-100"
                :value="String(idx)"
              >
                {{ m }}
              </option>
            </select>

            <button
              v-if="(teamPlayerCounts[name] ?? 0) > 0 && !isTeamConfirmed(name)"
              type="button"
              class="rounded bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              title="Команда участвует в турнире"
              @click="emit('confirmTeam', name)"
            >
              ✓
            </button>

            <button
              v-else-if="isTeamConfirmed(name)"
              type="button"
              class="rounded bg-slate-700/40 px-2 py-1 text-xs font-medium text-slate-200 transition hover:bg-slate-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40"
              title="Убрать из участников турнира"
              @click="emit('unconfirmTeam', name)"
            >
              ↩
            </button>

            <button
              type="button"
              class="rounded px-2 py-1 text-xs text-slate-400 transition hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
              title="Удалить команду"
              @click="emit('removeTeam', name)"
            >
              ✕
            </button>
          </div>
        </div>
      </li>
    </ul>
  </AtomsTournamentPanel>
</template>

<script setup lang="ts">
import { useTeamColors } from '~/composables/useTeamColors'

defineProps<{
  newTeamNameValue: string
  allTeams: string[]
  selectedTeamName: string
  teamPlayerCounts: Record<string, number>
  isTeamConfirmed: (name: string) => boolean
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
</script>
