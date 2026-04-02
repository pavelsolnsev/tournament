// Тесты для обновления турнирной таблицы.
// Ошибки здесь напрямую влияют на видимые результаты турнира.
import { describe, it, expect } from 'vitest'
import { updateStandingsForTeam, resortStandings } from '~/composables/tournament-standings/standings'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'
import { ref } from 'vue'

// Создаём строку таблицы с нулевой статистикой.
function makeRow(teamName: string): StandingsRow {
  return {
    place: 1,
    teamName,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  }
}

describe('updateStandingsForTeam', () => {
  it('победа: +3 очка, +1 победа, +1 игра', () => {
    const rows = ref([makeRow('Красные'), makeRow('Синие')])
    updateStandingsForTeam(rows, 'Красные', 3, 1)
    const row = rows.value.find((r) => r.teamName === 'Красные')!
    expect(row.wins).toBe(1)
    expect(row.points).toBe(3)
    expect(row.played).toBe(1)
    expect(row.draws).toBe(0)
    expect(row.losses).toBe(0)
  })

  it('ничья: +1 очко, +1 ничья, +1 игра', () => {
    const rows = ref([makeRow('Красные'), makeRow('Синие')])
    updateStandingsForTeam(rows, 'Красные', 2, 2)
    const row = rows.value.find((r) => r.teamName === 'Красные')!
    expect(row.draws).toBe(1)
    expect(row.points).toBe(1)
    expect(row.played).toBe(1)
    expect(row.wins).toBe(0)
    expect(row.losses).toBe(0)
  })

  it('поражение: +0 очков, +1 поражение, +1 игра', () => {
    const rows = ref([makeRow('Красные'), makeRow('Синие')])
    updateStandingsForTeam(rows, 'Красные', 0, 4)
    const row = rows.value.find((r) => r.teamName === 'Красные')!
    expect(row.losses).toBe(1)
    expect(row.points).toBe(0)
    expect(row.played).toBe(1)
    expect(row.wins).toBe(0)
    expect(row.draws).toBe(0)
  })

  it('голы корректно записываются', () => {
    const rows = ref([makeRow('Красные'), makeRow('Синие')])
    updateStandingsForTeam(rows, 'Красные', 3, 1)
    const row = rows.value.find((r) => r.teamName === 'Красные')!
    expect(row.goalsFor).toBe(3)
    expect(row.goalsAgainst).toBe(1)
    expect(row.goalDiff).toBe(2)
  })

  it('не ломается если команда не найдена', () => {
    const rows = ref([makeRow('Красные')])
    // Команда «Синие» отсутствует — ничего не должно упасть.
    expect(() => updateStandingsForTeam(rows, 'Синие', 1, 0)).not.toThrow()
  })
})

describe('resortStandings', () => {
  it('сортирует по очкам по убыванию', () => {
    const rows = ref([
      { ...makeRow('Синие'), points: 3 },
      { ...makeRow('Красные'), points: 9 },
      { ...makeRow('Зелёные'), points: 6 },
    ])
    resortStandings(rows)
    expect(rows.value[0]!.teamName).toBe('Красные')
    expect(rows.value[1]!.teamName).toBe('Зелёные')
    expect(rows.value[2]!.teamName).toBe('Синие')
  })

  it('при равных очках — сортирует по разнице голов', () => {
    const rows = ref([
      { ...makeRow('Синие'), points: 3, goalDiff: 2 },
      { ...makeRow('Красные'), points: 3, goalDiff: 5 },
    ])
    resortStandings(rows)
    expect(rows.value[0]!.teamName).toBe('Красные')
  })

  it('при равных очках и разнице голов — сортирует по забитым', () => {
    const rows = ref([
      { ...makeRow('Синие'), points: 3, goalDiff: 2, goalsFor: 3 },
      { ...makeRow('Красные'), points: 3, goalDiff: 2, goalsFor: 5 },
    ])
    resortStandings(rows)
    expect(rows.value[0]!.teamName).toBe('Красные')
  })

  it('обновляет номера мест (place) после сортировки', () => {
    const rows = ref([
      { ...makeRow('Синие'), points: 1 },
      { ...makeRow('Красные'), points: 9 },
    ])
    resortStandings(rows)
    expect(rows.value[0]!.place).toBe(1)
    expect(rows.value[1]!.place).toBe(2)
  })
})
