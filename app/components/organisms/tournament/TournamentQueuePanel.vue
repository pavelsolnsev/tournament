<template>
  <section class="min-w-0 rounded-xl bg-amber-50 px-3 py-2 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
    <h3 class="text-sm font-semibold">В очереди · {{ players.length }}</h3>
    <ul class="mt-1 divide-y divide-amber-900/10 dark:divide-amber-200/10">
      <li v-for="{ player, team } in players" :key="player.id" class="flex min-w-0 items-center gap-2">
        <span class="min-w-0 flex-1 truncate text-sm" :title="getPlayerDisplayName(player)">
          <span v-if="team" class="font-medium">{{ team }} · </span>{{ getPlayerDisplayName(player) }}
        </span>
        <button
          type="button"
          class="grid size-11 shrink-0 place-items-center rounded-lg text-red-700 transition-colors hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 dark:text-red-300"
          :aria-label="`Убрать из очереди: ${getPlayerDisplayName(player)}`"
          title="Убрать из очереди"
          @click="emit('remove', player.id)"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import { getPlayerDisplayName } from '~/composables/usePlayerDisplay'

defineProps<{ players: { player: Player, team: string }[] }>()
const emit = defineEmits<{ remove: [id: number] }>()
</script>
