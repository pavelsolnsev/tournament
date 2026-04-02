<template>
  <component
    :is="as"
    class="min-w-0 space-y-3 rounded-xl p-3 sm:p-4"
    :class="[tone === 'raised' ? 'bg-slate-100 dark:bg-slate-800/50' : 'bg-slate-100/60 dark:bg-slate-800/30', rootClass]"
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
