<template>
  <div class="grid gap-4 lg:grid-cols-5">
    <section class="lg:col-span-2 rounded-xl bg-slate-800/30 p-3 sm:p-4 space-y-3">
      <div>
        <h3 class="text-sm font-semibold text-slate-100">
          Команды
        </h3>
      </div>

      <div class="flex items-end gap-2">
        <div class="min-w-0 flex-1">
          <label for="new-team-name" class="mb-1 block text-xs font-medium text-slate-400">
            Новая команда
          </label>
          <input
            id="new-team-name"
            :value="newTeamNameValue"
            type="text"
            placeholder="Напр. Леон"
            class="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            @input="emit('update:newTeamName', ($event.target as HTMLInputElement).value)"
            @keydown.enter.prevent="emit('addNewTeam')"
          >
        </div>
        <button
          type="button"
          class="shrink-0 rounded bg-emerald-500 px-2.5 py-1.5 text-sm font-medium text-slate-900 transition hover:bg-emerald-400 focus:outline-none"
          title="Создать команду"
          @click="emit('addNewTeam')"
        >
          +
        </button>
      </div>

      <p v-if="allTeams.length === 0" class="rounded-lg bg-slate-900/40 px-3 py-3 text-sm text-slate-500">
        Команд пока нет — создайте первую.
      </p>

      <ul v-else class="max-h-96 overflow-y-auto pr-1 space-y-2" role="list">
        <li
          v-for="name in allTeams"
          :key="name"
          class="rounded-xl border p-2 transition"
          :class="selectedTeamName === name ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-slate-700/60 bg-slate-900/30 hover:bg-slate-900/50'"
        >
          <div class="flex items-start justify-between gap-2">
            <button
              type="button"
              class="min-w-0 flex-1 text-left focus:outline-none rounded"
              @click="selectedTeamName = name"
            >
              <div class="flex items-center gap-2">
                <span aria-hidden="true" class="text-base">{{ teamMarker(name) }}</span>
                <span class="truncate text-sm font-medium text-slate-100">{{ name }}</span>
              </div>
              <div class="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                <span>{{ playersInTeamByName(name).length }} игроков</span>
                <span v-if="isTeamConfirmed(name)" class="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] text-emerald-300">
                  Участвует
                </span>
              </div>
            </button>

            <div class="flex shrink-0 items-center gap-2">
              <select
                :value="String(getTeamColor(name))"
                class="rounded bg-slate-900/70 px-1.5 py-1 text-xs text-slate-100 focus:outline-none"
                title="Цвет команды"
                @change="emit('setTeamColor', name, Number(($event.target as HTMLSelectElement).value))"
              >
                <option v-for="(m, idx) in teamMarkers" :key="idx" :value="String(idx)">
                  {{ m }}
                </option>
              </select>

              <button
                v-if="playersInTeamByName(name).length > 0 && !isTeamConfirmed(name)"
                type="button"
                class="rounded bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/25 focus:outline-none"
                title="Команда участвует в турнире"
                @click="emit('confirmTeam', name)"
              >
                ✓
              </button>
              <button
                v-else-if="isTeamConfirmed(name)"
                type="button"
                class="rounded bg-slate-700/40 px-2 py-1 text-xs font-medium text-slate-200 transition hover:bg-slate-700/60 focus:outline-none"
                title="Убрать из участников турнира"
                @click="emit('unconfirmTeam', name)"
              >
                ↩
              </button>

              <button
                type="button"
                class="rounded px-2 py-1 text-xs text-slate-400 transition hover:text-red-400 focus:outline-none"
                title="Удалить команду"
                @click="onRemoveTeam(name)"
              >
                ✕
              </button>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <section class="lg:col-span-3 rounded-xl bg-slate-800/30 p-3 sm:p-4 space-y-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="text-sm font-semibold text-slate-100">
            Состав
          </h3>
        </div>
        <div v-if="selectedTeamName" class="shrink-0 text-right">
          <p class="text-xs text-slate-400">
            Команда
          </p>
          <p class="max-w-[14rem] truncate text-sm font-semibold text-slate-100">
            {{ teamMarker(selectedTeamName) }} {{ selectedTeamName }}
          </p>
        </div>
      </div>

      <div v-if="!selectedTeamName" class="rounded-lg bg-slate-900/40 px-3 py-6 text-center text-sm text-slate-500">
        Выберите команду слева.
      </div>

      <template v-else>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-xl bg-slate-900/30 p-2">
            <h4 class="mb-2 text-xs font-semibold text-slate-300">
              В команде
            </h4>
            <ul v-if="playersInTeam.length > 0" class="max-h-64 overflow-y-auto pr-1 space-y-1" role="list">
              <li
                v-for="p in playersInTeam"
                :key="p.id"
                class="flex min-w-0 items-center justify-between gap-2 rounded bg-slate-800/50 px-2 py-1"
              >
                <span class="min-w-0 truncate text-sm text-slate-100">
                  {{ displayPlayerLabel(p) }}
                </span>
                <button
                  type="button"
                  class="shrink-0 rounded px-2 py-1 text-xs text-slate-400 transition hover:text-red-400 focus:outline-none"
                  title="Убрать из команды"
                  @click="emit('removeFromTeam', p.id)"
                >
                  Убрать
                </button>
              </li>
            </ul>
            <p v-else class="rounded bg-slate-800/30 px-2 py-2 text-xs text-slate-500">
              Пусто. Добавьте игроков справа.
            </p>
          </div>

          <div class="rounded-xl bg-slate-900/30 p-2">
            <div class="mb-2 flex items-center justify-between gap-2">
              <h4 class="text-xs font-semibold text-slate-300">
                Свободные игроки
              </h4>
              <input
                v-model="unassignedSearch"
                type="text"
                placeholder="Поиск…"
                class="w-32 rounded bg-slate-900 px-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              >
            </div>

            <ul v-if="filteredUnassignedPlayers.length > 0" class="max-h-64 overflow-y-auto pr-1 space-y-1" role="list">
              <li
                v-for="p in filteredUnassignedPlayers"
                :key="p.id"
                role="button"
                tabindex="0"
                class="flex min-w-0 cursor-pointer items-center justify-between gap-2 rounded bg-slate-800/30 px-2 py-1 text-left transition hover:bg-slate-700/50 focus:outline-none"
                @click="emit('setTeam', p.id, selectedTeamName)"
                @keydown.enter.space.prevent="emit('setTeam', p.id, selectedTeamName)"
              >
                <span class="min-w-0 truncate text-sm text-slate-100">
                  {{ displayPlayerLabel(p) }}
                </span>
                <span class="shrink-0 text-xs text-emerald-400">+ добавить</span>
              </li>
            </ul>
            <p v-else class="rounded bg-slate-800/30 px-2 py-2 text-xs text-slate-500">
              Все игроки распределены по командам.
            </p>
          </div>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { MaybeRef, ComputedRef, Ref } from 'vue'
