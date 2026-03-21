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

// Поле ввода в стиле турнира: поиск без рамки или поле с рамкой, размер xs/sm/md.
const props = withDefaults(
  defineProps<{
    modelValue: string
    variant?: 'search' | 'field'
    size?: 'xs' | 'sm' | 'md'
    placeholder?: string
    id?: string
    disabled?: boolean
    inputClass?: string
    /** false — узкое поле (поиск в колонке), без w-full. */
    block?: boolean
  }>(),
  { variant: 'field', size: 'xs', disabled: false, block: true },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:opacity-50'

const mergedClass = computed(() => {
  const bits: string[] = ['text-slate-100', 'placeholder-slate-500', focusRing]
  if (props.block) bits.push('w-full')
  else bits.push('max-w-full', 'shrink-0')

  if (props.variant === 'search') {
    bits.push('rounded', 'bg-slate-900')
    if (props.size === 'xs') bits.push('px-2.5', 'py-1.5', 'text-xs')
    if (props.size === 'sm') bits.push('px-2', 'py-1.5', 'text-sm')
  } else {
    bits.push('border', 'border-slate-600', 'bg-slate-800')
    if (props.size === 'xs') bits.push('rounded', 'px-2.5', 'py-1.5', 'text-xs')
    if (props.size === 'sm') bits.push('rounded', 'px-2', 'py-1.5', 'text-sm')
    if (props.size === 'md') bits.push('rounded-lg', 'px-3', 'py-2', 'text-sm')
  }

  if (props.inputClass) bits.push(props.inputClass)
  return bits.join(' ')
})
</script>
