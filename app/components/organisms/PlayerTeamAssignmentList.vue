<template>
  <div class="space-y-4">
    <!-- Команды-участницы турнира -->
    <div v-if="confirmedTeamsList.length > 0">
      <h3 class="mb-2 text-sm font-semibold text-emerald-400">
        Участники турнира
      </h3>
      <ul class="space-y-2" role="list">
        <li
          v-for="teamName in confirmedTeamsList"
          :key="teamName"
          class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2"
        >
          <div class="mb-1 flex items-center justify-between gap-2">
            <span class="font-medium text-slate-100">
              <span class="mr-1.5" aria-hidden="true">{{ teamMarker(teamName) }}</span>
              {{ teamName }}
            </span>
            <div class="flex shrink-0 items-center gap-2">
              <span class="rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs text-emerald-400">
                Участвует
              </span>
              <button
                type="button"
                class="rounded px-2 py-1 text-xs sm:text-sm text-slate-400 transition hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                @click="emit('unconfirmTeam', teamName)"
              >
                Вернуть
              </button>
            </div>
          </div>
          <ul class="space-y-0.5 pl-1 text-xs text-slate-400" role="list">
            <li
              v-for="p in playersInTeamByName(teamName)"
              :key="p.id"
              class="truncate"
            >
              {{ p.username || p.name }}
            </li>
          </ul>
        </li>
      </ul>
    </div>

    <!-- Создать команду -->
    <div class="flex flex-wrap items-end gap-2">
      <div class="min-w-0 flex-1 sm:max-w-xs">
        <label for="new-team-name" class="mb-1 block text-xs font-medium text-slate-400">
          Новая команда
        </label>
        <input
          id="new-team-name"
          :value="newTeamNameValue"
          type="text"
          placeholder="Название команды"
          class="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          @input="emit('update:newTeamName', ($event.target as HTMLInputElement).value)"
          @keydown.enter.prevent="emit('addNewTeam')"
        >
      </div>
      <button
        type="button"
        class="rounded bg-emerald-500 px-2.5 py-1.5 text-sm font-medium text-slate-900 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        @click="emit('addNewTeam')"
      >
        Создать команду
      </button>
    </div>

    <!-- Выбрать команду -->
    <div>
      <label for="select-team" class="mb-1 block text-xs font-medium text-slate-400">
        Выберите команду для добавления игроков
      </label>
      <select
        id="select-team"
        :value="selectedTeamName"
        class="w-full max-w-xs rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        @change="selectedTeamName = ($event.target as HTMLSelectElement).value"
      >
        <option value="">
          — Выберите команду —
        </option>
        <option
          v-for="name in selectableTeamOptions"
          :key="name"
          :value="name"
        >
          {{ name }}
        </option>
      </select>
    </div>

    <template v-if="selectedTeamName">
      <!-- Цвет команды -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-medium text-slate-400">Цвет команды:</span>
        <div class="flex gap-1">
          <button
            v-for="(marker, idx) in teamMarkers"
            :key="idx"
            type="button"
            :title="['Красный', 'Зелёный', 'Синий', 'Жёлтый'][idx]"
            class="rounded p-1 text-lg transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            :class="getTeamColor(selectedTeamName) === idx ? 'ring-2 ring-slate-300 ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-70 hover:opacity-100'"
            @click="emit('setTeamColor', selectedTeamName, idx)"
          >
            {{ marker }}
          </button>
        </div>
      </div>

      <!-- Игроки в выбранной команде -->
      <div>
        <h3 class="mb-1.5 text-sm font-semibold text-slate-300">
          В команде «{{ selectedTeamName }}»
        </h3>
        <ul v-if="playersInTeam.length > 0" class="space-y-1" role="list">
          <li
            v-for="p in playersInTeam"
            :key="p.id"
            class="flex min-w-0 items-center justify-between gap-2 rounded bg-slate-800/50 px-2 py-1"
          >
            <div class="min-w-0 truncate">
              <span class="text-sm text-slate-100">
                {{ p.username || p.name }}
              </span>
            </div>
            <button
              type="button"
              class="shrink-0 rounded px-2 py-1 text-xs sm:text-sm text-slate-400 transition hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              title="Убрать из команды"
              @click="emit('removeFromTeam', p.id)"
            >
              Убрать
            </button>
          </li>
        </ul>
        <p v-else class="rounded bg-slate-800/30 px-2 py-2 text-xs text-slate-500">
          Пока никого. Добавьте игроков из списка ниже.
        </p>
      </div>

      <!-- Зафиксировать команду -->
      <div v-if="playersInTeam.length > 0 && !isTeamConfirmed(selectedTeamName)" class="flex items-center gap-2">
        <button
          type="button"
          class="rounded bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          @click="emit('confirmTeam', selectedTeamName)"
        >
          Зафиксировать команду для турнира
        </button>
      </div>
      <p v-else-if="playersInTeam.length > 0 && isTeamConfirmed(selectedTeamName)" class="text-xs text-emerald-400">
        Команда зафиксирована и участвует в турнире.
      </p>

      <!-- Не распределённые — добавить в команду -->
      <div>
        <h3 class="mb-1.5 text-sm font-semibold text-slate-300">
          Добавить в «{{ selectedTeamName }}»
        </h3>
        <ul v-if="unassignedPlayers.length > 0" class="space-y-1" role="list">
          <li
            v-for="p in unassignedPlayers"
            :key="p.id"
            role="button"
            tabindex="0"
            class="flex min-w-0 cursor-pointer items-center gap-2 rounded bg-slate-800/30 px-2 py-1 text-left transition hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            @click="emit('setTeam', p.id, selectedTeamName)"
            @keydown.enter.space.prevent="emit('setTeam', p.id, selectedTeamName)"
          >
            <span class="truncate text-sm text-slate-100">
              {{ p.username || p.name }}
            </span>
            <span class="shrink-0 text-xs text-emerald-400">+</span>
          </li>
        </ul>
        <p v-else class="rounded bg-slate-800/30 px-2 py-2 text-xs text-slate-500">
          Все игроки уже распределены по командам.
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { MaybeRef, ComputedRef, Ref } from 'vue'
import { unref } from 'vue'

