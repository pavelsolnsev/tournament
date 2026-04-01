<template>
  <li
    role="button"
    tabindex="0"
    class="flex h-11 min-w-0 cursor-pointer items-center gap-2 rounded-xl border border-transparent bg-slate-800/50 px-3 text-left transition md:hover:bg-slate-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 active:scale-[0.99]"
    :class="rootClass"
    :title="title"
    @click="emit('activate')"
    @keydown.enter.prevent="emit('activate')"
    @keydown.space.prevent="emit('activate')"
  >
    <!-- Аватар + подпись; имя для инициалов — настоящее name, не строка с рейтингом. -->
    <AtomsPlayerAvatar
      class="shrink-0"
      :photo="photo"
      :fallback-name="avatarFallbackName ?? label"
      size="sm"
    />
    <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-100">{{ label }}</span>
    <span
      v-if="action !== 'none'"
      class="shrink-0 select-none text-xs leading-none"
      :class="action === 'add' ? 'text-emerald-400' : 'text-slate-500'"
      aria-hidden="true"
    >
      {{ action === 'add' ? '+' : '×' }}
    </span>
  </li>
</template>

<script setup lang="ts">
// Строка списка игрока: одинаковый вид и клик / Enter / Пробел для всех шагов турнира.
defineProps<{
  label: string
  title: string
  /** add — в список; remove — из списка; none — без значка (редко). */
  action: 'add' | 'remove' | 'none'
  /** Доп. классы на <li>, например ширина в flex-wrap. */
  rootClass?: string
  /** Имя файла из players.photo — картинка из /player-photos/. */
  photo?: string | null
  /** Имя для инициалов; если не задано — первый символ label (если в label есть рейтинг, лучше передать name). */
  avatarFallbackName?: string
}>()

const emit = defineEmits<{ activate: [] }>()
</script>
