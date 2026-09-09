import { describe, it, expect } from 'vitest'
import {
  isAutoTeamName,
  teamDisplayName,
  teamDisplayNameByMarker,
} from '../app/utils/teamDisplayName'

describe('isAutoTeamName', () => {
  it('узнаёт авто-имена из распределения по рейтингу', () => {
    expect(isAutoTeamName('Команда 1')).toBe(true)
    expect(isAutoTeamName('команда 12')).toBe(true)
    expect(isAutoTeamName('Команда2')).toBe(true)
  })

  it('настоящие команды не трогает', () => {
    expect(isAutoTeamName('РФОИ')).toBe(false)
    expect(isAutoTeamName('Команда мечты')).toBe(false)
    expect(isAutoTeamName('')).toBe(false)
  })
})

describe('teamDisplayName', () => {
  it('заменяет номер на цвет по индексу', () => {
    expect(teamDisplayName('Команда 1', 0)).toBe('Красные')
    expect(teamDisplayName('Команда 2', 1)).toBe('Синие')
    expect(teamDisplayName('Команда 3', 2)).toBe('Зелёные')
    expect(teamDisplayName('Команда 4', 3)).toBe('Жёлтые')
  })

  it('цвет берётся из индекса, а не из номера — админ мог перекрасить команду', () => {
    expect(teamDisplayName('Команда 2', 2)).toBe('Зелёные')
  })

  it('имя настоящей команды остаётся как есть', () => {
    expect(teamDisplayName('Ручеёк', 1)).toBe('Ручеёк')
  })

  it('без валидного индекса оставляем исходное имя', () => {
    expect(teamDisplayName('Команда 2', null)).toBe('Команда 2')
    expect(teamDisplayName('Команда 2', 99)).toBe('Команда 2')
  })
})

describe('teamDisplayNameByMarker', () => {
  it('берёт цвет из эмодзи-маркера, который уже показан рядом', () => {
    expect(teamDisplayNameByMarker('Команда 2', '🔵')).toBe('Синие')
    expect(teamDisplayNameByMarker('Команда 1', '⚫')).toBe('Чёрные')
  })

  it('настоящую команду с логотипом не переименовывает', () => {
    expect(teamDisplayNameByMarker('Ясность', '🔴')).toBe('Ясность')
  })

  it('незнакомый маркер — оставляем имя', () => {
    expect(teamDisplayNameByMarker('Команда 2', '')).toBe('Команда 2')
  })
})
