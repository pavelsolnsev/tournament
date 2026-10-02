import { describe, it, expect } from 'vitest'
import { diffVkTeamLabelsForSave } from '../app/composables/tournament-wizard/useVkTeamSlots'

describe('diffVkTeamLabelsForSave', () => {
  it('не шлёт команды, которые вкладка не меняла (их возьмут из БД)', () => {
    const base = { 1: 'Ручеёк', 2: 'Ясность' }
    expect(diffVkTeamLabelsForSave([1, 2], { ...base }, base)).toEqual({})
  })

  it('отставшая вкладка без команд у игроков ничего не затирает', () => {
    // Вкладка знала игроков без команд; новые игроки из ВК в локальной карте отсутствуют.
    const base = { 1: '' }
    expect(diffVkTeamLabelsForSave([1, 2, 3], { 1: '' }, base)).toEqual({})
  })

  it('шлёт команду, которую админ поменял', () => {
    expect(diffVkTeamLabelsForSave([1], { 1: 'Ясность' }, { 1: 'Ручеёк' })).toEqual({ 1: 'Ясность' })
  })

  it('шлёт пустую строку, если админ снял команду', () => {
    expect(diffVkTeamLabelsForSave([1], { 1: '' }, { 1: 'Ручеёк' })).toEqual({ 1: '' })
  })

  it('пробелы не считаются изменением', () => {
    expect(diffVkTeamLabelsForSave([1], { 1: ' Ручеёк ' }, { 1: 'Ручеёк' })).toEqual({})
  })
})
