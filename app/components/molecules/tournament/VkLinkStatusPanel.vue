<!-- Блок VK-привязки в панели управления матчем. -->
<template>
  <div
    v-if="canViewVkStatus"
    class="mt-1 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 px-3 py-2.5"
  >
    <div class="flex items-center justify-between gap-3">
      <p class="text-xs font-semibold text-slate-700 dark:text-slate-200">
        VK статус
      </p>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200
               transition-colors hover:bg-slate-200 dark:hover:bg-slate-700
               disabled:cursor-not-allowed disabled:opacity-50
               focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40"
        :disabled="vkStatusPending"
        @click="$emit('refresh')"
      >
        {{ vkStatusPending ? 'Обновляем…' : 'Обновить' }}
      </button>
    </div>

    <p v-if="vkStatusError" class="mt-2 text-[11px] text-red-600 dark:text-red-300">
      {{ vkStatusError }}
    </p>

    <div v-else class="mt-2 flex flex-wrap gap-2">
      <span
        class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
        :class="vkStatusLinked ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
      >
        {{ vkStatusLinked ? 'Привязка: есть' : 'Привязка: нет' }}
      </span>
      <span
        v-if="vkStatusLinked && vkPeerId"
        class="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
      >
        peerId: {{ vkPeerId }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  canViewVkStatus: boolean
  vkStatusPending: boolean
  vkStatusError: string | null
  vkStatusLinked: boolean
  vkPeerId: number | null
}>()

defineEmits<{
  refresh: []
}>()
</script>
