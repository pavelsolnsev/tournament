<template>
  <div
    v-if="open"
    class="rounded-xl border p-2.5"
    :class="toneClasses.panel"
    role="region"
    :aria-label="ariaLabel"
  >
    <p class="text-[11px] font-semibold" :class="toneClasses.title">
      {{ title }}
    </p>
    <p v-if="subtitle" class="mt-0.5 text-[11px]" :class="toneClasses.subtitle">
      {{ subtitle }}
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
        class="inline-flex h-9 items-center rounded-xl px-4 text-xs font-semibold
               transition-colors active:opacity-80
               disabled:cursor-not-allowed disabled:opacity-40
               focus:outline-none focus-visible:ring-2 focus-visible:ring-current/40"
        :class="toneClasses.confirmBtn"
        :disabled="busy"
        @click="emit('confirm')"
      >
        {{ busy ? busyText : confirmText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean
  busy: boolean
  tone?: 'danger' | 'neutral'
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

const toneClasses = computed(() => {
  const tone = props.tone ?? 'neutral'

  if (tone === 'danger') {
    return {
      panel: 'border-red-500/25 bg-red-500/10',
      title: 'text-red-700 dark:text-red-200',
      subtitle: 'text-red-600/80 dark:text-red-200/80',
      confirmBtn: 'bg-red-500 text-white dark:text-slate-950',
    }
  }

  return {
    panel: 'border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40',
    title: 'text-slate-700 dark:text-slate-200',
    subtitle: 'text-slate-500 dark:text-slate-400',
    confirmBtn: 'bg-sky-500 text-white dark:text-slate-950',
  }
})
</script>

