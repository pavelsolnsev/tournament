<!-- Компонент StepPlayersSelectedPanel: выбранные игроки на тех же атомах, что библиотека. -->
<template>
  <section class="min-w-0 space-y-4">
    <AtomsTournamentPanel as="div">
      <!-- Заголовок панели: одна строка на всех ширинах, счётчик в бейдже в стиле турнира. -->
      <div
        class="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white/70 px-3 py-2.5 dark:border-slate-700/55 dark:bg-slate-800/35"
        role="status"
        :aria-label="`В игре: ${selectedPlayers.length}`"
      >
        <div class="flex min-w-0 items-center gap-2">
          <span
            class="inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400"
            aria-hidden="true"
          />
          <span class="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            В игре
          </span>
        </div>
        <span
          class="inline-flex min-w-[2.5rem] shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 px-2.5 py-1 text-sm font-bold tabular-nums leading-none text-emerald-800 ring-1 ring-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-400/20"
        >
          {{ selectedPlayers.length }}
        </span>
      </div>

      <AtomsEmptyStateBox v-if="selectedPlayers.length === 0">
        Выберите игроков слева
      </AtomsEmptyStateBox>

      <AtomsPlayerListUl v-else>
        <MoleculesPlayerListRow
          v-for="p in selectedPlayers"
          :key="p.id"
          v-bind="selectedPlayerRowBind(p)"
          show-paid-toggle
          :player-paid="paidPlayerIds.has(p.id)"
          action="remove"
          @activate="emit('removePlayer', p.id)"
          @toggle-paid="emit('togglePlayerPaid', p.id, !paidPlayerIds.has(p.id))"
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
  paidPlayerIds: Set<number>
}>()

const emit = defineEmits<{
  removePlayer: [id: number]
  goToTeams: []
  togglePlayerPaid: [playerId: number, paid: boolean]
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
