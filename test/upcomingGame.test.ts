import { describe, it, expect } from 'vitest'
import type { Player } from '../app/types/tournament'
import type { SavedTournamentContext } from '../app/composables/tournament-wizard/savedContextTypes'
import { buildUpcomingGame, formatUpcomingDate } from '../app/utils/upcomingGame'

const players = [1, 2, 3, 4, 5].map((id) => ({ id, name: `Игрок ${id}`, username: null, photo: null, rating: 50 })) as Player[]
const ctx = (over: Partial<SavedTournamentContext>) => ({ selectedIds: [], tournamentDate: '', venueLabel: '', formatLabel: '', ...over }) as SavedTournamentContext

describe('buildUpcomingGame', () => {
  it('турнир не объявлен — null (у гостя прежняя заглушка)', () => {
    expect(buildUpcomingGame(null, players)).toBeNull()
    expect(buildUpcomingGame(ctx({}), players)).toBeNull()
  })

  it('турнир с командами: состав по командам, лимит и очередь', () => {
    const g = buildUpcomingGame(ctx({
      selectedIds: [1, 2, 3, 4],
      tournamentDate: '2026-10-23',
      tournamentTime: '20:00',
      venueLabel: 'Красное Знамя',
      formatLabel: 'Турнир 8x8',
      tournamentSum: 650,
      vkListTournament: true,
      vkTeamSlots: ['РФОИ', 'АСБИ'],
      vkTeamLimits: { рфои: 2 },
      vkTeamLabelByPlayerId: { 1: 'РФОИ', 2: 'РФОИ', 3: 'РФОИ', 4: 'асби' },
    }), players)!

    expect(g.time).toBe('20:00')
    expect(g.sum).toBe(650)
    expect(g.address).toContain('Воровского')
    expect(g.groups.map((x) => [x.name, x.players.map((p) => p.id), x.limit, x.queue.map((p) => p.id)])).toEqual([
      ['РФОИ', [1, 2], 2, [3]],
      ['АСБИ', [4], 8, []],
    ])
    expect(g.mainCount).toBe(3)
  })

  it('обычный сбор: общий список с общим лимитом', () => {
    const g = buildUpcomingGame(ctx({ selectedIds: [1, 2, 3], venueLabel: 'Профилакторий', vkListLimit: 2 }), players)!
    expect(g.groups).toHaveLength(1)
    expect(g.groups[0]!.players.map((p) => p.id)).toEqual([1, 2])
    expect(g.groups[0]!.queue.map((p) => p.id)).toEqual([3])
    expect(g.mapUrl).toContain('yandex')
  })
})

describe('formatUpcomingDate', () => {
  it('дата словами по-русски', () => {
    expect(formatUpcomingDate('2026-10-23')).toBe('пятница, 23 октября')
    expect(formatUpcomingDate('мусор')).toBe('')
  })
})
