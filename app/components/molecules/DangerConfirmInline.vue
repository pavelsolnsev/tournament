<template>
  <div
    v-if="open"
    class="rounded-xl border border-red-500/25 bg-red-500/10 p-2.5"
    role="region"
    :aria-label="ariaLabel"
  >
    <!-- В светлой теме красный текст темнее для лучшего контраста. -->
    <p class="text-[11px] font-semibold text-red-700 dark:text-red-200">
      {{ title }}
    </p>
    <p v-if="subtitle" class="mt-0.5 text-[11px] text-red-600/80 dark:text-red-200/80">
      {{ subtitle }}
    </p>
    <p v-else-if="secondsLeft > 0" class="mt-0.5 text-[11px] text-red-600/80 dark:text-red-200/80">
      Подтвердить можно через {{ secondsLeft }}с.
    </p>

    <!-- Кнопки h-9: компактные внутри confirm-панели, но с достаточным tap-target -->
    <div class="mt-2.5 flex flex-wrap gap-2">
      <button
        type="button"
        class="inline-flex h-9 items-center rounded-xl bg-slate-200 dark:bg-slate-800 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200
               transition-colors md:hover:bg-slate-300 dark:md:hover:bg-slate-700 active:bg-slate-400 dark:active:bg-slate-900
               disabled:cursor-not-allowed disabled:opacity-40
               focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40"
        :disabled="busy"
        @click="emit('cancel')"
      >
        {{ cancelText }}
      </button>
      <button
        type="button"
        class="inline-flex h-9 items-center rounded-xl px-4 text-xs font-semibold text-slate-950
               transition-colors active:opacity-80
               disabled:cursor-not-allowed disabled:opacity-40
               focus:outline-none"
        :class="tone === 'success'
          ? 'bg-emerald-500 hover:bg-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500/40'
          : 'bg-red-500 focus-visible:ring-2 focus-visible:ring-red-500/40'"
        :disabled="busy || secondsLeft > 0"
        @click="emit('confirm')"
      >
        {{ busy ? busyText : confirmText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
  secondsLeft: number
  busy: boolean
  tone?: 'danger' | 'success'
  ariaLabel?: string
  title: string
  subtitle?: string
  cancelText?: string
  confirmText?: string
  busyText?: string
}>()

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()
</script>

