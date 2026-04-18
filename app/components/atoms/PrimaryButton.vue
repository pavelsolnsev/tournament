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
  { variant: 'solid', size: 'sm', disabled: false, nativeType: 'button', title: '' },
)

const mergedClass = computed(() => {
  // Минимальная высота 44px (h-11) — стандарт Apple HIG и Google Material для тач-зон
  const size =
    props.size === 'block'
      ? 'w-full rounded-xl px-4 h-12 text-sm'
      : props.size === 'md'
        ? 'rounded-xl px-5 h-11 text-sm sm:text-base'
        : 'rounded-xl px-3 h-9 text-xs'

  // Muted: в светлой теме — рамка + текст вместо залитого серого, чтобы disabled выглядел читаемо.
  // Solid: зелёная кнопка одинакова в обеих темах (emerald хорошо контрастирует).
  const tone =
    props.variant === 'muted'
      ? 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:border-transparent dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
      : 'bg-emerald-500 text-white hover:bg-emerald-400 active:bg-emerald-600 dark:text-slate-900'

  return `${size} ${tone}`.trim()
})
</script>
