import { beforeEach, describe, expect, it, vi } from 'vitest'
import { persistTournamentStatePutBody } from '../server/utils/persistTournamentStatePutBody'

// Мокаем только доступ к БД (vi.mock / vi.hoisted поднимаются выше импортов) — логика настоящая.
const { queryMock } = vi.hoisted(() => ({ queryMock: vi.fn() }))
vi.mock('../server/utils/db', () => ({ queryWithRetry: queryMock }))

/** Состояние в БД сразу после создания турнирного списка в ВК: команды есть, игроков ещё нет. */
function prevStateFreshVkTrList() {
  return {
    step: 0,
    tournamentName: '',
    tournamentDate: '',
    venueLabel: '',
    formatLabel: '',
    selectedIds: [],
    paidPlayerIds: [],
    vkTeamLabelByPlayerId: {},
    vkTeamSlots: ['Красные', 'Синие'],
    vkTeamLimits: {},
    vkListTournament: true,
    standingsSnapshot: null,
    matchStatus: 'upcoming',
  }
}

/** Тело PUT из мастера на шаге «Игроки», когда в список ВК ещё никто не записался. */
function putBodyFromWizard(extra: Record<string, unknown> = {}) {
  return {
    step: 0,
    tournamentName: '',
    tournamentDate: '',
    venueLabel: '',
    formatLabel: '',
    selectedIds: [],
    vkTeamLabelByPlayerId: {},
    vkTeamSlots: ['Красные', 'Синие'],
    vkTeamLimits: {},
    assignmentByPlayerId: {},
    confirmedTeamNames: [],
    teamColors: {},
    standingsSnapshot: null,
    matchStatus: 'upcoming',
    liveHomeTeam: '',
    liveAwayTeam: '',
    ...extra,
  } as Record<string, unknown>
}

let savedJson: Record<string, unknown> | null = null

/** Подменяем БД: SELECT отдаёт prev, INSERT запоминает то, что реально запишется. */
function mockDb(prev: Record<string, unknown> | null) {
  savedJson = null
  queryMock.mockReset()
  queryMock.mockImplementation(async (sql: string, params: unknown[]) => {
    if (String(sql).trim().toUpperCase().startsWith('SELECT')) {
      return prev ? [{ value: JSON.stringify(prev) }] : []
    }
    savedJson = JSON.parse(String(params[1])) as Record<string, unknown>
    return { affectedRows: 1 }
  })
}

describe('persistTournamentStatePutBody — настройки списка ВК', () => {
  beforeEach(() => {
    mockDb(prevStateFreshVkTrList())
  })

  it('смена лимита команды при пустом составе не сбрасывает турнирный список ВК', async () => {
    await persistTournamentStatePutBody(putBodyFromWizard({ vkTeamLimits: { красные: 6 } }))

    expect(savedJson?.vkListTournament).toBe(true)
    expect(savedJson?.vkTeamSlots).toEqual(['Красные', 'Синие'])
    expect(savedJson?.vkTeamLimits).toEqual({ красные: 6 })
  })

  it('устаревшая вкладка без слотов не стирает команды из БД', async () => {
    await persistTournamentStatePutBody(putBodyFromWizard({ vkTeamSlots: [] }))

    expect(savedJson?.vkListTournament).toBe(true)
    expect(savedJson?.vkTeamSlots).toEqual(['Красные', 'Синие'])
  })

  it('явное удаление последней команды на сайте сохраняет пустой список слотов', async () => {
    await persistTournamentStatePutBody(
      // rosterRev выше сохранённой — вкладка сама правила состав списка, значит её слоты авторитетны.
      putBodyFromWizard({ vkTeamSlots: [], rosterRev: 1, __vkTeamSlotsAuthoritative: true }),
    )

    expect(savedJson?.vkTeamSlots).toEqual([])
    expect(savedJson?.vkListTournament).toBe(true)
    expect(savedJson?.__vkTeamSlotsAuthoritative).toBeUndefined()
  })

  it('полный сброс (__fullReset) чистит режим, слоты и лимиты', async () => {
    await persistTournamentStatePutBody(
      putBodyFromWizard({ vkTeamSlots: [], vkTeamLimits: {}, __fullReset: true }),
    )

    expect(savedJson?.vkListTournament).toBe(false)
    expect(savedJson?.vkTeamSlots).toEqual([])
    expect(savedJson?.vkTeamLimits).toEqual({})
    expect(savedJson?.__fullReset).toBeUndefined()
  })
})

describe('persistTournamentStatePutBody — состав турнира', () => {
  /** В БД: идёт турнир, админ только что добавил игрока 3 (версия ростера 4). */
  const prevWithThreePlayers = {
    step: 2,
    tournamentName: 'Пятничный',
    tournamentDate: '2026-09-11',
    venueLabel: '',
    formatLabel: '',
    rosterRev: 4,
    selectedIds: [1, 2, 3],
    paidPlayerIds: [3],
    assignmentByPlayerId: { 1: 'Красные', 2: 'Синие', 3: 'Красные' },
    vkTeamLabelByPlayerId: { 3: 'Красные' },
    vkTeamSlots: ['Красные', 'Синие'],
    vkListTournament: true,
    standingsSnapshot: null,
    matchStatus: 'live',
  } as Record<string, unknown>

  /** Тело PUT судьи: он отмечает статистику, состав у него ещё старый. */
  function judgeStatePut(overrides: Record<string, unknown> = {}) {
    return {
      step: 2,
      tournamentName: 'Пятничный',
      tournamentDate: '2026-09-11',
      venueLabel: '',
      formatLabel: '',
      rosterRev: 3,
      selectedIds: [1, 2],
      assignmentByPlayerId: { 1: 'Красные', 2: 'Синие' },
      vkTeamLabelByPlayerId: {},
      vkTeamSlots: ['Красные', 'Синие'],
      confirmedTeamNames: ['Красные', 'Синие'],
      teamColors: {},
      standingsSnapshot: null,
      matchStatus: 'live',
      liveHomeTeam: 'Красные',
      liveAwayTeam: 'Синие',
      ...overrides,
    } as Record<string, unknown>
  }

  it('отметка судьи не выкидывает игрока, которого админ добавил во время турнира', async () => {
    mockDb(prevWithThreePlayers)

    await persistTournamentStatePutBody(judgeStatePut())

    expect(savedJson?.selectedIds).toEqual([1, 2, 3])
    expect(savedJson?.paidPlayerIds).toEqual([3])
    expect(savedJson?.vkTeamLabelByPlayerId).toEqual({ '3': 'Красные' })
  })

  it('админ заявил новую версию ростера — его состав сохраняется', async () => {
    mockDb(prevWithThreePlayers)

    await persistTournamentStatePutBody(judgeStatePut({ rosterRev: 5, selectedIds: [1, 3] }))

    expect(savedJson?.selectedIds).toEqual([1, 3])
    expect(savedJson?.rosterRev).toBe(5)
  })
})
