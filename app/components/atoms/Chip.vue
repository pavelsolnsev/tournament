<template>
  <span
    role="button"
    tabindex="0"
    class="flex min-w-0 max-w-full cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-slate-700 dark:text-slate-200 transition hover:bg-emerald-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
    :title="title"
    @click="$emit('click')"
    @keydown.enter.prevent="$emit('click')"
    @keydown.space.prevent="$emit('click')"
  >
    <span class="min-w-0 truncate font-medium">{{ label }}</span>
    <span v-if="secondary" class="min-w-0 truncate text-slate-500 dark:text-slate-500">{{ secondary }}</span>
  </span>
</template>

<script setup lang="ts">
// Простой кликаемый чип с текстом.
defineProps<{
  label: string
  secondary?: string
  title?: string
}>()

defineEmits<{ click: [] }>()
</script>
