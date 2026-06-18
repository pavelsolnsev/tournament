<template>
  <!-- Клик мимо карточек снимает выделение игрока -->
  <div class="flex flex-col gap-4" @click="selectedPlayer = null">

    <!-- ── Доска: «Свободные» отдельным блоком сверху, сетка команд под ними ── -->
    <div class="flex flex-col gap-3 md:gap-4">

      <!-- «Свободные»: отдельный блок на всю ширину над командами -->
      <OrganismsPlayerTeamAssignmentKanbanColumn
        team-name=""
        :players="freePlayers"
        marker=""
        :color-index="0"
        :is-confirmed="false"
        :selected-player="selectedPlayer"
        :avg-team-rating="avgTeamRating"
        @player-clicked="onPlayerClick($event, '')"
        @move-here="onMoveHere('')"
        @drag-add="onDragAdd($event, '')"
      />

      <!-- Подтверждённые команды: адаптивная сетка без горизонтального скролла -->
      <div class="min-w-0">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2" :class="teamsGridClass">
          <OrganismsPlayerTeamAssignmentKanbanColumn
            v-for="team in confirmedTeams"
            :key="team"
            :team-name="team"
            :players="teamPlayersMap[team] ?? []"
            :marker="teamMarker(team)"
            :color-index="getTeamColor(team)"
            :is-confirmed="true"
            :selected-player="selectedPlayer"
            :avg-team-rating="avgTeamRating"
            @player-clicked="onPlayerClick($event, team)"
            @move-here="onMoveHere(team)"
            @drag-add="onDragAdd($event, team)"
            @confirm-team="emit('confirmTeam', team)"
            @unconfirm-team="emit('unconfirmTeam', team)"
            @set-color="(ci) => emit('setTeamColor', team, ci)"
          />
        </div>

        <!-- Подсказка когда нет ни одной подтверждённой команды -->
        <div
          v-if="confirmedTeams.length === 0"
          class="flex items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-sm text-slate-400 dark:border-slate-700/50 dark:text-slate-600"
        >
          Подтвердите команду ниже чтобы начать
        </div>
      </div>

    </div>

    <!-- ── Полоса неактивных команд и добавления ── -->
    <div
      v-if="unconfirmedTeams.length > 0 || canManageTeams"
      class="rounded-xl border border-slate-200/80 bg-slate-50 dark:border-slate-700/40 dark:bg-slate-800/30"
      @click.stop
    >
      <!-- Заголовок секции -->
      <div class="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Не участвуют
        </span>
        <span
          v-if="unconfirmedTeams.length > 0"
          class="rounded-full bg-slate-200 px-1.5 py-0.5 text-xs tabular-nums text-slate-600 dark:bg-slate-700/60 dark:text-slate-400"
        >{{ unconfirmedTeams.length }}</span>
      </div>

      <!-- Список неактивных команд + кнопка добавления -->
      <div class="flex flex-wrap gap-2 px-3 pb-3">

        <!-- Каждая неактивная команда — компактная карточка -->
        <div
          v-for="team in unconfirmedTeams"
          :key="team"
          class="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-700/50 dark:bg-slate-900/40"
        >
          <!-- Логотип или цветной маркер команды -->
          <AtomsTeamMarkerOrLogo
            :team-name="team"
            :marker="teamMarker(team)"
            size="sm"
            class="shrink-0"
          />
          <span class="max-w-[8rem] truncate text-sm font-medium text-slate-800 dark:text-slate-100" :title="team">
            {{ team }}
          </span>
          <span class="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs tabular-nums text-slate-500 dark:bg-slate-700/60 dark:text-slate-400">
            {{ (teamPlayersMap[team] ?? []).length }}
          </span>

          <!-- Кнопки: цвет, подтвердить, удалить -->
          <div class="flex items-center gap-0.5">
            <MoleculesDropdownSelect
              :model-value="getTeamColor(team)"
              title="Цвет команды"
              :options="colorOptions"
              @update:model-value="emit('setTeamColor', team, Number($event))"
            />
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-sm text-emerald-800 dark:text-emerald-300 transition-colors md:hover:bg-emerald-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              title="Подтвердить участие"
              @click="emit('confirmTeam', team)"
            >✓</button>
            <button
              v-if="canManageTeams"
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 dark:text-slate-600 transition-colors md:hover:bg-red-500/10 md:hover:text-red-500 dark:md:hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
              title="Удалить команду"
              @click="openRemoveConfirm(team)"
            >✕</button>
          </div>
        </div>

        <!-- Добавить новую команду — форма или кнопка -->
        <template v-if="canManageTeams">
          <div
            v-if="showAddInput"
            class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-700/50 dark:bg-slate-900/40"
          >
            <AtomsTournamentTextInput
              ref="addInputRef"
              :model-value="newTeamNameValue"
              variant="field"
              size="xs"
              placeholder="Название…"
              class="w-36"
              @update:model-value="emit('update:newTeamName', $event)"
              @keydown.enter.prevent="submitAddTeam"
              @keydown.escape.prevent="showAddInput = false"
            />
            <button
              type="button"
              class="inline-flex h-8 items-center justify-center rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white transition-colors md:hover:bg-emerald-400 focus:outline-none"
              @click="submitAddTeam"
            >Создать</button>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors md:hover:bg-slate-100 dark:md:hover:bg-slate-800 focus:outline-none"
              @click="showAddInput = false"
            >✕</button>
          </div>

          <button
            v-else
            type="button"
            class="flex h-[2.625rem] items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 text-sm font-medium text-slate-500 transition-colors dark:border-slate-600/60 dark:text-slate-500 md:hover:border-emerald-400/60 md:hover:text-emerald-600 dark:md:hover:border-emerald-500/40 dark:md:hover:text-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
            @click.stop="openAddInput"
          >
            <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Добавить команду
          </button>
        </template>

      </div>

      <!-- Подтверждение удаления неактивной команды -->
      <MoleculesConfirmInline
        v-if="removeConfirmTeamName && !isTeamConfirmed(removeConfirmTeamName)"
        class="mx-3 mb-3"
        :open="canManageTeams"
        :busy="false"
        tone="danger"
        :title="`Удалить «${removeConfirmTeamName}»?`"
        subtitle="Все назначения игроков сбросятся."
        cancel-text="Отмена"
        confirm-text="Удалить"
        @cancel="removeConfirmTeamName = null"
        @confirm="confirmRemoveTeam(removeConfirmTeamName)"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, unref, nextTick } from 'vue'
