<template>
  <li
    class="rounded-xl border border-slate-200 bg-white text-left transition dark:border-transparent dark:bg-slate-800/50"
    :class="[
      rootClass,
      splitActions
        ? 'grid min-w-0 grid-cols-[auto,minmax(0,1fr),auto] items-start gap-x-3 gap-y-2 px-3 py-2.5 sm:grid-cols-[auto,minmax(0,1fr),4rem,auto] sm:items-center sm:gap-y-0 sm:py-2'
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
      class="shrink-0 self-center"
      :photo="photo"
      :fallback-name="avatarFallbackName ?? label"
      size="sm"
    />
    <!-- В режиме splitActions держим строгие колонки: имя и рейтинг не должны сдвигать кнопки оплаты. -->
    <template v-if="splitActions">
      <div class="min-w-0 self-center pt-0.5 sm:pt-0">
        <span class="block truncate text-sm font-semibold leading-snug text-slate-800 dark:text-slate-100">
          {{ label }}
        </span>
        <MoleculesDropdownSelect
          v-if="hasVkTeamPicker"
          :model-value="vkTeamPickerValue"
          :options="vkTeamPickerOptions"
          title="Команда (как в списке ВК)"
          trigger-class="!h-auto !min-h-8 !w-full !max-w-full !justify-start px-2 py-1 text-left text-xs font-medium"
          @update:model-value="onVkTeamPick"
        />
        <span
          v-else-if="caption"
          class="mt-1 block truncate text-xs font-medium leading-snug text-slate-500 dark:text-slate-400"
        >
          {{ caption }}
        </span>
      </div>
      <span
        class="shrink-0 justify-self-end self-center whitespace-nowrap text-right text-sm font-semibold leading-none tabular-nums text-slate-800 dark:text-slate-100 min-w-[3.5rem] sm:min-w-[4rem]"
        aria-label="Рейтинг"
      >
        {{ rating ?? '' }}
      </span>
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

    <!-- Выбранные в турнире: отдельные кнопки — не кликать по всей строке. -->
    <div
      v-if="splitActions"
      class="col-span-3 flex min-w-0 items-stretch justify-end gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-700/50 sm:col-span-1 sm:col-start-4 sm:row-start-1 sm:items-center sm:self-stretch sm:border-t-0 sm:border-l sm:border-slate-200/90 sm:pl-3 sm:pt-0 dark:sm:border-slate-600/70"
    >
      <button
        type="button"
        class="inline-flex min-h-11 min-w-0 flex-1 touch-manipulation items-center justify-center rounded-xl px-3 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 sm:h-11 sm:min-w-[5.5rem] sm:flex-none sm:px-3 sm:text-sm"
        :class="playerPaid
          ? 'bg-emerald-500/20 text-emerald-900 ring-1 ring-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/35'
          : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800'"
        :aria-pressed="playerPaid"
        :aria-label="playerPaid ? 'Оплачено, нажми чтобы снять отметку' : 'Отметить оплату'"
        :title="playerPaid ? 'Снять отметку оплаты' : 'Отметить оплату'"
        @click.stop.prevent="emit('togglePaid')"
      >
        {{ playerPaid ? 'Оплачено' : 'Оплата' }}
      </button>
      <button
        type="button"
        class="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-light leading-none text-slate-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:border-red-500/50 dark:hover:bg-red-950/40 dark:hover:text-red-300"
        :title="title"
        :aria-label="title"
        @click.stop.prevent="emit('activate')"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>

    <template v-else>
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
