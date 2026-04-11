<template>
  <!-- Есть логотип в team-photos — круг как у цветного эмодзи; иначе маркер в той же клетке по размеру. -->
  <img
    v-if="logoSrc"
    :src="logoSrc"
    :alt="teamName"
    :class="boxClass"
    class="shrink-0 overflow-hidden rounded-full object-cover ring-1 ring-slate-300/90 dark:ring-slate-600/80 bg-white/90 dark:bg-slate-900/60"
    loading="lazy"
    decoding="async"
  />
  <span
    v-else
    class="inline-flex shrink-0 items-center justify-center leading-none"
    :class="[boxClass, emojiClass]"
    aria-hidden="true"
  >{{ marker }}</span>
</template>

<script setup lang="ts">
import { getTeamLogoSrc } from '~/utils/teamLogos'

const props = withDefaults(
  defineProps<{
    teamName: string
    marker: string
    /** xs таблица/строки, sm по умолчанию, md крупнее, lg/xl — шапки и карточки. */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  { size: 'sm' },
)

const logoSrc = computed(() => getTeamLogoSrc(props.teamName))

// Одна сетка размеров для картинки и для эмодзи — так круг логотипа совпадает с «кружком» маркера.
const boxClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'h-4 w-4'
    case 'sm':
      return 'h-5 w-5'
    case 'md':
      return 'h-6 w-6'
    case 'lg':
      return 'h-8 w-8'
    case 'xl':
      return 'h-10 w-10'
    default:
      return 'h-5 w-5'
  }
})

// Кегль чуть крупнее клетки, чтобы 🔴 визуально заполнял тот же диаметр, что и фото в круге.
const emojiClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'text-sm'
    case 'sm':
      return 'text-lg'
    case 'md':
      return 'text-xl'
    case 'lg':
      return 'text-2xl'
    case 'xl':
      return 'text-3xl'
    default:
      return 'text-lg'
  }
})
</script>
