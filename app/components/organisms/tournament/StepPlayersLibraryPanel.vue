<!-- Компонент StepPlayersLibraryPanel: создание игрока, поиск, список — на общих атомах турнира. -->
<template>
  <AtomsTournamentPanel
    as="section"
    root-class="w-full min-w-0 overflow-x-hidden lg:col-span-2 lg:max-w-md lg:justify-self-start xl:max-w-lg"
  >
    <!-- Сначала добавление игрока, ниже поиск по списку — так порядок действий сверху вниз. -->
    <form class="flex w-full min-w-0 flex-col gap-2" @submit.prevent="onCreatePlayer">
      <p class="text-xs font-medium text-slate-600 dark:text-slate-400">Добавьте игрока</p>

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
        :disabled="!canManagePlayers || !newName.trim() || creating"
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

    <p v-if="!players?.length" class="text-xs text-slate-600 dark:text-slate-400">
      Нет игроков в базе.
    </p>
    <p v-else-if="availablePlayers.length === 0" class="text-xs text-slate-600 dark:text-slate-400">
      Все игроки уже выбраны.
    </p>
    <AtomsPlayerListUl v-else>
      <li
        v-for="p in filteredAvailablePlayers"
        :key="p.id"
        class="flex min-w-0 flex-col gap-1"
      >
        <!-- Строка игрока с двумя кнопками: добавить в турнир и удалить из базы. -->
        <div class="flex min-w-0 items-center gap-1">
          <MoleculesPlayerListRow
            class="min-w-0 flex-1"
            v-bind="libraryPlayerRowBind(p)"
            action="add"
            @activate="emit('selectPlayer', p.id)"
          />
          <!-- Кнопка удаления — маленькая, красная, справа от строки. -->
          <button
            type="button"
            class="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/30 text-red-500 transition-colors hover:bg-red-500/10 active:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
            :title="`Удалить ${p.name} из базы`"
            :disabled="!canManagePlayers"
            @click="openDeleteConfirm(p.id)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        <!-- Панель подтверждения удаления — появляется под строкой игрока. -->
        <MoleculesDangerConfirmInline
          v-if="deleteConfirmId === p.id"
          :open="true"
          :seconds-left="deleteConfirmSecondsLeft"
          :busy="deleting"
          :aria-label="`Подтверждение удаления ${p.name}`"
          :title="`Удалить «${p.name}» навсегда?`"
          cancel-text="Отмена"
          confirm-text="Удалить"
          busy-text="Удаляем…"
          @cancel="closeDeleteConfirm"
          @confirm="confirmDelete(p.id)"
        />
      </li>
    </AtomsPlayerListUl>
    <p v-if="filteredAvailablePlayers.length === 0 && availablePlayers.length > 0" class="text-xs text-slate-600 dark:text-slate-400">
      Ничего не найдено.
    </p>

    <!-- Reset только на lg+: на телефоне кнопку не показываем — реже случайное нажатие. -->
    <div v-if="canManagePlayers" ref="resetConfirmAnchor" class="mt-6 hidden flex-col items-center lg:flex">
      <button
        type="button"
        class="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-300 active:bg-slate-200 dark:active:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-40"
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
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { usePlayerDisplay } from '~/composables/usePlayerDisplay'
import { useAdminAuth } from '~/composables/useAdminAuth'
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

// Simple10: Ограниченный админ (limited) не может создавать/удалять игроков и делать reset.
const { adminRole } = useAdminAuth()
const canManagePlayers = computed(() => adminRole.value === 'full')

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

const resetConfirmAnchor = useTemplateRef<HTMLDivElement>('resetConfirmAnchor')

const isResetConfirmOpen = ref(false)
const resetConfirmSecondsLeft = ref(0)
const resetConfirmIntervalId = ref<ReturnType<typeof setInterval> | null>(null)

// Состояние удаления игрока — id игрока у которого открыто подтверждение.
const deleteConfirmId = ref<number | null>(null)
const deleteConfirmSecondsLeft = ref(0)
const deleteConfirmIntervalId = ref<ReturnType<typeof setInterval> | null>(null)
const deleting = ref(false)

function openDeleteConfirm(playerId: number) {
  // Simple10: Для limited блокируем удаление игроков.
  if (!canManagePlayers.value) return
  // Закрываем предыдущее подтверждение если было открыто для другого игрока.
  closeDeleteConfirm()
  deleteConfirmId.value = playerId
  deleteConfirmSecondsLeft.value = 3

  // Таймер 3 сек — кнопка «Удалить» станет активной только после отсчёта.
  deleteConfirmIntervalId.value = setInterval(() => {
    deleteConfirmSecondsLeft.value = Math.max(0, deleteConfirmSecondsLeft.value - 1)
    if (deleteConfirmSecondsLeft.value === 0 && deleteConfirmIntervalId.value) {
      clearInterval(deleteConfirmIntervalId.value)
      deleteConfirmIntervalId.value = null
    }
  }, 1000)
}

function closeDeleteConfirm() {
  deleteConfirmId.value = null
  deleteConfirmSecondsLeft.value = 0
  if (deleteConfirmIntervalId.value) {
    clearInterval(deleteConfirmIntervalId.value)
    deleteConfirmIntervalId.value = null
  }
}

async function confirmDelete(playerId: number) {
  // Simple10: Для limited блокируем удаление игроков (защита от ручного вызова).
  if (!canManagePlayers.value) return
  deleting.value = true
  try {
    // Удаляем игрока из базы через API.
    await $fetch(`/api/players/${playerId}`, { method: 'DELETE' })
    closeDeleteConfirm()
    // Обновляем список — игрок исчезнет из UI.
    emit('refreshPlayers')
  } catch {
    closeDeleteConfirm()
  } finally {
    deleting.value = false
  }
}

async function onCreatePlayer() {
  // Simple10: Для limited блокируем создание игроков.
  if (!canManagePlayers.value) return
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
  // Simple10: Для limited блокируем reset игроков.
  if (!canManagePlayers.value) return
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

  // Прокручиваем к панели подтверждения — на больших экранах блок с Reset внизу панели.
  void nextTick(() => {
    resetConfirmAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  })
}

async function confirmResetPlayers() {
  // Это финальное подтверждение reset — оно появляется только после отдельного шага.
  // Сбрасываем ошибку и показываем состояние загрузки.
  // Simple10: Для limited блокируем reset игроков (защита от ручного вызова).
  if (!canManagePlayers.value) return
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
