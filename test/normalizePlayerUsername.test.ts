// Тесты для нормализации username игрока.
// Эта функция запускается и на сервере, и на клиенте — согласованность критична.
import { describe, it, expect } from 'vitest'
import { normalizePlayerUsername } from '../server/utils/normalizePlayerUsername'

describe('normalizePlayerUsername', () => {
  it('возвращает null для пустой строки', () => {
    expect(normalizePlayerUsername('')).toBeNull()
  })

  it('возвращает null для null', () => {
    expect(normalizePlayerUsername(null)).toBeNull()
  })

  it('возвращает null для undefined', () => {
    expect(normalizePlayerUsername(undefined)).toBeNull()
  })

  it('возвращает null для строки только из пробелов', () => {
    expect(normalizePlayerUsername('   ')).toBeNull()
  })

  it('срезает ведущий @', () => {
    expect(normalizePlayerUsername('@ivan')).toBe('ivan')
  })

  it('срезает несколько ведущих @', () => {
    expect(normalizePlayerUsername('@@ivan')).toBe('ivan')
  })

  it('обычный ник без @ — возвращает как есть', () => {
    expect(normalizePlayerUsername('ivan')).toBe('ivan')
  })

  it('unknown → @unknown (специальный плейсхолдер)', () => {
    expect(normalizePlayerUsername('unknown')).toBe('@unknown')
  })

  it('@unknown → @unknown (уже нормализованный плейсхолдер)', () => {
    expect(normalizePlayerUsername('@unknown')).toBe('@unknown')
  })

  it('UNKNOWN (верхний регистр) → @unknown', () => {
    expect(normalizePlayerUsername('UNKNOWN')).toBe('@unknown')
  })

  it('обрезает пробелы вокруг ника', () => {
    expect(normalizePlayerUsername('  ivan  ')).toBe('ivan')
  })
})
