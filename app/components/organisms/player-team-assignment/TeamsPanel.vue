<!-- Компонент TeamsPanel: панель со списком команд и настройкой/подтверждением выбранных команд. -->
<template>
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
            @click="emit('selectTeam', name)"
          >
            <div class="flex items-center gap-2">
              <span aria-hidden="true" class="text-base">{{ teamMarker(name) }}</span>
              <span class="truncate text-sm font-medium text-slate-100">{{ name }}</span>
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
              class="rounded bg-slate-900/70 px-1.5 py-1 text-xs text-slate-100 focus:outline-none"
              title="Цвет команды"
              @change="emit('setTeamColor', name, Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="(m, idx) in teamMarkers" :key="idx" :value="String(idx)">
                {{ m }}
              </option>
            </select>

            <button
              v-if="(teamPlayerCounts[name] ?? 0) > 0 && !isTeamConfirmed(name)"
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
              @click="emit('removeTeam', name)"
            >
              ✕
            </button>
          </div>
        </div>
      </li>
    </ul>
  </section>
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

// Эти маркеры нужны, чтобы показать цвет команды в селекте.
const { teamMarkers } = useTeamColors()
</script>
