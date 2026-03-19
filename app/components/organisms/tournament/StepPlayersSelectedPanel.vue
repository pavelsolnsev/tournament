<!-- Компонент StepPlayersSelectedPanel: показывает выбранных игроков и кнопку перейти к командам. -->
<template>
  <section class="lg:col-span-2 space-y-4">
    <div class="rounded-xl bg-slate-800/30 p-3 sm:p-4 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-sm font-semibold text-slate-100">
          В турнире
        </h3>
        <span class="text-xs text-slate-400">{{ selectedPlayers.length }}</span>
      </div>

      <div
        v-if="selectedPlayers.length === 0"
        class="rounded-lg bg-slate-900/40 px-3 py-4 text-center text-xs text-slate-500"
      >
        Выберите игроков слева
      </div>

      <ul v-else class="max-h-64 space-y-1 overflow-y-auto pr-1" role="list">
        <li
          v-for="p in selectedPlayers"
          :key="p.id"
          class="flex min-w-0 items-center justify-between gap-2 rounded bg-slate-800/50 px-2 py-1"
        >
          <span class="min-w-0 truncate text-sm text-slate-100">
            {{ displayPlayerLabel(p) }}
          </span>
          <button
            type="button"
            class="shrink-0 rounded px-2 py-1 text-xs text-slate-400 transition hover:text-red-400 focus:outline-none"
            @click="emit('removePlayer', p.id)"
          >
            Убрать
          </button>
        </li>
      </ul>

      <button
        type="button"
        class="w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none"
        :class="selectedPlayers.length > 0 ? 'bg-emerald-500 text-slate-900 hover:bg-emerald-400' : 'bg-slate-700 text-slate-400 cursor-not-allowed'"
        :disabled="selectedPlayers.length === 0"
        @click="emit('goToTeams')"
      >
        Перейти к командам →
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import { usePlayerDisplay } from '~/composables/usePlayerDisplay'

defineProps<{
  selectedPlayers: Player[]
}>()
// Это список игроков, которые уже выбраны в турнир.

const emit = defineEmits<{
  removePlayer: [id: number]
  goToTeams: []
}>()
// Эти события возвращают действия наверх (убрать игрока или перейти дальше).

const { displayPlayerLabel } = usePlayerDisplay()
// Это нужно, чтобы показывать одинаковый формат имени, как и в списке слева.
</script>
