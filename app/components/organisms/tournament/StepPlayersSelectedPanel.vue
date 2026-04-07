<!-- Компонент StepPlayersSelectedPanel: выбранные игроки на тех же атомах, что библиотека. -->
<template>
  <section class="min-w-0 space-y-4 lg:col-span-2">
    <AtomsTournamentPanel as="div">
      <div class="flex items-center justify-end gap-2">
        <span class="text-xs text-slate-600 dark:text-slate-400">{{ selectedPlayers.length }}</span>
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

      <!-- Подсказка почему кнопка заблокирована — показывается если нет места или формата -->
      <p
        v-if="selectedPlayers.length > 0 && !canGoToTeams"
        class="text-center text-xs text-amber-600 dark:text-amber-400"
      >
        Укажите место и формат
      </p>

      <AtomsPrimaryButton
        size="block"
        :variant="canGoToTeams ? 'solid' : 'muted'"
        :disabled="!canGoToTeams"
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
  // Разрешение перейти к командам — true только когда выбраны игроки, место и формат.
  canGoToTeams: boolean
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
