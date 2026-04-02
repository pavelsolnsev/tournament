<!-- Компонент StepPlayersLibraryPanel: создание игрока, поиск, список — на общих атомах турнира. -->
<template>
  <AtomsTournamentPanel as="section" root-class="lg:col-span-3">
    <!-- Сначала добавление игрока, ниже поиск по списку — так порядок действий сверху вниз. -->
    <form class="flex w-full min-w-0 flex-col gap-2" @submit.prevent="onCreatePlayer">
      <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Новый игрок</p>

      <AtomsTournamentTextInput
        v-model="newName"
        variant="field"
        size="sm"
        placeholder="Имя"
        input-class="h-12"
      />

      <AtomsTournamentTextInput
        v-model="newUsername"
        variant="field"
        size="sm"
        placeholder="@username"
        input-class="h-12"
      />

      <AtomsPrimaryButton
        native-type="submit"
        size="block"
        :disabled="!newName.trim() || creating"
      >
        {{ creating ? 'Добавляем…' : 'Добавить' }}
      </AtomsPrimaryButton>
    </form>

    <p v-if="createError" class="text-[11px] text-red-600 dark:text-red-400">
      {{ createError }}
    </p>
    <p v-if="resetError" class="text-[11px] text-red-600 dark:text-red-400">
      {{ resetError }}
    </p>

    <!-- Разделитель между формой и поиском -->
    <div class="border-t border-slate-300 dark:border-slate-700/40" />

    <AtomsTournamentTextInput
      :model-value="playerSearch"
      variant="search"
      size="xs"
      placeholder="Поиск…"
      @update:model-value="emit('update:playerSearch', $event)"
    />

    <!-- Разделитель между поиском и списком -->
    <div class="border-t border-slate-300 dark:border-slate-700/40" />

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
        v-bind="libraryPlayerRowBind(p)"
        action="add"
        @activate="emit('selectPlayer', p.id)"
      />
    </AtomsPlayerListUl>
    <p v-if="filteredAvailablePlayers.length === 0 && availablePlayers.length > 0" class="text-slate-500 text-xs">
      Ничего не найдено.
    </p>

    <!-- Reset только на lg+: на телефоне кнопку не показываем — реже случайное нажатие. -->
    <div class="mt-6 hidden flex-col items-center lg:flex">
      <button
        type="button"
        class="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-700 dark:hover:text-slate-300 active:bg-slate-200 dark:active:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="resetting"
        @click="openResetConfirm"
      >
        {{ resetting ? 'Reset…' : 'Reset' }}
      </button>

      <MoleculesDangerConfirmInline
        class="mt-2 w-full"
        :open="isResetConfirmOpen"
        :seconds-left="resetConfirmSecondsLeft"
        :busy="resetting"
        aria-label="Подтверждение reset"
        title="Reset обнулит статистику у всех игроков."
        cancel-text="Отмена"
        confirm-text="Подтвердить reset"
        busy-text="Reset…"
        @cancel="closeResetConfirm"
        @confirm="confirmResetPlayers"
      />
    </div>
  </AtomsTournamentPanel>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import { ref } from 'vue'
import { usePlayerDisplay } from '~/composables/usePlayerDisplay'
import MoleculesDangerConfirmInline from '~/components/molecules/DangerConfirmInline.vue'

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

const { displayPlayerLabel, playerLabelRatingParts } = usePlayerDisplay()

function libraryPlayerRowBind(p: Player) {
  const { name, rating } = playerLabelRatingParts(p)
  return {
    photo: p.photo,
    avatarFallbackName: p.name,
    label: name,
    rating,
    title: `Добавить в турнир: ${displayPlayerLabel(p)}`,
  }
}

const resetting = ref(false)
const resetError = ref('')

const isResetConfirmOpen = ref(false)
const resetConfirmSecondsLeft = ref(0)
const resetConfirmIntervalId = ref<ReturnType<typeof setInterval> | null>(null)

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
      : '@unknown'
    // Пустое поле ника — на сервер уходит @unknown, в БД сохранится так же (normalizePlayerUsername).

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

function closeResetConfirm() {
  // Закрываем подтверждение, чтобы случайно не нажать reset позже.
  isResetConfirmOpen.value = false
  resetConfirmSecondsLeft.value = 0
  if (resetConfirmIntervalId.value) {
    clearInterval(resetConfirmIntervalId.value)
    resetConfirmIntervalId.value = null
  }
}

function openResetConfirm() {
  // Для Reset оставляем таймер, чтобы сложнее было нажать случайно.
  if (resetting.value) return
  resetError.value = ''
  isResetConfirmOpen.value = true
  resetConfirmSecondsLeft.value = 3

  if (resetConfirmIntervalId.value) clearInterval(resetConfirmIntervalId.value)
  resetConfirmIntervalId.value = setInterval(() => {
    resetConfirmSecondsLeft.value = Math.max(0, resetConfirmSecondsLeft.value - 1)
    if (resetConfirmSecondsLeft.value === 0 && resetConfirmIntervalId.value) {
      clearInterval(resetConfirmIntervalId.value)
      resetConfirmIntervalId.value = null
    }
  }, 1000)
}

async function confirmResetPlayers() {
  // Это финальное подтверждение reset — оно появляется только после отдельного шага.
  // Сбрасываем ошибку и показываем состояние загрузки.
  resetError.value = ''
  resetting.value = true
  try {
    // Вызываем API reset — оно обнуляет статистику в таблице players.
    await $fetch('/api/players/reset', { method: 'POST' })
    // Обновляем список игроков, чтобы UI сразу показал новые значения.
    emit('refreshPlayers')
    // Закрываем панель подтверждения после успешного reset.
    closeResetConfirm()
  } catch {
    resetError.value = 'Не удалось сделать reset'
  } finally {
    resetting.value = false
  }
}
</script>
