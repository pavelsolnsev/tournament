<template>
  <!-- Карточка индивидуальной награды — иконка, заголовок, список победителей. -->
  <div
    class="flex flex-col gap-0 rounded-xl border"
    :class="borderClass"
  >
    <!-- Шапка: иконка + название + значение -->
    <div class="flex items-center gap-2.5 px-3.5 pt-3 pb-2.5">
      <span
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px] ring-1"
        :class="iconBgClass"
        aria-hidden="true"
      >{{ icon }}</span>
      <div class="min-w-0 flex-1">
        <p class="text-[10px] font-semibold uppercase tracking-widest leading-none" :class="labelClass">{{ label }}</p>
        <p class="mt-0.5 text-[12px] font-bold leading-tight" :class="valueClass">{{ valueLabel }}</p>
      </div>
    </div>

    <!-- Разделитель между шапкой и списком -->
    <div class="mx-3.5 border-t" :class="dividerClass" />

    <!-- Победители — аватар + имя + маркер команды -->
    <div class="flex flex-col gap-0 px-3.5 pt-2 pb-3">
      <div
        v-for="winner in winners"
        :key="winner.playerId"
        class="flex items-center gap-2.5 min-w-0 py-1"
      >
        <AtomsPlayerAvatar
          :photo="winner.photo"
          :fallback-name="winner.name"
          size="sm"
          class="shrink-0"
        />
        <span class="min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight text-slate-100">{{ winner.name }}</span>
        <span class="shrink-0 text-sm leading-none" aria-hidden="true">{{ winner.teamMarker }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AwardWinner } from '~/composables/useTournamentSummary'

const props = defineProps<{
  icon: string
  label: string
  valueLabel: string
  color: 'emerald' | 'sky' | 'violet'
  winners: AwardWinner[]
}>()

// Фон + граница карточки по цвету категории.
const borderClass = computed(() => ({
  emerald: 'border-emerald-500/20 bg-emerald-500/5',
  sky:     'border-sky-500/20 bg-sky-500/5',
  violet:  'border-violet-500/20 bg-violet-500/5',
}[props.color]))

// Иконка-бейдж.
const iconBgClass = computed(() => ({
  emerald: 'bg-emerald-500/15 ring-emerald-500/25',
  sky:     'bg-sky-500/15 ring-sky-500/25',
  violet:  'bg-violet-500/15 ring-violet-500/25',
}[props.color]))

// Цвет подписи категории.
const labelClass = computed(() => ({
  emerald: 'text-emerald-500/80',
  sky:     'text-sky-500/80',
  violet:  'text-violet-500/80',
}[props.color]))

// Цвет значения показателя.
const valueClass = computed(() => ({
  emerald: 'text-emerald-300',
  sky:     'text-sky-300',
  violet:  'text-violet-300',
}[props.color]))

// Разделитель — того же цвета что и граница.
const dividerClass = computed(() => ({
  emerald: 'border-emerald-500/15',
  sky:     'border-sky-500/15',
  violet:  'border-violet-500/15',
}[props.color]))
</script>
