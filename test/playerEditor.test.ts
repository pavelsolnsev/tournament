import { describe, expect, it } from 'vitest'
import { playerEditorChanges, playerEditorValues } from '../server/utils/playerEditor'

describe('player database editor', () => {
  it('exposes editable columns available in this database and preserves legacy values', () => {
    const values = playerEditorValues({ id: 1, name: 'Игрок', photo: null, vk_user_id: -42, rating: '37.40', goals: 0, internal: 100 })
    expect(values).toEqual({ name: 'Игрок', photo: '', vk_user_id: '', rating: '37.40', goals: '0' })
    expect(() => playerEditorChanges(values, { changes: { rating_prev: '1' }, original: { rating_prev: '' } })).toThrow()
  })

  it('writes only the edited fields and rejects stale values for those fields', () => {
    const values = { name: 'Иван', username: '', goals: '12' }
    const changes = { username: '@ivan' }
    expect(playerEditorChanges(values, { changes, original: { username: '', goals: '9' } }))
      .toEqual([{ field: 'username', value: 'ivan' }])
    expect(() => playerEditorChanges(values, { changes: { goals: '10' }, original: { goals: '9' } }))
      .toThrow(expect.objectContaining({ statusCode: 409 }))
  })

  it.each([
    ['id', '9'], ['rating', '200.1'], ['goals', '-1'], ['wins', '0.5'],
    ['vk_user_id', '1e5'], ['photo', '../photo.jpg'], ['name', '  '],
  ])('rejects invalid edits to %s', (field, value) => {
    const current = playerEditorValues({ id: 1, name: 'Игрок', rating: 0, goals: 0, wins: 0, photo: null, vk_user_id: -1 })
    expect(() => playerEditorChanges(current, { changes: { [field]: value }, original: { [field]: field === 'name' ? 'Игрок' : current[field as keyof typeof current] ?? '' } }))
      .toThrow(expect.objectContaining({ statusCode: 400 }))
  })
})
