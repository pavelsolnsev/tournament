<!-- Внутренний компонент: одна строка команды в панели. Выбор строки — на уровне li в TeamsPanel. -->
<template>
  <!-- Сетка: название | число игроков | действия — одна линия по центру, без «лесенки» на мобилке. -->
  <div
    class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2 sm:gap-x-3"
  >
    <div class="flex min-w-0 items-center gap-2">
      <AtomsTeamMarkerOrLogo
        :team-name="name"
        :marker="teamMarker(name)"
        class="shrink-0"
        size="md"
      />
      <span
        class="min-w-0 flex-1 truncate text-sm font-medium leading-snug text-slate-800 dark:text-slate-100"
        :title="name"
      >{{ name }}</span>
    </div>

    <span
      class="min-w-[2rem] shrink-0 text-right text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-400 sm:min-w-[2.25rem]"
      :aria-label="`Игроков в команде: ${teamPlayerCounts[name] ?? 0}`"
    >
      {{ teamPlayerCounts[name] ?? 0 }}
    </span>

    <!-- Клики здесь не должны всплывать до li (выбор команды) -->
    <div data-team-row-stop class="flex shrink-0 items-center justify-end gap-1">

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
        class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700/40 text-sm font-medium text-slate-600 dark:text-slate-400
               transition-colors md:hover:bg-slate-300 dark:md:hover:bg-slate-700/60 md:hover:text-slate-700 dark:md:hover:text-slate-200
               focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40"
        title="Убрать из участников"
        @click="emit('unconfirm')"
      >
        ↩
      </button>

      <!-- Удалить команду -->
      <button
        v-if="canManageTeams"
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
      :open="canManageTeams && removeConfirmTeamName === name"
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
import { computed, nextTick, watch } from 'vue'
import { useAdminAuth } from '~/composables/useAdminAuth'
import MoleculesConfirmInline from '~/components/molecules/ConfirmInline.vue'

const props = defineProps<{
  name: string
  teamPlayerCounts: Record<string, number>
  isTeamConfirmed: (name: string) => boolean
  getTeamColor: (teamName: string) => number
  teamMarker: (teamName: string) => string
  teamMarkers: readonly string[]
  removeConfirmTeamName: string | null
}>()

const removeConfirmAnchor = useTemplateRef<HTMLDivElement>('removeConfirmAnchor')

// Simple10: Ограниченный админ (limited) не может удалять команды.
const { adminRole } = useAdminAuth()
const canManageTeams = computed(() => adminRole.value === 'full')

// Когда открыто подтверждение удаления именно этой строки — прокручиваем к панели.
watch(
  () => props.removeConfirmTeamName,
  (v) => {
    // Simple10: Для limited подтверждение удаления не показываем и не скроллим.
    if (!canManageTeams.value) return
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
