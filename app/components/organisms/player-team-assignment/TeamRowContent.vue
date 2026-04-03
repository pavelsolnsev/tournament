<!-- Внутренний компонент: одна строка команды в панели. -->
<template>
  <!-- Одна строка: маркер + имя + бейдж | кнопки справа — всё на одной высоте. -->
  <div class="flex min-h-[2.5rem] items-center gap-2">

    <!-- Левая часть: кнопка выбора команды (маркер + имя + статус) -->
    <button
      type="button"
      class="flex min-w-0 flex-1 items-center gap-2 rounded text-left focus:outline-none"
      @click="emit('select')"
    >
      <!-- Маркер цвета -->
      <span aria-hidden="true" class="shrink-0 text-base leading-none">{{ teamMarker(name) }}</span>

      <!-- Имя + бейдж «Участвует» в одну строку, без переноса -->
      <span class="flex min-w-0 items-center gap-1.5">
        <span class="min-w-0 truncate text-sm font-medium text-slate-800 dark:text-slate-100">{{ name }}</span>
        <span
          v-if="isTeamConfirmed(name)"
          class="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] leading-none text-emerald-700 dark:text-emerald-300"
        >
          ✓
        </span>
      </span>
    </button>

    <!-- Правая часть: счётчик игроков + select цвета + кнопка действия + удалить -->
    <div class="flex shrink-0 items-center gap-1">

      <!-- Количество игроков — небольшой текст, не растягивает строку -->
      <span class="w-6 text-center text-xs tabular-nums text-slate-400 dark:text-slate-500">
        {{ teamPlayerCounts[name] ?? 0 }}
      </span>

      <!-- Select цвета — компактный, только эмодзи.
           text-slate-800 на самом select — без этого Safari/Chrome показывает системный серый. -->
      <select
        :value="String(getTeamColor(name))"
        class="h-8 w-10 rounded-lg border border-slate-300 dark:border-slate-700/60 bg-white dark:bg-slate-900/70 text-center text-sm text-slate-800 dark:text-slate-100
               cursor-pointer transition-colors hover:border-slate-400 dark:hover:border-slate-500
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        title="Цвет команды"
        @change="emit('set-color', Number(($event.target as HTMLSelectElement).value))"
      >
        <option
          v-for="(m, idx) in teamMarkers"
          :key="idx"
          class="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          :value="String(idx)"
        >
          {{ m }}
        </option>
      </select>

      <!-- Подтвердить участие — показывается если команда НЕ подтверждена и есть игроки -->
      <button
        v-if="(teamPlayerCounts[name] ?? 0) > 0 && !isTeamConfirmed(name)"
        type="button"
        class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-sm font-medium text-emerald-800
               transition-colors md:hover:bg-emerald-500/25 dark:text-emerald-300
               focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        title="Подтвердить участие в турнире"
        @click="emit('confirm')"
      >
        ✓
      </button>

      <!-- Убрать из участников — показывается если команда подтверждена -->
      <button
        v-else-if="isTeamConfirmed(name)"
        type="button"
        class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700/40 text-sm font-medium text-slate-500 dark:text-slate-400
               transition-colors md:hover:bg-slate-300 dark:md:hover:bg-slate-700/60 md:hover:text-slate-700 dark:md:hover:text-slate-200
               focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40"
        title="Убрать из участников"
        @click="emit('unconfirm')"
      >
        ↩
      </button>

      <!-- Пустой спейсер — держит ширину когда ни одна из двух кнопок не видна -->
      <span v-else class="inline-flex h-8 w-8" aria-hidden="true" />

      <!-- Удалить команду -->
      <button
        type="button"
        class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 dark:text-slate-600
               transition-colors md:hover:bg-red-500/10 md:hover:text-red-500 dark:md:hover:text-red-400
               focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
        title="Удалить команду"
        @click="emit('open-remove')"
      >
        ✕
      </button>
    </div>
  </div>

  <!-- Подтверждение удаления — якорь для прокрутки к кнопкам подтверждения -->
  <div ref="removeConfirmAnchor">
    <MoleculesConfirmInline
      class="mt-1.5"
      :open="removeConfirmTeamName === name"
      :busy="false"
      tone="danger"
      aria-label="Подтверждение удаления команды"
      title="Удалить команду?"
      :subtitle="`Команда «${name}» будет удалена.`"
      cancel-text="Отмена"
      confirm-text="Удалить"
      @cancel="emit('cancel-remove')"
      @confirm="emit('confirm-remove')"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, watch } from 'vue'
import MoleculesConfirmInline from '~/components/molecules/ConfirmInline.vue'

const props = defineProps<{
  name: string
  selectedTeamName: string
  teamPlayerCounts: Record<string, number>
  isTeamConfirmed: (name: string) => boolean
  getTeamColor: (teamName: string) => number
  teamMarker: (teamName: string) => string
  teamMarkers: readonly string[]
  removeConfirmTeamName: string | null
}>()

const removeConfirmAnchor = useTemplateRef<HTMLDivElement>('removeConfirmAnchor')

// Когда открыто подтверждение удаления именно этой строки — прокручиваем к панели.
watch(
  () => props.removeConfirmTeamName,
  (v) => {
    if (v !== props.name) return
    void nextTick(() => {
      removeConfirmAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    })
  },
  { flush: 'post' },
)

const emit = defineEmits<{
  select: []
  confirm: []
  unconfirm: []
  'set-color': [colorIndex: number]
  'open-remove': []
  'confirm-remove': []
  'cancel-remove': []
}>()
</script>
