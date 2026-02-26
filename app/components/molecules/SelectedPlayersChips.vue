<template>
  <ul class="flex min-w-0 flex-wrap gap-2">
    <li
      v-for="p in players"
      :key="p.id"
    >
      <AtomsChip
        :label="p.name"
        :secondary="p.username ?? undefined"
        @click="emit('remove', p.id)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'

defineProps<{
  players: Player[]
}>()

const emit = defineEmits<{ remove: [id: number] }>()
</script>
