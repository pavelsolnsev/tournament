<template>
  <div class="space-y-3">
    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="choosePhoto" />
    <div class="flex flex-wrap gap-2">
      <AtomsPrimaryButton variant="muted" size="md" @click="fileInput?.click()">Загрузить фото</AtomsPrimaryButton>
      <AtomsPrimaryButton v-if="image || pending" variant="muted" size="md" @click="clear">Отменить загрузку</AtomsPrimaryButton>
    </div>
    <p v-if="pending" role="status" class="text-sm">Открываем фотографию…</p>
    <p v-if="error" role="alert" class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
    <div v-if="image" class="flex flex-wrap items-center gap-4 rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
      <canvas ref="preview" :width="playerPhotoDimensions[0]" :height="playerPhotoDimensions[0]" class="h-24 w-24 rounded-full" aria-label="Предпросмотр аватара" role="img" />
      <div class="min-w-28 flex-1 space-y-2">
        <label v-for="slider in sliders" :key="slider.label" class="block text-xs">
          {{ slider.label }}
          <input v-model.number="slider.value.value" type="range" :min="slider.min" :max="slider.max" class="block w-full accent-brand-600" />
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { base64ByteLength, playerPhotoDimensions, playerPhotoMaxBytes, playerPhotoTargetBytes } from '~/utils/playerPhotoSize'

const emit = defineEmits<{ change: [photo: string | null]; pending: [value: boolean] }>()
const preview = useTemplateRef<HTMLCanvasElement>('preview')
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const image = shallowRef<HTMLImageElement | null>(null)
const zoom = ref(100)
const horizontal = ref(50)
const vertical = ref(50)
const sliders = [
  { label: 'Масштаб', value: zoom, min: 100, max: 300 },
  { label: 'Слева направо', value: horizontal, min: 0, max: 100 },
  { label: 'Сверху вниз', value: vertical, min: 0, max: 100 },
]
const pending = ref(false)
const error = ref('')
let selection = 0

function clear() {
  selection++
  image.value = null
  pending.value = false
  error.value = ''
  emit('change', null)
  emit('pending', false)
}

async function choosePhoto(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  clear()
  if (file.size > 20 * 1024 * 1024) {
    error.value = 'Выберите фотографию до 20 МБ.'
    return
  }
  const current = selection
  pending.value = true
  emit('pending', true)
  const url = URL.createObjectURL(file)
  try {
    const candidate = new Image()
    candidate.src = url
    await candidate.decode()
    if (current !== selection) return
    if (!candidate.naturalWidth || !candidate.naturalHeight) throw new Error()
    zoom.value = 100
    horizontal.value = 50
    vertical.value = 50
    image.value = candidate
  } catch {
    if (current === selection) error.value = 'Не удалось открыть фото. Попробуйте JPG, PNG или WebP.'
  } finally {
    URL.revokeObjectURL(url)
    if (current === selection) {
      pending.value = false
      emit('pending', false)
    }
  }
}

function compressPhoto(previewCanvas: HTMLCanvasElement) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return null
  canvas.width = 1
  canvas.height = 1
  const format = canvas.toDataURL('image/webp').startsWith('data:image/webp;') ? 'image/webp' : 'image/jpeg'
  for (const size of playerPhotoDimensions) {
    canvas.width = size
    canvas.height = size
    context.drawImage(previewCanvas, 0, 0, size, size)
    let acceptable: string | null = null
    for (const quality of [0.86, 0.76, 0.66]) {
      const encoded = canvas.toDataURL(format, quality).split(',')[1]
      if (!encoded) continue
      const bytes = base64ByteLength(encoded)
      if (bytes <= playerPhotoTargetBytes) return encoded
      if (bytes <= playerPhotoMaxBytes) acceptable ??= encoded
    }
    if (acceptable) return acceptable
  }
  return null
}

watchEffect(() => {
  const canvas = preview.value
  const photo = image.value
  const context = canvas?.getContext('2d')
  if (!canvas || !photo || !context) return
  const side = Math.min(photo.naturalWidth, photo.naturalHeight) * 100 / zoom.value
  const x = (photo.naturalWidth - side) * horizontal.value / 100
  const y = (photo.naturalHeight - side) * vertical.value / 100
  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(photo, x, y, side, side, 0, 0, canvas.width, canvas.height)
  const encoded = compressPhoto(canvas)
  error.value = encoded ? '' : 'Не удалось сжать фото до 20 КБ. Выберите другой снимок.'
  emit('change', encoded)
})
</script>