const props = defineProps<{
  players: Player[]
  teamOptions: MaybeRef<string[]> | ComputedRef<string[]>
  getTeam: (playerId: number) => string
  newTeamName: MaybeRef<string> | Ref<string>
  confirmedTeamNames: MaybeRef<Set<string>>
  getTeamColor: (teamName: string) => number
}>()

const emit = defineEmits<{
  'update:newTeamName': [value: string]
  setTeam: [playerId: number, teamName: string]
  addNewTeam: []
  removeFromTeam: [playerId: number]
  confirmTeam: [teamName: string]
  unconfirmTeam: [teamName: string]
  setTeamColor: [teamName: string, colorIndex: number]
}>()

const teamMarkers: [string, string, string, string] = ['🔴', '🟢', '🔵', '🟡']

function teamMarker(teamName: string): string {
  const idx = Math.max(0, Math.min(props.getTeamColor(teamName), 3)) as 0 | 1 | 2 | 3
  return teamMarkers[idx]
}

const teamOptionsList = computed(() => unref(props.teamOptions))
const newTeamNameValue = computed(() => unref(props.newTeamName))
const confirmedSet = computed(() => unref(props.confirmedTeamNames) ?? new Set<string>())
const isTeamConfirmed = (name: string) => confirmedSet.value.has(name)
const confirmedTeamsList = computed(() =>
  teamOptionsList.value.filter((name) => confirmedSet.value.has(name)),
)
/** Команды, которые ещё не зафиксированы — показываем в селекте */
const selectableTeamOptions = computed(() =>
  teamOptionsList.value.filter((name) => !confirmedSet.value.has(name)),
)

function playersInTeamByName(teamName: string) {
  return props.players.filter((p) => props.getTeam(p.id) === teamName)
}

const selectedTeamName = ref('')

watch(
  () => confirmedSet.value,
  () => {
    if (selectedTeamName.value && confirmedSet.value.has(selectedTeamName.value)) {
      selectedTeamName.value = ''
    }
  },
)

const playersInTeam = computed(() => {
  const name = selectedTeamName.value
  if (!name) return []
  return props.players.filter((p) => props.getTeam(p.id) === name)
})

const unassignedPlayers = computed(() =>
  props.players.filter((p) => !props.getTeam(p.id)),
)
</script>
