<template>
  <button
    :type="nativeType"
    :disabled="disabled"
    :title="title"
    class="inline-flex items-center justify-center font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50"
    :class="mergedClass"
  >
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
  // Минимальная высота 44px (h-11) — стандарт Apple HIG и Google Material для тач-зон
  const size =
    props.size === 'block'
      ? 'w-full rounded-xl px-4 h-12 text-sm'
      : props.size === 'md'
        ? 'rounded-xl px-5 h-11 text-sm sm:text-base'
        : 'rounded-lg px-3 h-9 text-xs'

  const tone =
    props.variant === 'muted'
      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
      : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400 active:bg-emerald-600'

  return `${size} ${tone}`.trim()
})
</script>
