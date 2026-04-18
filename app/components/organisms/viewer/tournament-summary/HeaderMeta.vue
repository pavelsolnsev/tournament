<template>
  <!-- Simple10: Шапка итогов — место, формат и дата (если передали в пропах). -->
  <div v-if="venueLabel || formatLabel || headerDateLabel" class="pt-5 pb-4 sm:px-6">
    <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
      <span
        v-if="venueLabel"
        class="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-500"
      >
        <span aria-hidden="true">🏟️</span>{{ venueLabel }}
      </span>
      <span
        v-if="venueLabel && (formatLabel || headerDateLabel)"
        class="text-slate-300 dark:text-slate-700"
        aria-hidden="true"
      >·</span>
      <span
        v-if="formatLabel"
        class="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-500"
      >
        <span aria-hidden="true">⚽</span>{{ formatLabel }}
      </span>
      <span
        v-if="formatLabel && headerDateLabel"
        class="text-slate-300 dark:text-slate-700"
        aria-hidden="true"
      >·</span>
      <span
        v-if="headerDateLabel"
        class="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-500"
      >
        <span aria-hidden="true">📅</span><time :datetime="tournamentDateIso">{{ headerDateLabel }}</time>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  venueLabel?: string
  formatLabel?: string
  headerDateLabel: string
  tournamentDateIso?: string
}>()
</script>
