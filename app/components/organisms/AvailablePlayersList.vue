<template>
  <section class="rounded-xl bg-slate-800/50 p-2 sm:p-4 sm:p-5">
    <h2 class="text-lg font-semibold text-slate-200 mb-3">
      Игроки из базы
    </h2>
    <p v-if="!players?.length" class="text-slate-500 text-sm">
      Нет игроков в базе. Добавьте выше.
    </p>
    <p v-else-if="allSelected" class="text-slate-500 text-sm">
      Все игроки уже выбраны.
    </p>
    <div v-else class="space-y-3">
      <div>
        <label for="player-search" class="mb-1 block text-sm text-slate-400">
          Поиск игрока
        </label>
        <input
          id="player-search"
          :value="searchQuery"
          type="text"
          placeholder="От 3 символов — имя или @username"
          class="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        >
      </div>

      <p v-if="filteredPlayers.length === 0" class="text-slate-500 text-sm">
        По этому запросу игроков не найдено.
      </p>
      <ul
        v-else
        class="max-h-72 space-y-2 overflow-x-hidden overflow-y-auto rounded-lg bg-slate-800/30 p-1"
        role="list"
      >
        <li
          v-for="p in filteredPlayers"
          :key="p.id"
          role="button"
          tabindex="0"
          class="flex min-w-0 cursor-pointer items-center justify-between gap-3 rounded-xl bg-slate-800/50 px-3 py-3 sm:px-4 sm:py-3.5 text-left transition hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-800 active:scale-[0.99]"
          @click="emit('select', p.id)"
          @keydown.enter.space.prevent="emit('select', p.id)"
        >
          <span class="min-w-0 flex-1 truncate font-medium text-slate-100">{{ p.name }}</span>
          <span v-if="p.username" class="min-w-0 max-w-[40%] truncate text-slate-500 text-sm">{{ p.username }}</span>
          <span v-else class="shrink-0 text-slate-600 text-sm">—</span>
          <span class="shrink-0 text-emerald-400 text-sm">+ в турнир</span>
        </li>
      </ul>
      <p class="text-slate-500 text-sm">
        Нажмите на игрока — он добавится в список выбранных выше.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'

defineProps<{
  players: Player[]
  filteredPlayers: Player[]
  searchQuery: string
  /** When true, "all selected" message is shown instead of search/list */
  allSelected: boolean
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  select: [id: number]
}>()
</script>
