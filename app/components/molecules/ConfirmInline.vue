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

    <div class="mt-2 flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200
               transition-colors md:hover:bg-slate-700 active:bg-slate-900
               disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="busy"
        @click="emit('cancel')"
      >
        {{ cancelText }}
      </button>
      <button
        type="button"
        class="rounded-lg px-3 py-2 text-xs font-semibold
               transition-opacity active:opacity-80
               disabled:cursor-not-allowed disabled:opacity-40"
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
      title: 'text-red-200',
      subtitle: 'text-red-200/80',
      confirmBtn: 'bg-red-500 text-slate-950',
    }
  }

  return {
    panel: 'border-slate-700/60 bg-slate-900/40',
    title: 'text-slate-200',
    subtitle: 'text-slate-400',
    confirmBtn: 'bg-sky-500 text-slate-950',
  }
})
</script>

