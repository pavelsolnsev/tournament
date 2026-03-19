<!-- Компонент RosterPanel: панель состава выбранной команды и поиск/добавление свободных игроков. -->
<template>
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
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import { computed, ref } from 'vue'
import { usePlayerDisplay } from '~/composables/usePlayerDisplay'

const props = defineProps<{
  selectedTeamName: string
  players: Player[]
  getTeam: (playerId: number) => string
  teamMarker: (teamName: string) => string
}>()

const emit = defineEmits<{
  removeFromTeam: [playerId: number]
  setTeam: [playerId: number, teamName: string]
}>()

const { displayPlayerLabel } = usePlayerDisplay()

// Это локальный поиск по свободным игрокам, чтобы не засорять родителя.
const unassignedSearch = ref('')

const playersInTeam = computed(() => {
  const name = props.selectedTeamName
  if (!name) return []
  return props.players.filter((p) => props.getTeam(p.id) === name)
})
// Этот список нужен, чтобы показать игроков выбранной команды.

const unassignedPlayers = computed(() =>
  props.players.filter((p) => !props.getTeam(p.id)),
)
// Это игроки без команды — их можно добавить в выбранную команду.

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
// Этот фильтр помогает быстро найти свободного игрока по имени или username.
</script>
