<template>
  <details class="reserve-panel group rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/60">
    <summary class="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500 dark:hover:bg-slate-800/70 sm:px-4 [&::-webkit-details-marker]:hidden">
      <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200" aria-hidden="true">
        <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v2" />
        </svg>
      </span>
      <span class="min-w-0 flex-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Резервные места</span>
      <span v-if="total" class="shrink-0 rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold tabular-nums text-amber-900 dark:bg-amber-400/15 dark:text-amber-200">
        <span class="sr-only">Зарезервировано мест: </span>{{ total }}
      </span>
      <svg class="size-4 shrink-0 text-slate-500 group-open:rotate-180 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </summary>
    <form class="space-y-4 border-t border-slate-200 p-3 dark:border-slate-700 sm:p-4" @submit.prevent="addReserve">
      <div class="reserve-fields grid min-w-0 gap-3" :class="{ 'reserve-fields--with-team': teamSlots.length }">
        <div class="grid min-w-0 gap-1">
          <label :for="seatsId" :class="labelClass">Количество мест</label>
          <div class="flex w-fit items-center rounded-xl border border-slate-300 bg-white focus-within:border-brand-500 dark:border-slate-600 dark:bg-slate-800/80 dark:focus-within:border-brand-400">
            <button type="button" aria-label="Уменьшить количество мест" :class="stepClass" class="rounded-l-xl" :disabled="busy || Number(seats) <= 1" @click="changeSeats(-1)">−</button>
            <input
              :id="seatsId"
              v-model.number="seats"
              type="number"
              min="1"
              :max="maxSeats"
              inputmode="numeric"
              required
              :disabled="busy"
              class="reserve-count h-11 w-12 min-w-0 border-x border-slate-200 bg-transparent p-0 text-center text-base font-semibold tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500 dark:border-slate-700 dark:text-slate-100"
            >
            <button type="button" aria-label="Увеличить количество мест" :class="stepClass" class="rounded-r-xl" :disabled="busy || Number(seats) >= maxSeats" @click="changeSeats(1)">+</button>
          </div>
        </div>
        <label v-if="teamSlots.length" class="grid min-w-0 gap-1" :class="labelClass">
          <span>Команда</span>
          <span class="relative block min-w-0">
            <select v-model="team" :class="fieldClass" class="appearance-none pr-9" required :disabled="busy">
              <option value="" disabled>Выберите команду</option>
              <option v-for="slot in teamSlots" :key="slot">{{ slot }}</option>
            </select>
            <svg class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </label>
        <label class="reserve-note grid min-w-0 gap-1" :class="labelClass">
          <span>Заметка для админа</span>
          <input v-model.trim="note" type="text" maxlength="120" placeholder="Например, для Саши" :class="fieldClass" :disabled="busy">
        </label>
      </div>
      <p v-if="error" role="alert" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{{ error }}</p>
      <div class="reserve-footer grid items-center gap-3 border-t border-slate-200 pt-3 dark:border-slate-700">
        <p class="text-xs leading-normal text-slate-600 dark:text-slate-400">Нажмите на место в списке «В игре», чтобы выбрать игрока. Кнопка «×» снимает резерв.</p>
        <AtomsPrimaryButton native-type="submit" size="md" class="w-full" :disabled="busy || (teamSlots.length > 0 && !team)">
          {{ busy ? 'Резервируем…' : 'Зарезервировать' }}
        </AtomsPrimaryButton>
      </div>
    </form>
  </details>
</template>

<script setup lang="ts">
import type { ReserveAction, TournamentReserve } from '~/utils/tournamentReserves'

const props = defineProps<{
  reserves: TournamentReserve[]
  teamSlots: string[]
  updateReserve: (action: ReserveAction) => Promise<void>
}>()

const seatsId = useId()
const maxSeats = 200
const labelClass = 'text-xs font-medium text-slate-700 dark:text-slate-300'
const fieldClass = 'h-[2.875rem] w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-400'
const stepClass = 'grid size-11 shrink-0 place-items-center text-lg font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-slate-700'
const seats = ref<number | ''>(1)
const note = ref('')
const team = ref('')
const busy = ref(false)
const error = ref('')
const total = computed(() => props.reserves.reduce((sum, reserve) => sum + reserve.seats, 0))

function changeSeats(delta: number) {
  seats.value = Math.min(maxSeats, Math.max(1, Math.trunc(Number(seats.value)) + delta))
}

async function addReserve() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await props.updateReserve({ action: 'add', seats: Number(seats.value), team: props.teamSlots.length ? team.value : '', note: note.value })
    seats.value = 1
    note.value = ''
  } catch (err) {
    error.value = (err as { data?: { data?: { message?: string } } }).data?.data?.message ?? 'Не удалось обновить резерв. Попробуйте ещё раз.'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.reserve-panel {
  container-type: inline-size;
}

.reserve-count {
  appearance: textfield;
}

.reserve-count::-webkit-inner-spin-button,
.reserve-count::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
}

@container (min-width: 24rem) {
  .reserve-fields {
    grid-template-columns: max-content minmax(0, 1fr);
  }

  .reserve-fields--with-team .reserve-note {
    grid-column: 1 / -1;
  }

  .reserve-footer {
    grid-template-columns: minmax(0, 1fr) auto;
  }
}

@container (min-width: 34rem) {
  .reserve-fields--with-team {
    grid-template-columns: max-content minmax(0, 2fr) minmax(0, 3fr);
  }

  .reserve-fields--with-team .reserve-note {
    grid-column: auto;
  }
}
</style>
