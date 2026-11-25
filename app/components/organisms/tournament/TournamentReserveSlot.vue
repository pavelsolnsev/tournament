<template>
  <li class="min-w-0 rounded-xl border border-dashed border-amber-500/40 bg-amber-50 dark:bg-amber-400/10">
    <div class="flex min-w-0 items-center pr-1">
      <button
        type="button"
        class="flex min-h-[3.25rem] min-w-0 flex-1 items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition-colors hover:bg-amber-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
        :aria-expanded="open"
        aria-haspopup="dialog"
        :disabled="busy"
        @click="openDialog"
      >
        <AtomsTournamentReserveRow :reserve="reserve" />
        <svg class="size-4 shrink-0 text-amber-700 dark:text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>
      <button
        type="button"
        class="grid size-11 shrink-0 place-items-center rounded-lg text-red-700 transition-colors hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 disabled:opacity-50 dark:text-red-300"
        aria-label="Снять резерв"
        title="Снять резерв"
        :disabled="busy"
        @click="perform({ action: 'release', id: reserve.reserveId, expectedSeats: reserve.seats })"
      >
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
    <p v-if="error && !open" role="alert" class="px-3 pb-2 text-sm text-red-700 dark:text-red-300">{{ error }}</p>
    <Teleport to="body">
      <dialog
        v-if="open"
        ref="dialog"
        :aria-label="reserve.label"
        class="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        @cancel.prevent="dismiss"
        @click.self="dismiss"
      >
        <div class="space-y-4 p-4">
          <div class="flex min-w-0 items-start justify-between gap-2">
            <AtomsTournamentReserveRow :reserve="reserve" class="self-center" />
            <button
              type="button"
              autofocus
              class="grid size-11 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Закрыть"
              :disabled="busy"
              @click="dismiss"
            >
              <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <form class="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/70" @submit.prevent="claim">
            <div class="space-y-2">
              <label :for="searchId" class="block text-sm font-semibold text-slate-900 dark:text-slate-100">Поиск игрока</label>
              <div class="relative">
                <svg class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <circle cx="10.5" cy="10.5" r="5.5" />
                  <path d="m15 15 4 4" stroke-linecap="round" />
                </svg>
                <AtomsTournamentTextInput
                  :id="searchId"
                  v-model="search"
                  type="search"
                  variant="search"
                  input-class="min-h-11 !pl-9"
                  placeholder="Имя или @ник"
                  autocomplete="off"
                  :disabled="busy"
                  @keydown.enter.prevent
                />
              </div>
            </div>
            <fieldset v-if="matches.length" class="min-w-0" :disabled="busy">
              <legend class="sr-only">Игроки из очереди и базы</legend>
              <div class="grid max-h-60 min-w-0 gap-1.5 overflow-y-auto overscroll-contain pr-1">
                <label
                  v-for="{ player, username, queued } in matches"
                  :key="player.id"
                  class="flex min-h-12 min-w-0 cursor-pointer items-center gap-2 rounded-lg border bg-white px-2 py-2 transition-colors focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand-500 dark:bg-slate-800/70"
                  :class="playerId === player.id
                    ? 'border-brand-500 dark:border-brand-400'
                    : 'border-slate-200 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500'"
                >
                  <AtomsPlayerAvatar :photo="player.photo" :fallback-name="player.name" size="sm" aria-hidden="true" />
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100" :title="player.name">{{ player.name }}</span>
                    <span v-if="username" class="mt-1 block truncate text-xs leading-tight text-slate-600 dark:text-slate-400" :title="`@${username}`">@{{ username }}</span>
                  </span>
                  <span v-if="queued" class="shrink-0 rounded-md bg-amber-100 px-1.5 py-1 text-[11px] font-medium text-amber-900 dark:bg-amber-400/15 dark:text-amber-200">В очереди</span>
                  <input v-model="playerId" :name="searchId" :value="player.id" type="radio" class="size-4 shrink-0 accent-brand-600 dark:accent-brand-400">
                </label>
              </div>
            </fieldset>
            <p v-else role="status" class="rounded-lg border border-dashed border-slate-300 p-3 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
              {{ candidates.length ? 'Игроки не найдены.' : 'Нет доступных игроков.' }}
            </p>
            <div class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 pt-3 dark:border-slate-700">
              <p v-if="selectedPlayer" class="min-w-0 flex-1 basis-full break-words text-xs text-slate-600 dark:text-slate-400 sm:basis-28">
                Выбран игрок <span class="font-semibold text-slate-900 dark:text-slate-100">{{ selectedPlayer.name }}</span>
              </p>
              <AtomsPrimaryButton native-type="submit" size="md" class="w-full sm:ml-auto sm:w-auto" :disabled="busy || !selectedPlayer">
                {{ busy ? 'Добавляем…' : 'Подтвердить' }}
              </AtomsPrimaryButton>
            </div>
          </form>
          <p v-if="error" role="alert" class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
        </div>
      </dialog>
    </Teleport>
  </li>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import type { ReserveAction, ReservePlayerRow } from '~/utils/tournamentReserves'

const props = defineProps<{
  reserve: ReservePlayerRow
  open: boolean
  availablePlayers: Player[]
  queuedPlayers: { player: Player }[]
  updateReserve: (action: ReserveAction) => Promise<void>
}>()
const emit = defineEmits<{ toggle: []; close: [] }>()

const searchId = useId()
const dialog = ref<HTMLDialogElement | null>(null)
const search = ref('')
const playerId = ref(0)
const busy = ref(false)
const error = ref('')
watch(dialog, element => element?.showModal(), { flush: 'post' })
const candidates = computed(() => [
  ...props.queuedPlayers.map(({ player }) => ({ player, queued: true })),
  ...props.availablePlayers.map(player => ({ player, queued: false })),
].map(item => ({ ...item, username: item.player.username?.trim().replace(/^@+/, '') ?? '' })))
const selectedPlayer = computed(() => candidates.value.find(({ player }) => player.id === playerId.value)?.player)
const matches = computed(() => {
  const term = search.value.trim().toLowerCase()
  const nickname = term.replace(/^@+/, '')
  return candidates.value.filter(({ player, username }) =>
    player.name.toLowerCase().includes(term) || (!!username && username.toLowerCase().includes(nickname)),
  )
})

watch(() => props.open, (open) => {
  if (open) return
  search.value = ''
  playerId.value = 0
  error.value = ''
})

function openDialog(event: MouseEvent) {
  error.value = ''
  if (event.currentTarget instanceof HTMLButtonElement) event.currentTarget.focus({ preventScroll: true })
  emit('toggle')
}

function close() {
  dialog.value?.close()
  emit('close')
}

function dismiss() {
  if (!busy.value) close()
}

async function perform(action: ReserveAction) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await props.updateReserve(action)
    close()
  } catch (err) {
    error.value = (err as { data?: { data?: { message?: string } } }).data?.data?.message ?? 'Не удалось обновить резерв. Попробуйте ещё раз.'
  } finally {
    busy.value = false
  }
}

function claim() {
  if (selectedPlayer.value) return perform({ action: 'claim', id: props.reserve.reserveId, expectedSeats: props.reserve.seats, playerId: selectedPlayer.value.id })
}
</script>
