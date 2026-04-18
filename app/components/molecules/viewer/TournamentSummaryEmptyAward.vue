<template>
  <!-- Simple10: Заглушка в сетке наград, если в категории никого нет. -->
  <div
    class="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-3 dark:border-slate-700/40 dark:bg-slate-800/20"
  >
    <span class="text-base opacity-40 dark:opacity-30" aria-hidden="true">{{ icon }}</span>
    <span class="text-[12px] text-slate-600 dark:text-slate-500">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string
  text: string
}>()
</script>
