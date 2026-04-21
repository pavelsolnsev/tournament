<template>
  <ul
    class="m-0 max-h-72 min-h-0 list-none p-0 pr-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden"
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
