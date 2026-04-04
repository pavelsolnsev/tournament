<!-- Компонент StepStandingsTeamPickers: выбор хозяев и гостей для текущего матча. -->
<template>
  <div class="flex flex-col gap-3 px-4 sm:flex-row sm:gap-4">

    <!-- Хозяева -->
    <div ref="homeColumnRef" class="min-w-0 flex-1">
      <p class="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">Хозяева</p>
      <button
        ref="homeTriggerRef"
        type="button"
        class="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700/60 bg-white dark:bg-slate-900/70
               px-3 text-left text-sm text-slate-800 dark:text-slate-100 transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        :class="homeOpen ? 'border-emerald-500/50' : 'hover:border-slate-600'"
        @click="toggleHome"
      >
        <span v-if="homeTeam" class="shrink-0 text-base leading-none">{{ teamMarker(homeTeam) }}</span>
        <span
          class="min-w-0 flex-1 truncate"
          :class="homeTeam ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-500'"
        >
          {{ homeTeam || 'Выберите команду' }}
        </span>
        <svg
          class="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150"
          :class="homeOpen && 'rotate-180'"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <Teleport to="body">
        <Transition
          enter-active-class="transition-all duration-150 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-100 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
          @after-enter="onHomeListAfterEnter"
        >
          <ul
            v-if="homeOpen"
            ref="homeListRef"
            class="fixed z-[100] min-h-0 touch-manipulation overflow-y-auto overscroll-y-contain rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 py-1 shadow-xl [-webkit-overflow-scrolling:touch]"
            :style="homeListStyle"
            role="listbox"
          >
            <li>
              <button
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-500 transition-colors
                       hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-600 dark:hover:text-slate-300"
                @click="selectHome('')"
              >
                — не выбрано —
              </button>
            </li>
            <li v-for="name in teams" :key="name">
              <button
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors"
                :class="
                  name === awayTeam
                    ? 'cursor-not-allowed text-slate-400 opacity-40'
                    : name === homeTeam
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                "
                :disabled="name === awayTeam"
                @click="name !== awayTeam && selectHome(name)"
              >
                <span class="shrink-0 text-base leading-none">{{ teamMarker(name) }}</span>
                <span class="min-w-0 truncate">{{ name }}</span>
              </button>
            </li>
          </ul>
        </Transition>
      </Teleport>
    </div>

    <!-- Гости -->
    <div ref="awayColumnRef" class="min-w-0 flex-1">
      <p class="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">Гости</p>
      <button
        ref="awayTriggerRef"
        type="button"
        class="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700/60 bg-white dark:bg-slate-900/70
               px-3 text-left text-sm text-slate-800 dark:text-slate-100 transition-colors
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        :class="awayOpen ? 'border-emerald-500/50' : 'hover:border-slate-600'"
        @click="toggleAway"
      >
        <span v-if="awayTeam" class="shrink-0 text-base leading-none">{{ teamMarker(awayTeam) }}</span>
        <span
          class="min-w-0 flex-1 truncate"
          :class="awayTeam ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-500'"
        >
          {{ awayTeam || 'Выберите команду' }}
        </span>
        <svg
          class="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150"
          :class="awayOpen && 'rotate-180'"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <Teleport to="body">
        <Transition
          enter-active-class="transition-all duration-150 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-100 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
          @after-enter="onAwayListAfterEnter"
        >
          <ul
            v-if="awayOpen"
            ref="awayListRef"
            class="fixed z-[100] min-h-0 touch-manipulation overflow-y-auto overscroll-y-contain rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 py-1 shadow-xl [-webkit-overflow-scrolling:touch]"
            :style="awayListStyle"
            role="listbox"
          >
            <li>
              <button
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-500 transition-colors
                       hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-600 dark:hover:text-slate-300"
                @click="selectAway('')"
              >
                — не выбрано —
              </button>
            </li>
            <li v-for="name in teams" :key="name">
              <button
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors"
                :class="
                  name === homeTeam
                    ? 'cursor-not-allowed text-slate-400 opacity-40'
                    : name === awayTeam
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                "
                :disabled="name === homeTeam"
                @click="name !== homeTeam && selectAway(name)"
              >
                <span class="shrink-0 text-base leading-none">{{ teamMarker(name) }}</span>
                <span class="min-w-0 truncate">{{ name }}</span>
              </button>
            </li>
          </ul>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'

// Этот блок только выбирает хозяев и гостей, без логики счёта.
defineProps<{
  teams: string[]
  homeTeam: string
  awayTeam: string
  teamMarker: (teamName: string) => string
}>()

const emit = defineEmits<{
  'update:homeTeam': [value: string]
  'update:awayTeam': [value: string]
}>()

const homeOpen = ref(false)
const awayOpen = ref(false)

const homeColumnRef = useTemplateRef<HTMLElement>('homeColumnRef')
const awayColumnRef = useTemplateRef<HTMLElement>('awayColumnRef')
const homeTriggerRef = useTemplateRef<HTMLButtonElement>('homeTriggerRef')
const awayTriggerRef = useTemplateRef<HTMLButtonElement>('awayTriggerRef')
const homeListRef = useTemplateRef<HTMLElement>('homeListRef')
const awayListRef = useTemplateRef<HTMLElement>('awayListRef')

// Координаты выпадающих списков в viewport (fixed) — списки в Teleport, чтобы не резались overflow-hidden.
const homeListStyle = ref<Record<string, string>>({})
const awayListStyle = ref<Record<string, string>>({})

