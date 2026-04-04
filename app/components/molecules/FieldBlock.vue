<template>
  <div class="min-w-0" :class="wrapperClass">
    <label
      v-if="label"
      :for="id"
      class="mb-1 block font-medium text-slate-600 dark:text-slate-400"
      :class="labelSize === 'sm' ? 'text-sm' : 'text-xs'"
    >
      {{ label }}
    </label>
    <!-- Слот — инпут или селект с тем же label сверху. -->
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    id?: string
    label?: string
    labelSize?: 'xs' | 'sm'
    wrapperClass?: string
  }>(),
  { labelSize: 'xs' },
)
</script>
