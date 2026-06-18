<template>
  <!-- «Свободные» оформлены как отдельный пул (пунктирная рамка + фон), чтобы не сливаться с командами -->
  <div
    class="flex flex-col"
    :class="isFreeColumn ? 'rounded-2xl border border-dashed border-slate-300 bg-slate-100/70 p-1.5 dark:border-slate-600/70 dark:bg-slate-800/40' : ''"
  >

    <!-- ── Заголовок: две строки для читаемости на узких колонках ── -->
    <div
      class="rounded-xl border transition-colors"
      :class="headerBg"
    >
      <!-- Строка 1: маркер + название + счётчик + кнопка-аккордеон -->
      <div
        class="flex min-h-[44px] items-center gap-1.5 px-3 py-2"
        :class="showMoveTarget ? 'cursor-pointer' : ''"
        @click="onHeaderClick"
      >
        <!-- Логотип команды если есть, иначе цветной маркер -->
        <AtomsTeamMarkerOrLogo
          v-if="!isFreeColumn"
          :team-name="teamName"
          :marker="marker"
          size="md"
          class="shrink-0"
        />

        <!-- Название -->
        <span
          class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100"
          :title="isFreeColumn ? 'Свободные игроки' : teamName"
        >{{ isFreeColumn ? 'Свободные' : teamName }}</span>

        <!-- Счётчик игроков -->
        <span class="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-xs tabular-nums text-slate-600 dark:bg-slate-700/60 dark:text-slate-400">
          {{ players.length }}
        </span>

        <!-- Зелёная галочка — команда подтверждена -->
        <span
          v-if="isConfirmed"
          class="shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-label="Подтверждена"
        >✓</span>

        <!-- Аккордеон: только на мобайле (md+ всегда раскрыт) -->
        <button
          type="button"
          class="md:hidden inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 dark:text-slate-600 transition-transform focus:outline-none"
          :class="isExpanded ? '' : '-rotate-90'"
          :aria-expanded="isExpanded"
          :aria-label="isExpanded ? 'Свернуть команду' : 'Развернуть команду'"
          @click.stop="isExpanded = !isExpanded"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      <!-- Строка 2: рейтинг и действия — только для колонок команд -->
      <div
        v-if="!isFreeColumn"
        class="flex items-center gap-1 border-t border-slate-100 px-2 py-1.5 dark:border-slate-800/60"
        @click.stop
      >
        <!-- Суммарный рейтинг с цветовым индикатором баланса -->
        <span
          class="flex-1 min-w-0 text-xs font-semibold tabular-nums"
          :class="players.length > 0 ? deltaClass : 'text-slate-400 dark:text-slate-600'"
          :title="players.length > 0 ? `Суммарный рейтинг: ${teamTotalRating.toFixed(1)}` : 'Нет игроков'"
        >{{ players.length > 0 ? `Σ ${teamTotalRating.toFixed(1)}` : '—' }}</span>

        <!-- Цвет команды -->
        <MoleculesDropdownSelect
          :model-value="colorIndex"
          title="Цвет команды"
          :options="colorOptions"
          @update:model-value="emit('setColor', Number($event))"
        />

        <!-- Подтвердить участие -->
        <button
          v-if="players.length > 0 && !isConfirmed"
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-sm text-emerald-800 dark:text-emerald-300 transition-colors md:hover:bg-emerald-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          title="Подтвердить участие в турнире"
          @click="emit('confirmTeam')"
        >✓</button>

        <!-- Крестик в колонке участвующей команды убирает её в «Не участвуют» (не удаляет) -->
        <button
          v-else-if="isConfirmed"
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 dark:text-slate-600 transition-colors md:hover:bg-slate-200 md:hover:text-slate-600 dark:md:hover:bg-slate-700/60 dark:md:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40"
          title="Убрать в «Не участвуют»"
          @click="emit('unconfirmTeam')"
        >✕</button>
      </div>
    </div>

    <!-- Полоса «переместить сюда» — появляется при tap-select из другой колонки -->
    <button
      v-if="showMoveTarget"
      type="button"
      class="mt-1 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-emerald-400/70 bg-emerald-500/8 text-xs font-semibold text-emerald-700 transition-colors dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300 md:hover:bg-emerald-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      @click.stop="emit('moveHere')"
    >
      <span aria-hidden="true">→</span> Переместить сюда
    </button>

    <!-- Список игроков с drag-and-drop; в колонке «Свободные» ограничиваем высоту со скроллом -->
    <div
      v-show="isExpanded"
      class="mt-1.5 min-h-[3rem]"
      :class="isFreeColumn ? 'max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain rounded-xl' : ''"
      @click="onBodyClick"
    >
      <VueDraggable
        v-model="localPlayers"
        group="kanban-players"
        :animation="150"
        ghost-class="opacity-30"
        drag-class="shadow-lg"
        class="gap-1 rounded-xl p-1"
        :class="isFreeColumn ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' : 'flex flex-col'"
        @add="onDragAdd"
      >
        <AtomsKanbanPlayerCard
          v-for="p in localPlayers"
          :key="p.id"
          :player="p"
          :is-selected="selectedPlayer?.id === p.id"
          :is-swap-target="isSwapTarget(p.id)"
          @click="emit('playerClicked', p.id)"
        />
      </VueDraggable>

      <!-- Подсказка когда колонка пуста -->
      <p
        v-if="localPlayers.length === 0 && !showMoveTarget"
        class="py-3 text-center text-xs text-slate-400 dark:text-slate-600"
      >
        {{ isFreeColumn ? 'Все распределены' : 'Перетащите или\nвыберите игрока' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import type { Player } from '~/types/tournament'
import { useTeamColors } from '~/composables/useTeamColors'

const props = defineProps<{
  /** Имя команды; пустая строка '' означает колонку «Свободные». */
  teamName: string
  players: Player[]
  marker: string
  colorIndex: number
  isConfirmed: boolean
  /** Данные о выбранном игроке (tap-select) — прокидываются с доски. */
  selectedPlayer: { id: number; fromTeam: string } | null
  /** Среднее суммарного рейтинга по всем командам — для индикатора баланса. */
  avgTeamRating: number
}>()

const emit = defineEmits<{
  playerClicked: [playerId: number]
  /** Переместить выбранного игрока в эту колонку. */
  moveHere: []
  confirmTeam: []
  unconfirmTeam: []
  setColor: [colorIndex: number]
  /** Игрок перетащен в эту колонку drag-and-drop. */
  dragAdd: [playerId: number]
}>()

const { teamMarkers } = useTeamColors()
const colorOptions = computed(() => teamMarkers.map((m, i) => ({ value: i, label: m })))

const isFreeColumn = computed(() => props.teamName === '')

// Аккордеон: по умолчанию раскрыт; на десктопе всегда раскрыт (кнопка hidden md:).
const isExpanded = ref(true)

// Локальная копия для vue-draggable-plus; синхронизируется при изменении canonical-state.
const localPlayers = ref<Player[]>([...props.players])

watch(
  () => props.players.map((p) => p.id).join(','),
  () => { localPlayers.value = [...props.players] },
)

// Суммарный рейтинг команды — показываем для оценки баланса.
const teamTotalRating = computed(() =>
  localPlayers.value.reduce((s, p) => s + (Number(p.rating) || 0), 0),
)

// Цвет суммарного рейтинга: зелёный — близко к среднему, оранжевый/синий — перекос.
const deltaClass = computed(() => {
  if (props.avgTeamRating <= 0 || localPlayers.value.length === 0)
    return 'text-slate-500 dark:text-slate-400'
  const delta = teamTotalRating.value - props.avgTeamRating
  if (Math.abs(delta) < 0.5) return 'text-emerald-600 dark:text-emerald-400'
  if (delta > 0) return 'text-orange-500 dark:text-orange-400'
  return 'text-sky-500 dark:text-sky-400'
})

// Кнопка «переместить сюда» видна, если выбран игрок из ДРУГОЙ колонки.
const showMoveTarget = computed(() =>
  props.selectedPlayer !== null && props.selectedPlayer.fromTeam !== props.teamName,
)

// Игрок — цель для свапа если выбранный игрок — из другой команды.
function isSwapTarget(playerId: number): boolean {
  if (!props.selectedPlayer) return false
  if (props.selectedPlayer.id === playerId) return false
  if (props.selectedPlayer.fromTeam === props.teamName) return false
  return true
}

// Фон всей плашки-заголовка: зелёный тинт когда колонка — цель перемещения;
// у «Свободных» шапка прозрачная (фон даёт сам пул-контейнер), команды — белая карточка.
const headerBg = computed(() => {
  if (showMoveTarget.value)
    return 'border-emerald-400/50 bg-emerald-500/8 dark:border-emerald-500/30 dark:bg-emerald-500/10'
  if (isFreeColumn.value)
    return 'border-transparent bg-transparent'
  return 'border-slate-200 bg-white dark:border-slate-800/50 dark:bg-slate-900/30'
})

// Клик по пустой зоне тела — переместить выбранного игрока сюда.
function onBodyClick(e: MouseEvent) {
  if (!showMoveTarget.value) return
  e.stopPropagation()
  emit('moveHere')
}

// Клик по заголовку — переместить если player выбран.
function onHeaderClick() {
  if (showMoveTarget.value) emit('moveHere')
}

// Drag-and-drop: кто-то перетащил игрока в эту колонку.
function onDragAdd(event: { item: HTMLElement }) {
  const playerId = Number(event.item.dataset.playerId)
  if (!Number.isFinite(playerId)) return
  emit('dragAdd', playerId)
}
</script>
