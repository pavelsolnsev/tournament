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
        <div class="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/80 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:pointer-events-none disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-200"
            :title="tournamentSyncBusy ? 'Обновление…' : 'Обновить с сервера'"
            :aria-label="tournamentSyncBusy ? 'Обновление данных турнира' : 'Обновить данные турнира с сервера'"
            :aria-busy="tournamentSyncBusy"
            :disabled="tournamentSyncBusy"
            @click="emit('syncTournamentFromServer')"
          >
            <svg
              class="h-4 w-4 transition-transform duration-500"
              :class="tournamentSyncBusy && 'animate-spin'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
          <span
            class="inline-flex min-w-[2.5rem] items-center justify-center rounded-lg bg-emerald-500/15 px-2.5 py-1 text-sm font-bold tabular-nums leading-none text-emerald-800 ring-1 ring-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-400/20"
          >
            {{ selectedPlayers.length }}
          </span>
        </div>
      </div>

      <!-- Список кнопок ВК: только s tr (кнопки команд в чате), не s prof. -->
      <div
        v-if="vkTrTournament"
        class="space-y-2 rounded-xl border border-slate-200/80 bg-white/60 px-3 py-2.5 dark:border-slate-600/50 dark:bg-slate-800/25"
        role="region"
        aria-label="Команды для кнопок в чате ВК"
      >
        <div class="flex min-w-0 items-center gap-2">
          <AtomsVkLogoIcon size="md" />
          <p class="min-w-0 text-xs font-medium text-slate-600 dark:text-slate-400">
            Команды в списке ВК
          </p>
        </div>
        <p v-if="vkTeamSlots.length" class="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
          Лимит игроков в команде — стрелками − / +. Сверх лимита игроки идут в очередь этой команды.
        </p>
        <ul
          v-if="vkTeamSlots.length"
          class="flex flex-col gap-1.5"
        >
          <li
            v-for="name in vkTeamSlots"
            :key="name"
            class="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-900/70"
          >
            <span class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{{ name }}</span>

            <!-- Кастомный степпер лимита: минус / значение / плюс -->
            <div
              class="inline-flex shrink-0 items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80"
              role="group"
              :aria-label="`Лимит игроков в команде ${name}`"
            >
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                :disabled="effectiveLimit(name) <= 1"
                :title="`Уменьшить лимит «${name}»`"
                :aria-label="`Уменьшить лимит команды ${name}`"
                @click="stepLimit(name, -1)"
              >
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
              </button>
              <span
                class="min-w-[2rem] select-none px-1 text-center text-sm font-bold tabular-nums"
                :class="isExplicitLimit(name) ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400 dark:text-slate-500'"
                :title="isExplicitLimit(name) ? '' : 'Значение по умолчанию'"
                aria-live="polite"
              >{{ effectiveLimit(name) }}</span>
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                :disabled="effectiveLimit(name) >= 99"
                :title="`Увеличить лимит «${name}»`"
                :aria-label="`Увеличить лимит команды ${name}`"
                @click="stepLimit(name, 1)"
              >
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              </button>
            </div>

            <button
              type="button"
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 dark:hover:bg-red-950/40 dark:hover:text-red-300"
              :title="`Удалить «${name}»`"
              :aria-label="`Удалить команду ${name}`"
              @click="emit('removeVkTeamSlot', name, name)"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </li>
        </ul>
        <div class="flex min-w-0 items-center gap-1.5">
          <input
            v-model="newVkSlotDraft"
            type="text"
            maxlength="40"
            :disabled="vkTeamSlots.length >= 9"
            placeholder="Новая команда"
            class="min-h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100"
            @keydown.enter.prevent="submitNewVkSlot"
          />
          <button
            type="button"
            class="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
            :disabled="vkTeamSlots.length >= 9"
            title="Добавить"
            @click="submitNewVkSlot"
          >
            +
          </button>
        </div>
      </div>

      <div
        v-if="selectedPlayers.length > 0"
        class="flex flex-wrap gap-2"
        role="group"
        aria-label="Порядок отображения игроков в списке"
      >
        <button
          v-if="hasTeamsForFilter"
          type="button"
          class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          :class="[
            sortByTeam && 'border-emerald-500/50 bg-emerald-500/10 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-100',
            !sortByTeam && 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800',
          ]"
          :aria-pressed="sortByTeam"
          @click="sortByTeam = !sortByTeam"
        >
          По командам
        </button>
        <button
          type="button"
          class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          :class="[
            sortPaidFirst && 'border-emerald-500/50 bg-emerald-500/10 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-100',
            !sortPaidFirst && 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800',
          ]"
          :aria-pressed="sortPaidFirst"
          @click="sortPaidFirst = !sortPaidFirst"
        >
          Сначала оплатившие
        </button>
      </div>

      <AtomsEmptyStateBox v-if="selectedPlayers.length === 0">
        Выберите игроков в списке доступных.
      </AtomsEmptyStateBox>

      <AtomsPlayerListUl v-else>
        <MoleculesPlayerListRow
          v-for="p in displayedSelectedPlayers"
          :key="p.id"
          v-bind="selectedPlayerRowBind(p)"
          :caption="!vkListTournament ? null : (vkTeamOptionsForPicker.length > 0 ? null : (vkTeamLabelByPlayerId[p.id] || null))"
          :vk-team-slot-options="vkListTournament ? vkTeamOptionsForPicker : []"
          :vk-team-value="vkListTournament ? (vkTeamLabelByPlayerId[p.id] || null) : null"
          show-paid-toggle
          :player-paid="paidPlayerIds.has(p.id)"
          action="remove"
          @activate="emit('removePlayer', p.id)"
          @toggle-paid="emit('togglePlayerPaid', p.id, !paidPlayerIds.has(p.id))"
          @update-vk-team="(t) => emit('setPlayerVkTeam', p.id, t)"
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
import { computed, ref } from 'vue'
import type { Player } from '~/types/tournament'
import { usePlayerDisplay } from '~/composables/usePlayerDisplay'

