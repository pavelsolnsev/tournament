<template>
  <p
    class="rounded-lg bg-slate-900/40 px-3 text-slate-500"
    :class="[boxClass, rootClass]"
  >
    <!-- Пустое состояние: подсказка вместо списка. -->
    <slot />
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    align?: 'center' | 'start'
    size?: 'xs' | 'sm'
    rootClass?: string
  }>(),
  { align: 'center', size: 'xs' },
)

const boxClass = computed(() => {
  const a = props.align === 'center' ? 'py-4 text-center' : 'py-3 text-left'
  const s = props.size === 'sm' ? 'text-sm' : 'text-xs'
  return `${a} ${s}`
})
</script>
