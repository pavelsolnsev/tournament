<!-- Компонент StandingsTable: турнирная таблица мест и очков команд. -->
<template>
  <!-- Без overflow-x-auto — таблица должна помещаться в любой ширине экрана -->
  <div class="w-full rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
    <table class="w-full table-fixed border-collapse text-left">
      <colgroup>
        <!-- Фиксированные пропорции: таблица выглядит ровно и без скролла -->
        <col style="width:7%">
        <!-- Название команды может сокращаться, чтобы влезали все цифры -->
        <col style="width:33%">
        <col style="width:7%">
        <col style="width:7%">
        <col style="width:7%">
        <col style="width:7%">
        <col style="width:7%">
        <col style="width:7%">
        <col style="width:7%">
        <col style="width:11%">
      </colgroup>

      <thead>
        <!-- Шапка таблицы: светлая тема — slate-100 фон, тёмная — slate-800. -->
        <tr class="border-b border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800/80">
          <th class="whitespace-nowrap px-1 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-500 sm:px-1.5">М</th>
          <th class="px-1 py-2.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-500 sm:px-1.5">Команда</th>
          <th class="whitespace-nowrap px-1 py-2.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-500">И</th>
          <th class="whitespace-nowrap px-1 py-2.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-500">В</th>
          <th class="whitespace-nowrap px-1 py-2.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-500">Н</th>
          <th class="whitespace-nowrap px-1 py-2.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-500">П</th>
          <th class="whitespace-nowrap px-1 py-2.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-500">ЗМ</th>
          <th class="whitespace-nowrap px-1 py-2.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-500">ПМ</th>
          <th class="whitespace-nowrap px-1 py-2.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-500">РМ</th>
          <!-- Очки выделены цветом -->
          <th class="whitespace-nowrap px-1 py-2.5 text-center text-xs font-bold text-slate-600 dark:text-slate-300">О</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(row, i) in computedRows"
          :key="row.teamName"
          class="border-b border-slate-100 dark:border-slate-800/50 transition-colors last:border-0 md:hover:bg-slate-50 dark:md:hover:bg-slate-800/30"
        >
          <!-- Место -->
          <td class="whitespace-nowrap px-1 py-3 text-sm font-medium tabular-nums text-slate-600 dark:text-slate-400 sm:px-1.5">
            {{ row.place }}
          </td>

          <!-- Команда: маркер + имя — truncate не даёт ломать соседние ячейки -->
          <td class="min-w-0 px-1 py-3 sm:px-1.5">
            <div class="flex min-w-0 items-center gap-1">
              <span class="shrink-0 text-sm leading-none" aria-hidden="true">
                {{ markerForTeam(row.teamName, i) }}
              </span>
              <span class="min-w-0 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {{ row.teamName }}
              </span>
            </div>
          </td>

          <!-- И -->
          <td class="whitespace-nowrap px-1 py-3 text-center text-sm tabular-nums text-slate-600 dark:text-slate-400">
            {{ row.played }}
          </td>

          <!-- В — зелёный если есть победы -->
          <td
            class="whitespace-nowrap px-1 py-3 text-center text-sm font-medium tabular-nums"
            :class="row.wins > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-500'"
          >
            {{ row.wins }}
          </td>

          <!-- Н -->
          <td class="whitespace-nowrap px-1 py-3 text-center text-sm tabular-nums text-slate-600 dark:text-slate-500">
            {{ row.draws }}
          </td>

          <!-- П — красный если есть поражения -->
          <td
            class="whitespace-nowrap px-1 py-3 text-center text-sm tabular-nums"
            :class="row.losses > 0 ? 'text-red-500/90 dark:text-red-400/80' : 'text-slate-600 dark:text-slate-500'"
          >
            {{ row.losses }}
          </td>

          <!-- ЗМ -->
          <td class="whitespace-nowrap px-1 py-3 text-center text-sm tabular-nums text-slate-600 dark:text-slate-400">
            {{ row.goalsFor }}
          </td>

          <!-- ПМ -->
          <td class="whitespace-nowrap px-1 py-3 text-center text-sm tabular-nums text-slate-600 dark:text-slate-400">
            {{ row.goalsAgainst }}
          </td>

          <!-- РМ — цвет по знаку -->
          <td
            class="whitespace-nowrap px-1 py-3 text-center text-sm font-medium tabular-nums"
            :class="goalDiffClass(row.goalDiff)"
          >
            {{ row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff }}
          </td>

          <!-- Очки — жирные, самые заметные -->
          <td class="whitespace-nowrap px-1 py-3 text-center text-base font-bold tabular-nums text-slate-800 dark:text-slate-100">
            {{ row.points }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { useTeamColors } from '~/composables/useTeamColors'
import { resolveTeamColorIndex } from '~/utils/teamNames'

export interface StandingsRow {
  place: number
  teamName: string
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}

const props = defineProps<{
  teams: string[]
  /** Цвет команды: индекс 0–5 (🔴 🟢 🔵 🟡 ⚪ ⚫) */
  teamColors?: Record<string, number>
  /** Готовые строки. Если нет — строим нули. */
  rows?: StandingsRow[]
}>()

const { teamMarkers, getMarkerByIndex } = useTeamColors()

// Берём переданные строки или строим заглушку с нулями.
const computedRows = computed<StandingsRow[]>(() => {
  if (props.rows && props.rows.length > 0) return props.rows
  return props.teams.map((name, index) => ({
    place: index + 1,
    teamName: name,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  }))
})

// Маркер команды — один резолвер с остальным приложением (карта → иначе номер строки).
function markerForTeam(teamName: string, rowIndex: number): string {
  const index = resolveTeamColorIndex(teamName, props.teamColors, rowIndex % teamMarkers.length)
  return getMarkerByIndex(index)
}

// Цвет ячейки разницы мячей по знаку числа.
function goalDiffClass(diff: number): string {
  // В светлой теме зелёный и красный чуть насыщеннее для лучшего контраста.
  if (diff > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (diff < 0) return 'text-red-500/90 dark:text-red-400/80'
  return 'text-slate-600 dark:text-slate-500'
}
</script>
