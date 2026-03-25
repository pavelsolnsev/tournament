<template>
  <div
    v-if="open"
    class="rounded-xl border border-red-500/25 bg-red-500/10 p-2.5"
    role="region"
    :aria-label="ariaLabel"
  >
    <p class="text-[11px] font-semibold text-red-200">
      {{ title }}
    </p>
    <p v-if="subtitle" class="mt-0.5 text-[11px] text-red-200/80">
      {{ subtitle }}
    </p>
    <p v-else class="mt-0.5 text-[11px] text-red-200/80">
      Подтвердить можно через {{ secondsLeft }}с.
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
        class="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-slate-950
               transition-opacity active:opacity-80
               disabled:cursor-not-allowed disabled:opacity-40"
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

