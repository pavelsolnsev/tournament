<template>
  <li
    class="rounded-xl border border-slate-200 bg-white text-left transition dark:border-transparent dark:bg-slate-800/50"
    :class="[
      rootClass,
      splitActions
        ? 'flex min-h-[3.25rem] min-w-0 items-center gap-2 px-3 py-2'
        : 'flex min-h-11 items-center gap-2 px-2 py-1 sm:min-h-12 sm:gap-2.5 sm:px-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 md:hover:bg-slate-100 dark:md:hover:bg-slate-700/60 active:scale-[0.99]',
    ]"
    :role="splitActions ? 'listitem' : 'button'"
    :tabindex="splitActions ? undefined : 0"
    :title="splitActions ? undefined : title"
    @click="!splitActions && emit('activate')"
    @keydown.enter.prevent="!splitActions && emit('activate')"
    @keydown.space.prevent="!splitActions && emit('activate')"
  >
    <AtomsPlayerAvatar
      class="shrink-0"
      :photo="photo"
      :fallback-name="avatarFallbackName ?? label"
      size="sm"
    />
    <!-- splitActions: одна строка — имя + рейтинг + кнопки оплаты и удаления. -->
    <template v-if="splitActions">
      <div class="min-w-0 flex-1">
        <span class="block truncate text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100">
          {{ label }}
        </span>
        <MoleculesDropdownSelect
          v-if="hasVkTeamPicker"
          :model-value="vkTeamPickerValue"
          :options="vkTeamPickerOptions"
          title="Команда (как в списке ВК)"
          trigger-class="!h-auto !min-h-7 !w-full !max-w-full !justify-start px-2 py-0.5 text-left text-xs font-medium"
          @update:model-value="onVkTeamPick"
        />
        <span
          v-else-if="caption"
          class="block truncate text-xs font-medium leading-snug text-slate-500 dark:text-slate-400"
        >
          {{ caption }}
        </span>
      </div>
      <span
        v-if="rating"
        class="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums text-slate-500 dark:text-slate-400"
        aria-label="Рейтинг"
      >
        {{ rating }}
      </span>
      <!-- Кнопка оплаты: иконка ₽ / галочка — компактно, без текста. -->
      <button
        type="button"
        class="shrink-0 inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        :class="playerPaid
          ? 'bg-emerald-500/20 text-emerald-700 ring-1 ring-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30'
          : 'border border-slate-200 bg-white text-slate-400 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-500 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300'"
        :aria-pressed="playerPaid"
        :aria-label="playerPaid ? 'Оплачено — нажми чтобы снять' : 'Отметить оплату'"
        :title="playerPaid ? 'Снять отметку оплаты' : 'Отметить оплату'"
        @click.stop.prevent="emit('togglePaid')"
      >
        <svg
          v-if="playerPaid"
          class="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
        <span v-else class="text-base font-bold leading-none" aria-hidden="true">₽</span>
      </button>
      <!-- Кнопка удаления из турнира. -->
      <button
        type="button"
        class="shrink-0 inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-light leading-none text-slate-400 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:border-red-500/50 dark:hover:bg-red-950/40 dark:hover:text-red-300"
        :title="title"
        :aria-label="title"
        @click.stop.prevent="emit('activate')"
      >
        <span aria-hidden="true">×</span>
      </button>
    </template>
    <template v-else>
      <div
        v-if="caption"
        class="min-w-0 flex-1"
      >
        <span
          v-if="rating == null || rating === ''"
          class="block truncate text-sm font-medium text-slate-800 dark:text-slate-100"
        >{{ label }}</span>
        <span
          v-else
          class="flex min-w-0 items-center gap-1 overflow-hidden"
        >
          <span class="min-w-0 truncate text-sm font-medium text-slate-800 dark:text-slate-100">{{ label }}</span>
          <span class="shrink-0 whitespace-nowrap text-sm font-medium leading-tight text-slate-800 dark:text-slate-100 tabular-nums">{{ rating }}</span>
        </span>
        <span class="mt-0.5 block truncate text-xs font-medium text-slate-500 dark:text-slate-400">{{ caption }}</span>
      </div>
      <span
        v-else-if="rating == null || rating === ''"
        class="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100"
      >{{ label }}</span>
      <span
        v-else
        class="flex min-w-0 flex-1 items-center gap-1 overflow-hidden"
      >
        <span class="min-w-0 truncate text-sm font-medium text-slate-800 dark:text-slate-100">{{ label }}</span>
        <span class="shrink-0 whitespace-nowrap text-sm font-medium leading-tight text-slate-800 dark:text-slate-100 tabular-nums">{{ rating }}</span>
      </span>
    </template>

    <template v-if="!splitActions">
      <button
        v-if="showPaidToggle"
        type="button"
        class="shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        :class="playerPaid
          ? 'border-emerald-500/70 bg-emerald-500/15 text-emerald-800 dark:border-emerald-400/50 dark:bg-emerald-500/10 dark:text-emerald-300'
          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:border-slate-500'"
        :aria-pressed="playerPaid"
        :title="playerPaid ? 'Оплачено — нажми, чтобы снять' : 'Отметить оплату'"
        @click.stop.prevent="emit('togglePaid')"
      >
        {{ playerPaid ? 'Опл.' : '₽' }}
      </button>
      <span
        v-if="action !== 'none'"
        class="shrink-0 select-none text-xs leading-none"
        :class="action === 'add' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-500'"
        aria-hidden="true"
      >
        {{ action === 'add' ? '+' : '×' }}
      </span>
    </template>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  /** Вторая строка (например команда с кнопки ВК). */
  caption?: string | null
  /** Слоты с кнопок бота. */
  vkTeamSlotOptions?: string[] | null
  /** Текущая команда (как на сайте / в ВК). */
  vkTeamValue?: string | null
  title: string
  action: 'add' | 'remove' | 'none'
  rootClass?: string
  photo?: string | null
  avatarFallbackName?: string
  rating?: string | null
  showPaidToggle?: boolean
  playerPaid?: boolean
}>()

const splitActions = computed(
  () => props.showPaidToggle === true && props.action === 'remove',
)

const hasVkTeamPicker = computed(
  () => splitActions.value && (props.vkTeamSlotOptions?.length ?? 0) > 0,
)

const vkTeamPickerOptions = computed(() => {
  const slots = props.vkTeamSlotOptions ?? []
  if (slots.length === 0) return []
  return [
    ...slots.map((t) => ({ value: t, label: t })),
    { value: '__none', label: 'Без команды' },
  ]
})

const vkTeamPickerValue = computed(() => {
  const v = props.vkTeamValue
  if (v && String(v).trim()) {
    return String(v).trim()
  }
  return '__none'
})

const emit = defineEmits<{
  activate: []
  togglePaid: []
  updateVkTeam: [value: string | null]
}>()

function onVkTeamPick(v: string | number) {
  if (v === '__none') {
    emit('updateVkTeam', null)
    return
  }
  emit('updateVkTeam', String(v))
}
</script>
