<!-- Блок VK-привязки в панели управления матчем. -->
<template>
  <div
    v-if="canViewVkStatus"
    class="rounded-lg border border-slate-200/90 bg-white/80 px-2 py-2 dark:border-slate-600/60 dark:bg-slate-800/50"
  >
    <div class="flex items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-1.5">
        <AtomsVkLogoIcon size="sm" />
        <p class="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
          VK
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200
               transition-colors hover:bg-slate-200 dark:hover:bg-slate-700
               disabled:cursor-not-allowed disabled:opacity-50
               focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40"
        :disabled="vkStatusPending"
        @click="$emit('refresh')"
      >
        <svg
          v-if="!vkStatusPending"
          class="h-3.5 w-3.5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
        <svg
          v-else
          class="h-3.5 w-3.5 shrink-0 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
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
