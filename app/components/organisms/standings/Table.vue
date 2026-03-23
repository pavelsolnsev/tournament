<!-- Компонент StandingsTable: турнирная таблица мест и очков команд. -->
<template>
  <!-- Без overflow-x-auto — таблица должна помещаться в любой ширине экрана -->
  <div class="w-full rounded-xl border border-slate-700/60 overflow-hidden">
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
        <tr class="border-b border-slate-700/60 bg-slate-800/80">
          <th class="whitespace-nowrap px-1 py-2 text-[11px] font-semibold text-slate-500 sm:px-1.5 md:text-sm">М</th>
          <th class="px-1 py-2 text-left text-[11px] font-semibold text-slate-500 sm:px-1.5 md:text-sm">Команда</th>
          <th class="whitespace-nowrap px-1 py-2 text-center text-[11px] font-semibold text-slate-500 md:text-sm">И</th>
          <th class="whitespace-nowrap px-1 py-2 text-center text-[11px] font-semibold text-slate-500 md:text-sm">В</th>
          <th class="whitespace-nowrap px-1 py-2 text-center text-[11px] font-semibold text-slate-500 md:text-sm">Н</th>
          <th class="whitespace-nowrap px-1 py-2 text-center text-[11px] font-semibold text-slate-500 md:text-sm">П</th>
          <th class="whitespace-nowrap px-1 py-2 text-center text-[11px] font-semibold text-slate-500 md:text-sm">ЗМ</th>
          <th class="whitespace-nowrap px-1 py-2 text-center text-[11px] font-semibold text-slate-500 md:text-sm">ПМ</th>
          <th class="whitespace-nowrap px-1 py-2 text-center text-[11px] font-semibold text-slate-500 md:text-sm">РМ</th>
          <!-- Очки выделены цветом -->
          <th class="whitespace-nowrap px-1 py-2 text-center text-[11px] font-bold text-slate-300 md:text-sm">О</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="(row, i) in computedRows"
          :key="row.teamName"
          class="border-b border-slate-800/50 transition-colors last:border-0 md:hover:bg-slate-800/30"
        >
          <!-- Место -->
          <td class="whitespace-nowrap px-1 py-2.5 text-xs font-medium tabular-nums text-slate-400 sm:px-1.5 md:text-sm">
            {{ row.place }}
          </td>

          <!-- Команда: маркер + имя — truncate не даёт ломать соседние ячейки -->
          <td class="min-w-0 px-1 py-2.5 sm:px-1.5">
            <div class="flex min-w-0 items-center gap-1 md:gap-1.5">
              <span class="shrink-0 text-sm leading-none md:text-base" aria-hidden="true">
                {{ markerForTeam(row.teamName, i) }}
              </span>
              <span class="min-w-0 truncate text-xs font-semibold text-slate-100 sm:text-sm md:text-base">
                {{ row.teamName }}
              </span>
            </div>
          </td>

          <!-- И -->
          <td class="whitespace-nowrap px-1 py-2.5 text-center text-xs tabular-nums text-slate-400 md:text-sm">
            {{ row.played }}
          </td>

          <!-- В — зелёный если есть победы -->
          <td
            class="whitespace-nowrap px-1 py-2.5 text-center text-xs font-medium tabular-nums md:text-sm"
            :class="row.wins > 0 ? 'text-emerald-400' : 'text-slate-500'"
          >
            {{ row.wins }}
          </td>

          <!-- Н -->
          <td class="whitespace-nowrap px-1 py-2.5 text-center text-xs tabular-nums text-slate-500 md:text-sm">
            {{ row.draws }}
          </td>

          <!-- П — красный если есть поражения -->
          <td
            class="whitespace-nowrap px-1 py-2.5 text-center text-xs tabular-nums md:text-sm"
            :class="row.losses > 0 ? 'text-red-400/80' : 'text-slate-500'"
          >
            {{ row.losses }}
          </td>

          <!-- ЗМ -->
          <td class="whitespace-nowrap px-1 py-2.5 text-center text-xs tabular-nums text-slate-400 md:text-sm">
            {{ row.goalsFor }}
          </td>

          <!-- ПМ -->
          <td class="whitespace-nowrap px-1 py-2.5 text-center text-xs tabular-nums text-slate-400 md:text-sm">
            {{ row.goalsAgainst }}
          </td>

          <!-- РМ — цвет по знаку -->
          <td
            class="whitespace-nowrap px-1 py-2.5 text-center text-xs font-medium tabular-nums md:text-sm"
            :class="goalDiffClass(row.goalDiff)"
          >
            {{ row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff }}
          </td>

          <!-- Очки — жирные, самые заметные -->
          <td class="whitespace-nowrap px-1 py-2.5 text-center text-sm font-bold tabular-nums text-slate-100 md:text-base">
            {{ row.points }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { useTeamColors } from '~/composables/useTeamColors'

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

// Маркер команды по цветовому индексу.
function markerForTeam(teamName: string, rowIndex: number): string {
  const raw = props.teamColors?.[teamName]
  const index = typeof raw === 'number' ? raw : (rowIndex % teamMarkers.length)
  return getMarkerByIndex(index)
}

// Цвет ячейки разницы мячей по знаку числа.
function goalDiffClass(diff: number): string {
  if (diff > 0) return 'text-emerald-400'
  if (diff < 0) return 'text-red-400/80'
  return 'text-slate-500'
}
</script>
