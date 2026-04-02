<!-- Компонент StepPlayersSelectedPanel: выбранные игроки на тех же атомах, что библиотека. -->
<template>
  <section class="min-w-0 space-y-4 lg:col-span-2">
    <AtomsTournamentPanel as="div">
      <div class="flex items-center justify-end gap-2">
        <span class="text-xs text-slate-400">{{ selectedPlayers.length }}</span>
      </div>

      <AtomsEmptyStateBox v-if="selectedPlayers.length === 0">
        Выберите игроков слева
      </AtomsEmptyStateBox>

      <AtomsPlayerListUl v-else>
        <MoleculesPlayerListRow
          v-for="p in selectedPlayers"
          :key="p.id"
          v-bind="selectedPlayerRowBind(p)"
          action="remove"
          @activate="emit('removePlayer', p.id)"
        />
      </AtomsPlayerListUl>

      <AtomsPrimaryButton
        size="block"
        :variant="selectedPlayers.length > 0 ? 'solid' : 'muted'"
        :disabled="selectedPlayers.length === 0"
        @click="emit('goToTeams')"
      >
        Перейти к командам →
      </AtomsPrimaryButton>
    </AtomsTournamentPanel>
  </section>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import { usePlayerDisplay } from '~/composables/usePlayerDisplay'

defineProps<{
  selectedPlayers: Player[]
}>()

const emit = defineEmits<{
  removePlayer: [id: number]
  goToTeams: []
}>()

const { displayPlayerLabel, playerLabelRatingParts } = usePlayerDisplay()

function selectedPlayerRowBind(p: Player) {
  const { name, rating } = playerLabelRatingParts(p)
  return {
    photo: p.photo,
    avatarFallbackName: p.name,
    label: name,
    rating,
    title: `Убрать из турнира: ${displayPlayerLabel(p)}`,
  }
}
</script>
