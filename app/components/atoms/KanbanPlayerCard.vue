<template>
  <div
    :data-player-id="player.id"
    class="flex min-h-[44px] cursor-pointer select-none items-center gap-2 rounded-xl px-2.5 py-1.5 transition-colors"
    :class="cardClass"
    role="button"
    :tabindex="0"
    :aria-pressed="isSelected"
    @click.stop="emit('click')"
    @keydown.enter.prevent="emit('click')"
    @keydown.space.prevent="emit('click')"
  >
    <!-- Аватар: фото из public/player-photos/ или инициалы -->
    <picture v-if="photoJpg" class="block h-7 w-7 shrink-0 overflow-hidden rounded-full">
      <source v-if="photoWebp" :srcset="photoWebp" type="image/webp" />
      <img
        :src="photoJpg"
        :alt="nameParts.name"
        class="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </picture>
    <span
      v-else
      class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold uppercase text-slate-600 dark:bg-slate-700 dark:text-slate-300"
      aria-hidden="true"
    >{{ initials }}</span>

    <!-- Имя игрока — усекается при нехватке места -->
    <span
      class="min-w-0 flex-1 truncate text-sm leading-snug"
      :class="isSelected ? 'font-semibold text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'"
    >{{ nameParts.name }}</span>

    <!-- Рейтинг — всегда справа, не усекается -->
    <span v-if="nameParts.rating" class="shrink-0 text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
      {{ nameParts.rating }}
    </span>

    <!-- Иконка обмена — видна когда этот игрок — цель для свапа -->
    <span
      v-if="isSwapTarget"
      class="shrink-0 text-[11px] leading-none text-slate-400 dark:text-slate-600"
      aria-hidden="true"
    >⇄</span>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import { computed } from 'vue'
import { playerLabelRatingParts, displayPlayerLabelWithoutRating } from '~/composables/usePlayerDisplay'
import { playerPhotoPublicUrl, playerPhotoWebpPublicUrl } from '~/utils/playerPhotoUrl'

const props = defineProps<{
  player: Player
  /** Этот игрок сейчас выбран для перемещения или обмена. */
  isSelected: boolean
  /** Другой игрок выбран и этот — цель для свапа (из другой команды). */
  isSwapTarget: boolean
}>()

const emit = defineEmits<{ click: [] }>()

// Имя и рейтинг отдельно — рейтинг не усекается.
const nameParts = computed(() => playerLabelRatingParts(props.player))

// URL фото (jpg и webp). null если фото нет.
const photoJpg = computed(() => playerPhotoPublicUrl(props.player.photo))
const photoWebp = computed(() => playerPhotoWebpPublicUrl(props.player.photo))

// Инициал для fallback-кружка.
const initials = computed(() => {
  const name = displayPlayerLabelWithoutRating(props.player)
  return (name.charAt(0) || '?').toUpperCase()
})

// Фон и кольцо зависят от состояния выбора/свапа.
const cardClass = computed(() => {
  if (props.isSelected)
    return 'bg-emerald-500/15 ring-2 ring-emerald-500/60 dark:bg-emerald-500/20 dark:ring-emerald-500/50'
  if (props.isSwapTarget)
    return 'bg-white dark:bg-slate-900/40 ring-1 ring-slate-300/60 dark:ring-slate-700/50 md:hover:ring-emerald-400/50 md:hover:bg-emerald-500/5'
  return 'bg-white dark:bg-slate-900/40 md:hover:bg-slate-50 dark:md:hover:bg-slate-900/60'
})
</script>
