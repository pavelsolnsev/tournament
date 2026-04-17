<template>
  <!-- Simple10: Кружок цвета турнира только если у команды есть файл логотипа — без логотипа уже показывается цветной эмодзи-маркер. -->
  <span
    v-if="showDot"
    class="inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-slate-300/70 dark:ring-slate-600/50"
    :class="dotBgClass"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getTeamLogoSrc } from '~/utils/teamLogos'

const props = defineProps<{
  teamName: string
  colorIndex: number
}>()

// Порядок как у маркеров / плашки счёта в useTeamColors (индекс 0–5).
const TEAM_DOT_BG = [
  'bg-red-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-slate-400',
  'bg-zinc-500',
] as const

const showDot = computed(() => {
  const name = (props.teamName ?? '').trim()
  if (!name) return false
  return !!getTeamLogoSrc(name)
})

const dotBgClass = computed(() => {
  const idx = Number.isFinite(props.colorIndex)
    ? Math.max(0, Math.min(Math.floor(props.colorIndex), TEAM_DOT_BG.length - 1))
    : 0
  return TEAM_DOT_BG[idx] ?? TEAM_DOT_BG[0]
})
</script>
