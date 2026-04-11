<template>
  <div id="summary-intro" class="scroll-mt-24 space-y-4 px-4 pt-5 sm:px-6">
    <!-- Сводка цифр: матчи, голы, передачи и сейвы по всему турниру. -->
    <div
      class="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700/60 dark:bg-slate-800/40 sm:grid-cols-4 sm:p-4"
    >
      <div class="flex flex-col items-center gap-0.5 text-center">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Матчи</span>
        <span class="text-xl font-black tabular-nums text-slate-800 dark:text-slate-100 sm:text-2xl">{{ stats.totalMatches }}</span>
      </div>
      <div class="flex flex-col items-center gap-0.5 text-center">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Голы</span>
        <span class="text-xl font-black tabular-nums text-emerald-700 dark:text-emerald-300 sm:text-2xl">{{ stats.totalGoals }}</span>
      </div>
      <div class="flex flex-col items-center gap-0.5 text-center">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ассисты</span>
        <span class="text-xl font-black tabular-nums text-sky-700 dark:text-sky-300 sm:text-2xl">{{ stats.totalAssists }}</span>
      </div>
      <div class="flex flex-col items-center gap-0.5 text-center">
        <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Сейвы</span>
        <span class="text-xl font-black tabular-nums text-violet-700 dark:text-violet-300 sm:text-2xl">{{ stats.totalSaves }}</span>
      </div>
    </div>

    <!-- Чемпион — отдельный блок для шаринга и эмоции, не только строка в таблице. -->
    <div
      v-if="champion"
      id="summary-champion"
      class="scroll-mt-24 overflow-hidden rounded-2xl border border-emerald-400/50 bg-gradient-to-br from-emerald-50 to-slate-50 p-4 dark:border-emerald-500/30 dark:from-emerald-950/40 dark:to-slate-900/80 sm:p-5"
    >
      <p class="mb-2 text-center text-[11px] font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Чемпион турнира</p>
      <div class="flex flex-col items-center gap-2 text-center">
        <span class="text-3xl leading-none" aria-hidden="true">🏆</span>
        <div class="flex items-center justify-center gap-2">
          <span class="text-2xl leading-none" aria-hidden="true">{{ championMarker }}</span>
          <p class="text-lg font-bold leading-tight text-slate-900 dark:text-slate-50 sm:text-xl">
            {{ champion.teamName }}
          </p>
        </div>
        <p class="max-w-md text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          {{ championSubtitle }}
        </p>
      </div>
    </div>

    <!-- Якоря: плавный скролл внутри #scroll-root (body не скроллится). -->
    <nav aria-label="Разделы итогов" class="flex flex-wrap gap-1.5 sm:gap-2">
      <a
        v-for="item in navItems"
        :key="item.href"
        :href="item.href"
        class="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-emerald-400/60 hover:text-emerald-800 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300"
        @click="onNavClick($event, item.href)"
      >
        {{ item.label }}
      </a>
    </nav>
  </div>
</template>

<script setup lang="ts">
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'
import type { TournamentSummaryStats } from '~/composables/useTournamentSummary'

const props = defineProps<{
  stats: TournamentSummaryStats
  champion: StandingsRow | null
  championMarker: string
  navItems: { href: string; label: string }[]
}>()

const championSubtitle = computed(() => {
  const r = props.champion
  if (!r) return ''
  return `${r.points} очков · ${r.wins} побед · разница мячей ${r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}`
})

// Скролл идёт в #scroll-root (body фиксирован), поэтому scrollIntoView часто без анимации — крутим контейнер сами.
const SCROLL_ROOT_SELECTOR = '#scroll-root'
const NAV_SCROLL_PADDING_PX = 12
const NAV_SCROLL_DURATION_MS = 420
let navScrollRafId: number | null = null

// Плавность делаем вручную через rAF, чтобы анимация работала стабильно именно в #scroll-root.
function animateScrollTop(root: HTMLElement, targetTop: number) {
  if (navScrollRafId !== null) {
    cancelAnimationFrame(navScrollRafId)
    navScrollRafId = null
  }

  const startTop = root.scrollTop
  const distance = targetTop - startTop
  if (Math.abs(distance) < 1) return
  const startTs = performance.now()

  // Easing для мягкого старта и мягкой остановки, чтобы движение выглядело естественно.
  const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

  const step = (now: number) => {
    const elapsed = now - startTs
    const progress = Math.min(1, elapsed / NAV_SCROLL_DURATION_MS)
    const eased = easeInOutCubic(progress)
    root.scrollTop = startTop + distance * eased
    if (progress < 1) {
      navScrollRafId = requestAnimationFrame(step)
    } else {
      navScrollRafId = null
    }
  }

  navScrollRafId = requestAnimationFrame(step)
}

function onNavClick(e: MouseEvent, href: string) {
  e.preventDefault()
  const id = href.startsWith('#') ? href.slice(1) : href
  const el = document.getElementById(id)
  const root = document.querySelector(SCROLL_ROOT_SELECTOR)
  if (el && root instanceof HTMLElement) {
    const rootRect = root.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const top = root.scrollTop + (elRect.top - rootRect.top) - NAV_SCROLL_PADDING_PX
    animateScrollTop(root, Math.max(0, top))
  }
  if (import.meta.client) {
    history.replaceState(null, '', href)
  }
}

// При размонтировании останавливаем незавершённую анимацию, чтобы не было «висячих» кадров.
onUnmounted(() => {
  if (navScrollRafId !== null) {
    cancelAnimationFrame(navScrollRafId)
    navScrollRafId = null
  }
})
</script>
