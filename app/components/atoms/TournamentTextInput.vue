<template>
  <input
    :id="id"
    type="text"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :class="mergedClass"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  >
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    variant?: 'search' | 'field'
    size?: 'xs' | 'sm' | 'md'
    placeholder?: string
    id?: string
    disabled?: boolean
    inputClass?: string
    block?: boolean
  }>(),
  { variant: 'field', size: 'xs', disabled: false, block: true },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:opacity-50 transition-colors'

const mergedClass = computed(() => {
  const bits: string[] = ['text-slate-100', 'placeholder-slate-500', focusRing]
  if (props.block) bits.push('w-full')
  else bits.push('max-w-full', 'shrink-0')

  if (props.variant === 'search') {
    bits.push('rounded-xl', 'bg-slate-800/60', 'border', 'border-slate-700/60')
    // text-base (16px) — iOS Safari не зумит поле при фокусе
    bits.push('px-3', 'py-2.5', 'text-base', 'sm:text-sm')
  } else {
    bits.push('border', 'border-slate-600/80', 'bg-slate-800', 'focus:border-emerald-500/60')
    // rounded-xl везде — единый радиус с кнопками и карточками
    if (props.size === 'xs') bits.push('rounded-xl', 'px-3', 'py-2.5', 'text-base', 'sm:text-sm')
    if (props.size === 'sm') bits.push('rounded-xl', 'px-3', 'py-2.5', 'text-base', 'sm:text-sm')
    if (props.size === 'md') bits.push('rounded-xl', 'px-4', 'py-3', 'text-base')
  }

  if (props.inputClass) bits.push(props.inputClass)
  return bits.join(' ')
})
</script>
