<template>
  <span
    role="button"
    tabindex="0"
    class="flex max-w-full cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-slate-200 transition hover:bg-emerald-500/20"
    @click="$emit('click')"
    @keydown.enter="$emit('click')"
  >
    <span class="min-w-0 truncate font-medium">{{ label }}</span>
    <span v-if="secondary" class="min-w-0 truncate text-slate-500">{{ secondary }}</span>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  secondary?: string
}>()

defineEmits<{ click: [] }>()
</script>
