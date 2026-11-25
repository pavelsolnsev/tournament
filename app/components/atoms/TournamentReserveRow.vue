<template>
  <span class="flex min-w-0 items-center gap-2">
    <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200" aria-hidden="true">🔒</span>
    <span class="min-w-0">
      <span class="block text-sm font-semibold text-amber-950 dark:text-amber-100">{{ reserve.label }}</span>
      <span v-if="reserve.team || reserve.note" class="block break-words text-xs text-amber-800 dark:text-amber-200">{{ [reserve.team, reserve.note].filter(Boolean).join(' · ') }}</span>
    </span>
  </span>
</template>

<script setup lang="ts">
import type { ReservePlayerRow } from '~/utils/tournamentReserves'

defineProps<{ reserve: ReservePlayerRow }>()
</script>
