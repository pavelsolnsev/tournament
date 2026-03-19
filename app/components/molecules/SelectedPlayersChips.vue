<template>
  <ul class="flex min-w-0 flex-wrap gap-2">
    <li
      v-for="p in players"
      :key="p.id"
    >
      <AtomsChip
        :label="p.username || p.name"
        @click="emit('remove', p.id)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'

// Молекула, отображающая выбранных игроков в виде набора кликаемых чипов.
// По клику по чипу удаляем игрока.
defineProps<{
  players: Player[]
}>()

const emit = defineEmits<{ remove: [id: number] }>()
</script>
