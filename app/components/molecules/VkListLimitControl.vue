<!-- Контрол общего лимита ВК-списка: «Задать лимит» → степпер − / N / + и снятие. -->
<template>
  <div class="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/60 px-3 py-2.5 dark:border-slate-600/50 dark:bg-slate-800/25">
    <div class="min-w-0">
      <p class="text-xs font-medium text-slate-600 dark:text-slate-400">Лимит списка</p>
      <p class="text-[11px] leading-snug text-slate-500 dark:text-slate-500">Сверх лимита — в очередь (на сайте скрыты)</p>
    </div>

    <button
      v-if="limit == null"
      type="button"
      class="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
      @click="emit('set', 20)"
    >
      Задать лимит
    </button>

    <div v-else class="inline-flex shrink-0 items-center gap-1">
      <div
        class="inline-flex items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/80"
        role="group"
        aria-label="Лимит списка"
      >
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
          :disabled="(limit ?? 1) <= 1"
          aria-label="Уменьшить лимит списка"
          @click="step(-1)"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
        </button>
        <span class="min-w-[2rem] px-1 text-center text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{{ limit }}</span>
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
          :disabled="(limit ?? 1) >= 200"
          aria-label="Увеличить лимит списка"
          @click="step(1)"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>
      <button
        type="button"
        class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 dark:hover:bg-red-950/40 dark:hover:text-red-300"
        title="Без лимита"
        aria-label="Снять лимит списка"
        @click="emit('set', null)"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  /** Текущий общий лимит; undefined = без лимита. */
  limit?: number
}>()

const emit = defineEmits<{
  set: [limit: number | null]
}>()

// Шаг лимита кнопками − / + (clamp 1..200).
function step(delta: number) {
  const cur = props.limit ?? 1
  emit('set', Math.min(200, Math.max(1, cur + delta)))
}
</script>
