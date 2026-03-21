<template>
  <ul
    class="max-h-72 min-h-0 space-y-1 overflow-y-auto pr-1"
    :class="listClass"
    role="list"
  >
    <!-- Обёртка для списка игроков с одной высотой и отступами. -->
    <slot />
  </ul>
</template>

<script setup lang="ts">
defineProps<{
  listClass?: string
}>()
</script>
