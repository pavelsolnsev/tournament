<!-- Чип «Локалка» / «Продакшен» — капсула, мягкая тень, контраст в light/dark. -->
<template>
  <div
    class="inline-flex max-w-full min-w-0 shrink-0 items-center rounded-full px-3 py-1 text-[11px] font-semibold leading-tight tracking-tight shadow-sm ring-1 ring-inset"
    :class="{
      'bg-sky-100/90 text-sky-950 ring-sky-300/70 dark:bg-sky-950/55 dark:text-sky-50 dark:ring-sky-500/25': environment === 'local',
      'bg-violet-100/90 text-violet-950 ring-violet-300/70 dark:bg-violet-950/50 dark:text-violet-50 dark:ring-violet-500/30': environment === 'production',
      'bg-slate-200/80 text-slate-800 ring-slate-300/80 dark:bg-slate-700/70 dark:text-slate-100 dark:ring-slate-500/35': environment === 'other',
    }"
    role="status"
  >
    <span class="min-w-0">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
export type VkPeerEnvironmentKind = 'local' | 'production' | 'other'

defineProps<{
  environment: VkPeerEnvironmentKind
  label: string
}>()
</script>
