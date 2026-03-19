<!-- Компонент StepPlayersLibraryPanel: показывает список игроков, их поиск и форму создания нового игрока. -->
<template>
  <section class="lg:col-span-3 rounded-xl bg-slate-800/30 p-3 sm:p-4 space-y-3">
    <h3 class="text-sm font-semibold text-slate-100">Игроки</h3>

    <input
      :value="playerSearch"
      type="text"
      placeholder="Поиск…"
      class="w-full rounded bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
      @input="emit('update:playerSearch', ($event.target as HTMLInputElement).value)"
    >

    <form class="flex items-end gap-2" @submit.prevent="onCreatePlayer">
      <input
        v-model="newName"
        type="text"
        placeholder="Имя нового игрока"
        class="min-w-0 flex-1 rounded border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
      >
      <input
        v-model="newUsername"
        type="text"
        placeholder="@username"
        class="min-w-0 w-28 shrink-0 rounded border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
      >
      <button
        type="submit"
        :disabled="!newName.trim() || creating"
        class="shrink-0 rounded bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:opacity-50 focus:outline-none"
      >
        {{ creating ? '…' : '+' }}
      </button>
    </form>

    <p v-if="createError" class="text-[11px] text-red-400">
      {{ createError }}
    </p>

    <p v-if="!players?.length" class="text-slate-500 text-xs">
      Нет игроков в базе.
    </p>
    <p v-else-if="availablePlayers.length === 0" class="text-slate-500 text-xs">
      Все игроки уже выбраны.
    </p>
    <ul
      v-else
      class="max-h-80 space-y-1 overflow-y-auto pr-1"
      role="list"
    >
      <li
        v-for="p in filteredAvailablePlayers"
        :key="p.id"
        role="button"
        tabindex="0"
        class="flex min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg bg-slate-800/40 px-3 py-2 text-left transition hover:bg-slate-700/50 focus:outline-none active:scale-[0.99]"
        @click="emit('selectPlayer', p.id)"
        @keydown.enter.space.prevent="emit('selectPlayer', p.id)"
      >
        <span class="min-w-0 flex-1 truncate text-sm text-slate-100">
          {{ displayPlayerLabel(p) }}
        </span>
        <span class="shrink-0 text-xs text-emerald-400">+ добавить</span>
      </li>
    </ul>
    <p v-if="filteredAvailablePlayers.length === 0 && availablePlayers.length > 0" class="text-slate-500 text-xs">
      Ничего не найдено.
    </p>
  </section>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import { ref } from 'vue'
import { usePlayerDisplay } from '~/composables/usePlayerDisplay'

defineProps<{
  players: Player[] | null
  availablePlayers: Player[]
  filteredAvailablePlayers: Player[]
  playerSearch: string
}>()
// Эти пропы приходят сверху: список игроков, фильтры и строка поиска.

const emit = defineEmits<{
  selectPlayer: [id: number]
  'update:playerSearch': [value: string]
  refreshPlayers: []
}>()
// Эти события возвращают действия наверх (выбор игрока, поиск, обновление списка).

const newName = ref('')
const newUsername = ref('')
const creating = ref(false)
const createError = ref('')
// Это локальное состояние формы создания игрока (имя, username, загрузка, ошибка).

const { displayPlayerLabel } = usePlayerDisplay()
// Это помогает красиво показать имя/username в списке.

async function onCreatePlayer() {
  const name = newName.value.trim()
  if (!name) {
    createError.value = 'Введите имя'
    return
  }
  createError.value = ''
  creating.value = true
  try {
    const rawUsername = newUsername.value.trim()
    const cleanedUsername = rawUsername
      ? rawUsername.replace(/^@+/, '')
      : 'unknown'

    await $fetch('/api/players', {
      method: 'POST',
      body: { name, username: cleanedUsername },
    })
    newName.value = ''
    newUsername.value = ''
    emit('refreshPlayers')
  } catch {
    createError.value = 'Не удалось добавить'
  } finally {
    creating.value = false
  }
}
// Это создаёт игрока через API и просит родителя обновить список.
</script>
