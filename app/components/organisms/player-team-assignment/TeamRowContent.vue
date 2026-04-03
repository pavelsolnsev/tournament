<!-- Внутренний компонент: одна строка команды в панели. Выбор строки — на уровне li в TeamsPanel. -->
<template>
  <div class="flex min-h-[2.5rem] items-start gap-2 lg:items-center">
    <!-- Маркер + имя + бейдж: до 2 строк на узкой колонке, без обрезки в одну букву -->
    <div class="flex min-w-0 flex-1 items-start gap-2 lg:items-center">
      <span aria-hidden="true" class="shrink-0 pt-0.5 text-base leading-none lg:pt-0">{{ teamMarker(name) }}</span>
      <span class="flex min-w-0 items-start gap-1.5 lg:items-center">
        <span class="min-w-0 break-words text-sm font-medium leading-snug text-slate-800 dark:text-slate-100 line-clamp-2">{{ name }}</span>
        <span
          v-if="isTeamConfirmed(name)"
          class="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] leading-none text-emerald-700 dark:text-emerald-300"
        >
          ✓
        </span>
      </span>
    </div>

    <span class="w-6 shrink-0 text-center text-xs tabular-nums text-slate-400 dark:text-slate-500">
      {{ teamPlayerCounts[name] ?? 0 }}
    </span>

    <!-- Клики здесь не должны всплывать до li (выбор команды) -->
    <div data-team-row-stop class="flex shrink-0 items-center gap-1">

      <!-- Выбор цвета (маркер): кастомный список вместо нативного select — единая стилистика с выпадашками матчей. -->
      <MoleculesDropdownSelect
        :model-value="getTeamColor(name)"
        title="Цвет команды"
        :options="teamMarkers.map((m, idx) => ({ value: idx, label: m }))"
        @update:model-value="emit('set-color', Number($event))"
      />

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

  <!-- Подтверждение удаления — внутри li; клики не должны выбирать команду -->
  <div ref="removeConfirmAnchor" data-team-row-stop>
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
  confirm: []
  unconfirm: []
  'set-color': [colorIndex: number]
  'open-remove': []
  'confirm-remove': []
  'cancel-remove': []
}>()
</script>
