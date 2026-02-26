<template>
  <ul class="space-y-3" role="list">
    <li
      v-for="p in players"
      :key="p.id"
      class="flex min-w-0 flex-col gap-2 rounded-xl bg-slate-800/30 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
    >
      <div class="min-w-0 shrink-0">
        <span class="font-medium text-slate-100">{{ p.name }}</span>
        <span v-if="p.username" class="ml-1 text-slate-500 text-sm">{{ p.username }}</span>
      </div>
      <div
        v-if="newTeamInputForPlayerValue === p.id"
        class="flex min-w-0 flex-1 flex-wrap items-center gap-2"
      >
        <input
          :value="newTeamNameValue"
          type="text"
          placeholder="Название команды"
          class="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:max-w-xs"
          @input="emit('update:newTeamName', ($event.target as HTMLInputElement).value)"
          @keydown.enter.prevent="emit('confirmNewTeam', p.id)"
        >
        <button
          type="button"
          class="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-emerald-400"
          @click="emit('confirmNewTeam', p.id)"
        >
          Добавить
        </button>
        <button
          type="button"
          class="rounded-lg bg-slate-600 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-500"
          @click="emit('closeNewTeamInput')"
        >
          Отмена
        </button>
      </div>
      <div v-else class="flex min-w-0 flex-1 items-center gap-2">
        <select
          :value="getTeam(p.id)"
          class="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:max-w-xs"
          @change="emit('setTeam', p.id, ($event.target as HTMLSelectElement).value)"
        >
          <option value="">
            — Выберите команду —
          </option>
          <option
            v-for="name in teamOptionsList"
            :key="name"
            :value="name"
          >
            {{ name }}
          </option>
          <option value="__new__">
            ➕ Создать новую команду
          </option>
        </select>
        <span v-if="getTeam(p.id)" class="shrink-0 truncate text-slate-500 text-sm">
          {{ getTeam(p.id) }}
        </span>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { MaybeRef, ComputedRef, Ref } from 'vue'
import { unref } from 'vue'

const props = defineProps<{
  players: Player[]
  teamOptions: MaybeRef<string[]> | ComputedRef<string[]>
  getTeam: (playerId: number) => string
  newTeamInputForPlayer: MaybeRef<number | null> | Ref<number | null>
  newTeamName: MaybeRef<string> | Ref<string>
}>()

const emit = defineEmits<{
  'update:newTeamName': [value: string]
  setTeam: [playerId: number, teamName: string]
  confirmNewTeam: [playerId: number]
  closeNewTeamInput: []
}>()

const teamOptionsList = computed(() => unref(props.teamOptions))
const newTeamInputForPlayerValue = computed(() => unref(props.newTeamInputForPlayer))
const newTeamNameValue = computed(() => unref(props.newTeamName))
</script>
