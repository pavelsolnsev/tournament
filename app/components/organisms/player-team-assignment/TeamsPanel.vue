<!-- Компонент TeamsPanel: команды на тех же панели/полях, что игроки. -->
<template>
  <AtomsTournamentPanel as="section" root-class="lg:col-span-2">
    <AtomsPanelHeading>Команды</AtomsPanelHeading>

    <!-- Поле + кнопка: items-end выравнивает кнопку с инпутом, игнорируя лейбл -->
    <div class="flex items-end gap-2">
      <MoleculesFieldBlock
        id="new-team-name"
        label="Новая команда"
        wrapper-class="flex-1"
      >
        <AtomsTournamentTextInput
          :model-value="newTeamNameValue"
          variant="field"
          size="sm"
          placeholder="Напр. Леон"
          id="new-team-name"
          @update:model-value="emit('update:newTeamName', $event)"
          @keydown.enter.prevent="emit('addNewTeam')"
        />
      </MoleculesFieldBlock>

      <!-- size="md" даёт h-11 — совпадает с высотой инпута -->
      <AtomsPrimaryButton
        size="md"
        title="Создать команду"
        @click="emit('addNewTeam')"
      >
        +
      </AtomsPrimaryButton>
    </div>

    <AtomsEmptyStateBox v-if="allTeams.length === 0" align="start" size="sm">
      Команд пока нет — создайте первую.
    </AtomsEmptyStateBox>

    <ul v-else class="max-h-96 space-y-2 overflow-y-auto pr-1" role="list">
      <li
        v-for="name in allTeams"
        :key="name"
        class="rounded-xl border p-2 transition sm:p-3"
        :class="selectedTeamName === name ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-slate-800/50 bg-slate-900/30 hover:bg-slate-900/50'"
      >
        <div class="flex items-start justify-between gap-2">
          <button
            type="button"
            class="min-w-0 flex-1 rounded text-left focus:outline-none"
            @click="emit('selectTeam', name)"
          >
            <div class="flex min-w-0 items-center gap-2">
              <span aria-hidden="true" class="shrink-0 text-base">{{ teamMarker(name) }}</span>
              <span class="min-w-0 truncate text-sm font-medium text-slate-100">{{ name }}</span>
            </div>

            <div class="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
              <span>{{ teamPlayerCounts[name] ?? 0 }} игроков</span>
              <span v-if="isTeamConfirmed(name)" class="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] text-emerald-300">
                Участвует
              </span>
            </div>
          </button>

          <div class="flex shrink-0 items-center gap-2">
            <!-- Select цвета команды — h-9 совпадает с кнопками рядом -->
            <select
              :value="String(getTeamColor(name))"
              class="h-9 rounded-xl border border-slate-700/60 bg-slate-900/70 px-2 text-sm text-slate-100
                     transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              title="Цвет команды"
              @change="emit('setTeamColor', name, Number(($event.target as HTMLSelectElement).value))"
            >
              <option
                v-for="(m, idx) in teamMarkers"
                :key="idx"
                class="bg-slate-900 text-slate-100"
                :value="String(idx)"
              >
                {{ m }}
              </option>
            </select>

            <!-- Кнопки действий — h-9 = одна высота с select цвета рядом -->
            <button
              v-if="(teamPlayerCounts[name] ?? 0) > 0 && !isTeamConfirmed(name)"
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-sm font-medium text-emerald-300
                     transition-colors md:hover:bg-emerald-500/25
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              title="Команда участвует в турнире"
              @click="emit('confirmTeam', name)"
            >
              ✓
            </button>

            <button
              v-else-if="isTeamConfirmed(name)"
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-700/40 text-sm font-medium text-slate-200
                     transition-colors md:hover:bg-slate-700/60
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40"
              title="Убрать из участников турнира"
              @click="emit('unconfirmTeam', name)"
            >
              ↩
            </button>

            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm text-slate-400
                     transition-colors md:hover:bg-red-500/10 md:hover:text-red-400
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
              title="Удалить команду"
              @click="openRemoveConfirm(name)"
            >
              ✕
            </button>
          </div>
        </div>

        <MoleculesConfirmInline
          class="mt-2"
          :open="removeConfirmTeamName === name"
          :busy="false"
          tone="danger"
          aria-label="Подтверждение удаления команды"
          title="Удалить команду?"
          :subtitle="`Команда «${name}» будет удалена.`"
          cancel-text="Отмена"
          confirm-text="Удалить"
          @cancel="closeRemoveConfirm"
          @confirm="confirmRemoveTeam(name)"
        />
      </li>
    </ul>
  </AtomsTournamentPanel>
</template>

<script setup lang="ts">
import { useTeamColors } from '~/composables/useTeamColors'
import MoleculesConfirmInline from '~/components/molecules/ConfirmInline.vue'

defineProps<{
  newTeamNameValue: string
  allTeams: string[]
  selectedTeamName: string
  teamPlayerCounts: Record<string, number>
  isTeamConfirmed: (name: string) => boolean
  getTeamColor: (teamName: string) => number
  teamMarker: (teamName: string) => string
}>()

const emit = defineEmits<{
  'update:newTeamName': [value: string]
  addNewTeam: []
  selectTeam: [teamName: string]
  confirmTeam: [teamName: string]
  unconfirmTeam: [teamName: string]
  setTeamColor: [teamName: string, colorIndex: number]
  removeTeam: [teamName: string]
}>()

const { teamMarkers } = useTeamColors()

const removeConfirmTeamName = ref<string | null>(null)

function closeRemoveConfirm() {
  // Закрываем подтверждение, чтобы случайный клик не удалил команду позже.
  removeConfirmTeamName.value = null
}

function openRemoveConfirm(teamName: string) {
  // Двухшаговое удаление: сначала предупреждение, потом кнопка активируется через 3 секунды.
  removeConfirmTeamName.value = teamName
}

function confirmRemoveTeam(teamName: string) {
  // Разрешаем удаление только когда таймер дошёл до нуля.
  emit('removeTeam', teamName)
  closeRemoveConfirm()
}
</script>
