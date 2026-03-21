<template>
  <AtomsPlayerListUl>
    <MoleculesPlayerListRow
      v-for="p in players"
      :key="p.id"
      :label="displayPlayerLabel(p)"
      :title="'Убрать из списка: ' + displayPlayerLabel(p)"
      action="remove"
      @activate="emit('remove', p.id)"
    />
  </AtomsPlayerListUl>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import { usePlayerDisplay } from '~/composables/usePlayerDisplay'

defineProps<{
  players: Player[]
}>()

const emit = defineEmits<{ remove: [id: number] }>()

const { displayPlayerLabel } = usePlayerDisplay()
</script>
