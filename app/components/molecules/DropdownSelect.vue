<!-- Выпадающий список вместо нативного select: кнопка-триггер + панель опций. -->
<template>
  <div ref="rootRef" class="relative inline-flex">
    <!-- Триггер: показывает текущую метку и открывает список по клику. -->
    <button
      type="button"
      class="inline-flex h-8 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm text-slate-800
             transition-colors hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40
             dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-slate-500"
      :class="open && 'border-emerald-400/60 ring-2 ring-emerald-500/25 dark:border-emerald-500/40'"
      :title="title"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-label="title"
      @click="toggle"
      @keydown.escape.prevent="close"
    >
      <span aria-hidden="true" class="leading-none">{{ currentLabel }}</span>
    </button>

    <!-- Панель опций: fixed + Teleport — как у выбора хозяев/гостей, не режется overflow родителя. -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-150 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
        @after-enter="onPanelAfterEnter"
      >
        <div
          v-if="open"
          ref="panelRef"
          class="fixed z-[100] min-w-[2.5rem] touch-manipulation rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700/60 dark:bg-slate-900"
          :style="panelStyle"
          role="listbox"
          :aria-label="title"
        >
          <button
            v-for="opt in options"
            :key="String(opt.value)"
            type="button"
            role="option"
            class="flex h-8 w-full items-center justify-center px-2 text-sm text-slate-800 transition-colors
                   hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/30
                   dark:text-slate-100 dark:hover:bg-slate-800/60 dark:focus-visible:bg-slate-800/60"
            :class="isSelected(opt.value) && 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'"
            :aria-selected="isSelected(opt.value)"
            @click="choose(opt.value)"
          >
            <span class="leading-none">{{ opt.label }}</span>
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string | number
  options: ReadonlyArray<{ value: string | number; label: string }>
  title?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const rootRef = useTemplateRef<HTMLDivElement>('rootRef')
const panelRef = useTemplateRef<HTMLDivElement>('panelRef')

const open = ref(false)

// Сравниваем значения как строки — так совпадает с прежним select (value были строками).
const isSelected = (v: string | number) => String(v) === String(props.modelValue)

const currentLabel = computed(() => {
  const found = props.options.find((o) => isSelected(o.value))
  return found?.label ?? '—'
})

const panelStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' })

// Координаты панели в viewport — тот же зазор 4px, что и в StepStandingsTeamPickers.
const DROPDOWN_GAP_PX = 4

async function positionPanel() {
  await nextTick()
  const el = rootRef.value
  if (!el) return
  const r = el.getBoundingClientRect()
  panelStyle.value = {
    top: `${r.bottom + DROPDOWN_GAP_PX}px`,
    left: `${r.left}px`,
  }
}

// После анимации входа пересчитываем — к этому моменту панель в DOM, координаты стабильны.
function onPanelAfterEnter() {
  if (import.meta.server) return
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      void positionPanel()
    })
  })
}

function toggle() {
  open.value = !open.value
  if (open.value) void positionPanel()
}

function close() {
  open.value = false
}

function choose(v: string | number) {
  emit('update:modelValue', v)
  close()
}

// При открытии пересчитываем позицию (скролл, ресайз).
watch(open, (v) => {
  if (v) void positionPanel()
})

function onPointerDownDoc(ev: PointerEvent) {
  if (!open.value) return
  const t = ev.target as Node
  if (rootRef.value?.contains(t)) return
  if (panelRef.value?.contains(t)) return
  close()
}

function onScrollOrResize() {
  if (open.value) void positionPanel()
}

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDownDoc, true)
  window.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDownDoc, true)
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
})
</script>
