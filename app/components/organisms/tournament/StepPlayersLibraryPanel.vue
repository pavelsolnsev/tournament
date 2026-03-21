<!-- Компонент StepPlayersLibraryPanel: список игроков, поиск и создание — на общих атомах турнира. -->
<template>
  <AtomsTournamentPanel as="section" root-class="lg:col-span-3">
    <AtomsPanelHeading>Игроки</AtomsPanelHeading>

    <AtomsTournamentTextInput
      :model-value="playerSearch"
      variant="search"
      size="xs"
      placeholder="Поиск…"
      @update:model-value="emit('update:playerSearch', $event)"
    />

    <form class="flex items-end gap-2" @submit.prevent="onCreatePlayer">
      <AtomsTournamentTextInput
        v-model="newName"
        variant="field"
        size="xs"
        placeholder="Имя нового игрока"
        input-class="min-w-0 flex-1"
      />
      <AtomsTournamentTextInput
        v-model="newUsername"
        variant="field"
        size="xs"
        placeholder="@username"
        :block="false"
        input-class="w-28"
      />
      <AtomsPrimaryButton
        native-type="submit"
        size="sm"
        :disabled="!newName.trim() || creating"
      >
        {{ creating ? '…' : '+' }}
      </AtomsPrimaryButton>
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
    <AtomsPlayerListUl v-else>
      <MoleculesPlayerListRow
        v-for="p in filteredAvailablePlayers"
        :key="p.id"
        :label="displayPlayerLabel(p)"
        :title="'Добавить в турнир: ' + displayPlayerLabel(p)"
        action="add"
        @activate="emit('selectPlayer', p.id)"
      />
    </AtomsPlayerListUl>
    <p v-if="filteredAvailablePlayers.length === 0 && availablePlayers.length > 0" class="text-slate-500 text-xs">
      Ничего не найдено.
    </p>
  </AtomsTournamentPanel>
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

const emit = defineEmits<{
  selectPlayer: [id: number]
  'update:playerSearch': [value: string]
  refreshPlayers: []
}>()

const newName = ref('')
const newUsername = ref('')
const creating = ref(false)
const createError = ref('')

const { displayPlayerLabel } = usePlayerDisplay()

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
</script>
