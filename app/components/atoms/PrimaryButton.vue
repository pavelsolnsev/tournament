<template>
  <button
    :type="nativeType"
    :disabled="disabled"
    :title="title"
    class="font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50"
    :class="mergedClass"
  >
    <!-- Основная зелёная кнопка турнира: компактная или на всю ширину. -->
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'solid' | 'muted'
    size?: 'sm' | 'md' | 'block'
    disabled?: boolean
    nativeType?: 'button' | 'submit'
    title?: string
  }>(),
  { variant: 'solid', size: 'sm', disabled: false, nativeType: 'button' },
)

const mergedClass = computed(() => {
  const size =
    props.size === 'block'
      ? 'w-full rounded-xl px-4 py-2.5 text-sm'
      : props.size === 'md'
        ? 'rounded-lg px-5 py-2.5 text-sm sm:text-base'
        : 'rounded px-3 py-1.5 text-xs'

  const tone =
    props.variant === 'muted'
      ? 'bg-slate-700 text-slate-400'
      : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400'

  return `${size} ${tone}`.trim()
})
</script>