/** Отступ от краёв экрана — чтобы панель не залезала под вырез / домой. */
const VIEW_EDGE_PAD = 10
/** Зазор между кнопкой и списком. */
const DROPDOWN_GAP_PX = 4
// Видимая область (Safari с нижней панелью — visualViewport уже меньше innerHeight).
function visibleBand(): { top: number; bottom: number; height: number } {
  const vv = window.visualViewport
  if (!vv) {
    const h = window.innerHeight
    return { top: 0, bottom: h, height: h }
  }
  const top = vv.offsetTop
  const height = vv.height
  return { top, bottom: top + height, height }
}

/** Потолок высоты списка (~min(70vh, 22rem)), от реальной видимой высоты. */
function idealDropdownMaxHeightPx(visibleHeight: number): number {
  return Math.min(visibleHeight * 0.72, 22 * 16)
}

// Считаем top/bottom + maxHeight так, чтобы панель целиком попадала в видимую полосу экрана.
function dropdownStyleForTrigger(r: DOMRect): Record<string, string> {
  const { top: vTop, bottom: vBottom, height: vH } = visibleBand()
  const spaceBelow = vBottom - r.bottom - DROPDOWN_GAP_PX - VIEW_EDGE_PAD
  const spaceAbove = r.top - vTop - DROPDOWN_GAP_PX - VIEW_EDGE_PAD
  const ideal = idealDropdownMaxHeightPx(vH)
  const openDown = spaceBelow >= spaceAbove
  const rawMax = openDown ? spaceBelow : spaceAbove
  const maxH = Math.max(64, Math.min(ideal, Math.max(0, rawMax)))
  const base = {
    left: `${r.left}px`,
    width: `${r.width}px`,
    maxHeight: `${Math.floor(maxH)}px`,
  }
  const ih = window.innerHeight
  if (openDown) {
    return {
      ...base,
      top: `${r.bottom + DROPDOWN_GAP_PX}px`,
      bottom: 'auto',
    }
  }
  return {
    ...base,
    top: 'auto',
    bottom: `${ih - r.top + DROPDOWN_GAP_PX}px`,
  }
}

function syncHomeListPosition() {
  const btn = homeTriggerRef.value
  if (!btn) return
  homeListStyle.value = dropdownStyleForTrigger(btn.getBoundingClientRect())
}

function syncAwayListPosition() {
  const btn = awayTriggerRef.value
  if (!btn) return
  awayListStyle.value = dropdownStyleForTrigger(btn.getBoundingClientRect())
}

function syncOpenDropdownPositions() {
  if (homeOpen.value) syncHomeListPosition()
  if (awayOpen.value) syncAwayListPosition()
}

// После анимации входа ещё раз меряем — к этому моменту список в DOM, границы окна актуальны.
function onHomeListAfterEnter() {
  if (import.meta.server) return
  requestAnimationFrame(() => {
    requestAnimationFrame(() => syncHomeListPosition())
  })
}

function onAwayListAfterEnter() {
  if (import.meta.server) return
  requestAnimationFrame(() => {
    requestAnimationFrame(() => syncAwayListPosition())
  })
}

watch(homeOpen, (open) => {
  if (open) awayOpen.value = false
})

watch(awayOpen, (open) => {
  if (open) homeOpen.value = false
})

// Открыли список: сначала крутим #scroll-root к кнопке (center), потом maxHeight/top/bottom — иначе панель уезжает за экран.
watch(
  () => homeOpen.value || awayOpen.value,
  async (anyOpen) => {
    await nextTick()
    window.removeEventListener('scroll', syncOpenDropdownPositions, true)
    window.removeEventListener('resize', syncOpenDropdownPositions)
    const vv = window.visualViewport
    if (vv) {
      vv.removeEventListener('resize', syncOpenDropdownPositions)
      vv.removeEventListener('scroll', syncOpenDropdownPositions)
    }
    if (anyOpen) {
      window.addEventListener('scroll', syncOpenDropdownPositions, true)
      window.addEventListener('resize', syncOpenDropdownPositions)
      if (vv) {
        vv.addEventListener('resize', syncOpenDropdownPositions)
        vv.addEventListener('scroll', syncOpenDropdownPositions)
      }
      requestAnimationFrame(() => {
        if (homeOpen.value) {
          homeTriggerRef.value?.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' })
        } else if (awayOpen.value) {
          awayTriggerRef.value?.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' })
        }
        requestAnimationFrame(() => {
          if (homeOpen.value) syncHomeListPosition()
          else if (awayOpen.value) syncAwayListPosition()
        })
      })
    }
  },
)

function toggleHome() {
  homeOpen.value = !homeOpen.value
}

function toggleAway() {
  awayOpen.value = !awayOpen.value
}

function selectHome(name: string) {
  emit('update:homeTeam', name)
  homeOpen.value = false
}

function selectAway(name: string) {
  emit('update:awayTeam', name)
  awayOpen.value = false
}

function onDocClick(e: MouseEvent) {
  const t = e.target as Node
  if (homeOpen.value) {
    const inside =
      homeColumnRef.value?.contains(t) ||
      homeListRef.value?.contains(t)
    if (!inside) homeOpen.value = false
  }
  if (awayOpen.value) {
    const inside =
      awayColumnRef.value?.contains(t) ||
      awayListRef.value?.contains(t)
    if (!inside) awayOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('scroll', syncOpenDropdownPositions, true)
  window.removeEventListener('resize', syncOpenDropdownPositions)
  const vv = window.visualViewport
  if (vv) {
    vv.removeEventListener('resize', syncOpenDropdownPositions)
    vv.removeEventListener('scroll', syncOpenDropdownPositions)
  }
})
</script>