import { unref } from 'vue'
import { usePlayerDisplay } from '~/composables/usePlayerDisplay'
import { useTeamColors } from '@/composables/useTeamColors'

// Здесь создаём команды и распределяем игроков по командам.
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
  removeTeam: [teamName: string]
}>()

const { teamMarkers, getMarkerByIndex } = useTeamColors()
const { displayPlayerLabel } = usePlayerDisplay()

function teamMarker(teamName: string): string {
  const colorIndex = Number.isFinite(props.getTeamColor(teamName))
    ? props.getTeamColor(teamName)
    : 0
  return getMarkerByIndex(colorIndex)
}

const teamOptionsList = computed(() => unref(props.teamOptions))
const newTeamNameValue = computed(() => unref(props.newTeamName))
const confirmedSet = computed(() => unref(props.confirmedTeamNames) ?? new Set<string>())
const isTeamConfirmed = (name: string) => confirmedSet.value.has(name)
const allTeams = computed(() => {
  const list = teamOptionsList.value
  const confirmed = list.filter((name) => confirmedSet.value.has(name))
  const others = list.filter((name) => !confirmedSet.value.has(name))
  return [...confirmed, ...others]
})

function playersInTeamByName(teamName: string) {
  return props.players.filter((p) => props.getTeam(p.id) === teamName)
}

const selectedTeamName = ref('')

function onRemoveTeam(teamName: string) {
  if (selectedTeamName.value === teamName) selectedTeamName.value = ''
  emit('removeTeam', teamName)
}

const unassignedSearch = ref('')

const playersInTeam = computed(() => {
  const name = selectedTeamName.value
  if (!name) return []
  return props.players.filter((p) => props.getTeam(p.id) === name)
})

const unassignedPlayers = computed(() =>
  props.players.filter((p) => !props.getTeam(p.id)),
)

const filteredUnassignedPlayers = computed(() => {
  const term = unassignedSearch.value.trim().toLowerCase()
  if (!term) return unassignedPlayers.value
  const normalized = term.replace(/^@/, '')
  return unassignedPlayers.value.filter((p) => {
    const name = (p.name || '').toLowerCase()
    const username = (p.username || '').replace(/^@/, '').toLowerCase()
    return name.includes(term) || (!!username && username.includes(normalized))
  })
})
</script>