const sortByTeam = ref(false)
const sortPaidFirst = ref(false)

const newVkSlotDraft = ref('')

function submitNewVkSlot() {
  const t = newVkSlotDraft.value.replace(/\s+/g, ' ').trim()
  if (!t) {
    return
  }
  emit('addVkTeamSlot', t)
  newVkSlotDraft.value = ''
}

const props = defineProps<{
  selectedPlayers: Player[]
  // Разрешение перейти к командам — true только когда выбраны игроки, место и формат.
  canGoToTeams: boolean
  paidPlayerIds: Set<number>
  /** Подписи команд с кнопок в ВК, по id игрока. */
  vkTeamLabelByPlayerId: Record<number, string>
  /** Имена команд с кнопок бота (s tr …). */
  vkTeamSlots: string[]
  /** Лимиты команд (ключ — нормализованное имя в нижнем регистре). */
  vkTeamLimits: Record<string, number>
  vkListTournament: boolean
  /** Режим s tr — показ блока «Команды в списке ВК» и привязка к кнопкам в чате. */
  vkTrTournament: boolean
  /** Пока идёт ручной sync state с сервера — крутим иконку. */
  tournamentSyncBusy?: boolean
}>()

/** Есть ли смысл показывать сортировку по командам: слоты ВК или хотя бы одна подпись у выбранных. */
const hasTeamsForFilter = computed(() => {
  if (!props.vkListTournament) {
    return false
  }
  if (props.vkTeamSlots.length > 0) {
    return true
  }
  return props.selectedPlayers.some((p) => (props.vkTeamLabelByPlayerId[p.id] || '').trim().length > 0)
})

function vkTeamSortKey(playerId: number): string {
  const t = (props.vkTeamLabelByPlayerId[playerId] || '').replace(/\s+/g, ' ').trim().toLowerCase()
  return t || '\uffff'
}

const displayedSelectedPlayers = computed(() => {
  const list = [...props.selectedPlayers]
  if (list.length <= 1) {
    return list
  }
  const origIdx = new Map(list.map((p, i) => [p.id, i] as const))
  const teamOn = sortByTeam.value && hasTeamsForFilter.value
  const paidOn = sortPaidFirst.value

  if (!teamOn && !paidOn) {
    return list
  }

  list.sort((a, b) => {
    if (teamOn) {
      const cmpTeam = vkTeamSortKey(a.id).localeCompare(vkTeamSortKey(b.id), 'ru')
      if (cmpTeam !== 0) {
        return cmpTeam
      }
    }
    if (paidOn) {
      const pa = props.paidPlayerIds.has(a.id) ? 1 : 0
      const pb = props.paidPlayerIds.has(b.id) ? 1 : 0
      if (pa !== pb) {
        return pb - pa
      }
    }
    return (origIdx.get(a.id) ?? 0) - (origIdx.get(b.id) ?? 0)
  })
  return list
})

/** Слоты бота + фактические подписи в составе — чтобы смена команды была в строке даже до синка слотов. */
const vkTeamOptionsForPicker = computed(() => {
  if (!props.vkListTournament) {
    return []
  }
  const seen = new Set<string>()
  const out: string[] = []
  const push = (raw: string) => {
    const t = raw.replace(/\s+/g, ' ').trim()
    if (!t) return
    const k = t.toLowerCase()
    if (seen.has(k)) return
    seen.add(k)
    out.push(t)
  }
  for (const s of props.vkTeamSlots) {
    push(s)
  }
  for (const p of props.selectedPlayers) {
    const lab = props.vkTeamLabelByPlayerId[p.id]
    if (lab) push(lab)
  }
  return out
})

const emit = defineEmits<{
  removePlayer: [id: number]
  goToTeams: []
  syncTournamentFromServer: []
  togglePlayerPaid: [playerId: number, paid: boolean]
  setPlayerVkTeam: [playerId: number, team: string | null]
  addVkTeamSlot: [name: string]
  removeVkTeamSlot: [value: string, label: string]
  setVkTeamLimit: [name: string, limit: number | null]
}>()

/** Дефолтный лимит команды — совпадает с DEFAULT_TEAM_LIMIT в боте. */
const DEFAULT_TEAM_LIMIT = 8

/** Ключ команды для карты лимитов: один пробел, без краёв, нижний регистр. */
function teamLimitKey(name: string): string {
  return String(name ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
}

/** Задан ли явный лимит команды (иначе действует значение по умолчанию). */
function isExplicitLimit(name: string): boolean {
  const v = props.vkTeamLimits?.[teamLimitKey(name)]
  return typeof v === 'number' && Number.isFinite(v) && v >= 1
}

/** Действующий лимит для показа в степпере: явный либо дефолт. */
function effectiveLimit(name: string): number {
  const v = props.vkTeamLimits?.[teamLimitKey(name)]
  return typeof v === 'number' && Number.isFinite(v) && v >= 1 ? v : DEFAULT_TEAM_LIMIT
}

/** Шаг лимита кнопками − / +: clamp 1..99, всегда фиксирует явное значение. */
function stepLimit(name: string, delta: number) {
  const next = Math.min(99, Math.max(1, effectiveLimit(name) + delta))
  emit('setVkTeamLimit', name, next)
}

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
