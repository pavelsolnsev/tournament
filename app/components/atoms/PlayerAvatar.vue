<template>
  <span
    class="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-700/80 text-slate-200 ring-1 ring-slate-600/50"
    :class="wrapperSizeClass"
    role="img"
    :aria-label="ariaLabel"
  >
    <picture v-if="src && !imageBroken" class="h-full w-full">
      <source v-if="webpSrc" :srcset="webpSrc" type="image/webp" />
      <img
        :src="src"
        :alt="ariaLabel"
        class="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        @error="onImgError"
      />
    </picture>
    <span
      v-else
      class="select-none font-semibold uppercase leading-none"
      :class="initialsSizeClass"
    >{{ initials }}</span>
  </span>
</template>

<script setup lang="ts">
import { playerPhotoPublicUrl, playerPhotoWebpPublicUrl } from '~/utils/playerPhotoUrl'

const props = defineProps<{
  /** Имя файла из БД (колонка photo), без папок. */
  photo?: string | null
  /** Имя для инициалов и подписи доступности, если фото нет или оно не загрузилось. */
  fallbackName: string
  /** xs — компактно (шапка live и т.п.), sm — списки, md — крупнее. */
  size?: 'xs' | 'sm' | 'md'
}>()

const size = computed(() => props.size ?? 'sm')

// Размер круга под выбранный вариант — чтобы не плодить длинные тернарники в шаблоне.
const wrapperSizeClass = computed(() => {
  const s = size.value
  if (s === 'md') return 'h-8 w-8'
  if (s === 'xs') return 'h-5 w-5'
  return 'h-7 w-7'
})

// Кегль инициалов под размер круга — в xs буква остаётся читаемой.
const initialsSizeClass = computed(() => {
  const s = size.value
  if (s === 'md') return 'text-xs'
  if (s === 'xs') return 'text-[8px]'
  return 'text-[10px]'
})

const src = computed(() => playerPhotoPublicUrl(props.photo))
const webpSrc = computed(() => playerPhotoWebpPublicUrl(props.photo))

const imageBroken = ref(false)

watch(
  () => props.photo,
  () => {
    imageBroken.value = false
  },
)

function onImgError() {
  imageBroken.value = true
}

const initials = computed(() => {
  const base = (props.fallbackName || '').trim()
  if (!base) return '?'
  const first = [...base][0]
  return first ? first.toLocaleUpperCase() : '?'
})

const ariaLabel = computed(() => {
  const n = (props.fallbackName || '').trim()
  return n ? `${n} — игрок РФОИ, Раменское` : 'Игрок РФОИ, Раменское'
})
</script>
