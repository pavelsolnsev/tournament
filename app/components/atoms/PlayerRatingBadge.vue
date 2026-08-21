<!-- Атом PlayerRatingBadge: рейтинг игрока отдельным чипом — эмодзи уровня и число. -->
<template>
  <span
    v-if="parts"
    class="inline-flex shrink-0 items-center gap-1 rounded-md bg-slate-200/80 px-1.5 py-0.5
           text-[11px] font-semibold text-slate-600
           dark:bg-slate-700/50 dark:text-slate-300"
    :title="`Рейтинг: ${parts.value}`"
  >
    <span v-if="parts.tier" aria-hidden="true" class="leading-none">{{ parts.tier }}</span>
    <span class="min-w-[2rem] text-right tabular-nums">{{ parts.value }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** Готовая подпись вида «⭐️ 45.0» из playerLabelRatingParts; пусто или не задано — рейтинга нет. */
  rating?: string | null
}>()

// Делим подпись на эмодзи уровня и само число. Число выводим отдельно, чтобы задать ему
// моноширинные цифры и минимальную ширину — тогда чипы в списке встают ровным столбиком.
const parts = computed(() => {
  const raw = (props.rating ?? '').trim()
  if (!raw) return null
  const lastSpace = raw.lastIndexOf(' ')
  if (lastSpace === -1) return { tier: '', value: raw }
  return { tier: raw.slice(0, lastSpace), value: raw.slice(lastSpace + 1) }
})
</script>
