<!-- Блок VK-привязки в панели управления матчем. -->
<template>
  <div
    v-if="canViewVkStatus"
    class="rounded-lg border border-slate-200/90 bg-white/80 px-2 py-2 dark:border-slate-600/60 dark:bg-slate-800/50"
  >
    <div class="flex items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-1.5">
        <svg
          class="h-3.5 w-3.5 shrink-0 text-[#0077FF] dark:text-[#71AAEB]"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="m9.489.004.729-.003h3.564l.73.003.914.01.433.007.418.011.403.014.388.016.374.021.36.025.345.03.333.033c1.74.196 2.933.616 3.833 1.516.9.9 1.32 2.092 1.516 3.833l.034.333.029.346.025.36.02.373.025.588.012.41.013.644.009.915.004.98-.001 3.313-.003.73-.01.914-.007.433-.011.418-.014.403-.016.388-.021.374-.025.36-.03.345-.033.333c-.196 1.74-.616 2.933-1.516 3.833-.9.9-2.092 1.32-3.833 1.516l-.333.034-.346.029-.36.025-.373.02-.588.025-.41.012-.644.013-.915.009-.98.004-3.313-.001-.73-.003-.914-.01-.433-.007-.418-.011-.403-.014-.388-.016-.374-.021-.36-.025-.345-.03-.333-.033c-1.74-.196-2.933-.616-3.833-1.516-.9-.9-1.32-2.092-1.516-3.833l-.034-.333-.029-.346-.025-.36-.02-.373-.025-.588-.012-.41-.013-.644-.009-.915-.004-.98.001-3.313.003-.73.01-.914.007-.433.011-.418.014-.403.016-.388.021-.374.025-.36.03-.345.033-.333c.196-1.74.616-2.933 1.516-3.833.9-.9 2.092-1.32 3.833-1.516l.333-.034.346-.029.36-.025.373-.02.588-.025.41-.012.644-.013.915-.009ZM6.79 7.3H4.05c.13 6.24 3.25 9.99 8.72 9.99h.31v-3.57c2.01.2 3.53 1.67 4.14 3.57h2.84c-.78-2.84-2.83-4.41-4.11-5.01 1.28-.74 3.08-2.54 3.51-4.98h-2.58c-.56 1.98-2.22 3.78-3.8 3.95V7.3H10.5v6.92c-1.6-.4-3.62-2.34-3.71-6.92Z"
          />
        </svg>
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