import type { MaybeRef, ComputedRef, Ref } from 'vue'
import type { Player } from '~/types/tournament'
import { useAdminAuth } from '~/composables/useAdminAuth'
import { useTeamColors } from '~/composables/useTeamColors'
import { dedupeTeamNamesPreservingOrder, normalizeTeamName } from '~/utils/teamNames'

const props = defineProps<{
  players: Player[]
  teamOptions: MaybeRef<string[]> | ComputedRef<string[]>
  getTeam: (playerId: number) => string
  newTeamName: MaybeRef<string> | Ref<string>
  confirmedTeamNames: MaybeRef<Set<string>>
  getTeamColor: (teamName: string) => number
  autoDistributedNames?: MaybeRef<Set<string>>
}>()

const emit = defineEmits<{
  'update:newTeamName': [value: string]
  setTeam: [playerId: number, teamName: string]
  addNewTeam: []
  removeFromTeam: [playerId: number]
  confirmTeam: [teamName: string]
  unconfirmTeam: [teamName: string]
  setTeamColor: [teamName: string, colorIndex: number]
  removeTeam: [teamName: string]
}>()

const { adminRole } = useAdminAuth()
const canManageTeams = computed(() => adminRole.value === 'full')

const { getMarkerByIndex, teamMarkers } = useTeamColors()
const colorOptions = computed(() => teamMarkers.map((m, i) => ({ value: i, label: m })))

function teamMarker(teamName: string): string {
  const idx = props.getTeamColor(teamName)
  return getMarkerByIndex(Number.isFinite(idx) ? idx : 0)
}

const confirmedSet = computed(() => unref(props.confirmedTeamNames) ?? new Set<string>())

