<template>
  <component
    :is="as"
    class="min-w-0 space-y-3 rounded-xl border p-3 sm:p-4"
    :class="[tone === 'raised'
      ? 'border-slate-300 bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/50'
      : 'border-slate-300 bg-slate-50 dark:border-slate-700/40 dark:bg-slate-800/30',
      rootClass]"
  >
    <!-- Общая «карточка» турнира: один фон и отступы везде в мастере. -->
    <slot />
  </component>
</template>

<script setup lang="ts">
defineProps<{
  as?: 'section' | 'div'
  /** raised — чуть светлее панель (напр. форма на отдельной странице). */
  tone?: 'card' | 'raised'
  rootClass?: string
}>()
</script>