function isTeamConfirmed(name: string): boolean {
  return confirmedSet.value.has(normalizeTeamName(name))
}

const allTeamsList = computed(() =>
  dedupeTeamNamesPreservingOrder(unref(props.teamOptions)),
)

// Только подтверждённые команды — участвуют в матчах, показываются как колонки.
const confirmedTeams = computed(() =>
  allTeamsList.value.filter((n) => isTeamConfirmed(n)),
)

// Неподтверждённые — скрыты из доски, видны в полосе внизу.
const unconfirmedTeams = computed(() =>
  allTeamsList.value.filter((n) => !isTeamConfirmed(n)),
)

// Свободные игроки — без назначенной команды.
const freePlayers = computed(() =>
  props.players.filter((p) => !props.getTeam(p.id)),
)

// Кэш «команда → список игроков» — считаем один раз за рендер.
const teamPlayersMap = computed<Record<string, Player[]>>(() => {
  const map: Record<string, Player[]> = {}
  for (const p of props.players) {
    const t = props.getTeam(p.id)
    if (!t) continue
    ;(map[t] ??= []).push(p)
  }
  return map
})

// Количество колонок сетки на десктопе: 3 команды → 3 колонки, иначе 2.
const teamsGridClass = computed(() => {
  const n = confirmedTeams.value.length
  if (n === 3) return 'md:grid-cols-3'
  return 'md:grid-cols-2'
})

// Среднее суммарного рейтинга — только по подтверждённым командам.
const avgTeamRating = computed(() => {
  const totals = confirmedTeams.value
    .map((t) => (teamPlayersMap.value[t] ?? []).reduce((s, p) => s + (Number(p.rating) || 0), 0))
    .filter((v) => v > 0)
  return totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0
})

// ─── Tap-select ───

const selectedPlayer = ref<{ id: number; fromTeam: string } | null>(null)

function onPlayerClick(playerId: number, teamName: string) {
  if (!selectedPlayer.value) {
    selectedPlayer.value = { id: playerId, fromTeam: teamName }
    return
  }
  if (selectedPlayer.value.id === playerId) { selectedPlayer.value = null; return }
  if (selectedPlayer.value.fromTeam === teamName) {
    selectedPlayer.value = { id: playerId, fromTeam: teamName }
    return
  }
  swapPlayers(selectedPlayer.value.id, selectedPlayer.value.fromTeam, playerId, teamName)
  selectedPlayer.value = null
}

function swapPlayers(aId: number, aTeam: string, bId: number, bTeam: string) {
  if (bTeam === '') emit('removeFromTeam', aId); else emit('setTeam', aId, bTeam)
  if (aTeam === '') emit('removeFromTeam', bId); else emit('setTeam', bId, aTeam)
}

function onMoveHere(targetTeam: string) {
  if (!selectedPlayer.value) return
  const { id, fromTeam } = selectedPlayer.value
  if (fromTeam === targetTeam) { selectedPlayer.value = null; return }
  if (targetTeam === '') emit('removeFromTeam', id); else emit('setTeam', id, targetTeam)
  selectedPlayer.value = null
}

function onDragAdd(playerId: number, targetTeam: string) {
  if (targetTeam === '') emit('removeFromTeam', playerId)
  else emit('setTeam', playerId, targetTeam)
}

// ─── Удаление команды ───
const removeConfirmTeamName = ref<string | null>(null)

function openRemoveConfirm(teamName: string) { removeConfirmTeamName.value = teamName }
function confirmRemoveTeam(teamName: string) {
  emit('removeTeam', teamName)
  removeConfirmTeamName.value = null
}

// ─── Добавление новой команды ───
const showAddInput = ref(false)
const addInputRef = ref<HTMLElement | null>(null)
const newTeamNameValue = computed(() => unref(props.newTeamName))

async function openAddInput() {
  showAddInput.value = true
  await nextTick()
  const el = addInputRef.value as HTMLElement | null
  el?.querySelector?.('input')?.focus()
}

function submitAddTeam() {
  emit('addNewTeam')
  showAddInput.value = false
}
</script>
