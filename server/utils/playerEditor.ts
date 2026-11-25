import type { H3Event } from 'h3'
import { createError, getCookie, getRouterParam, setResponseHeader } from 'h3'
import { playerEditGroups, type PlayerEditField, type PlayerEditValues } from '../../app/utils/playerEditFields'
import { playerPhotoPublicUrl } from '../../app/utils/playerPhotoUrl'
import { removeEmoji } from './emojiStrip'
import { normalizePlayerUsername } from './normalizePlayerUsername'

export function playerEditorId(event: H3Event) {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  if (getCookie(event, 'admin_session') !== 'full') throw createError({ statusCode: 403 })
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id <= 0) throw createError({ statusCode: 400 })
  return id
}

export function playerEditorValues(row?: Record<string, unknown>) {
  if (!row) throw createError({ statusCode: 404, data: { message: 'Игрока уже нет в базе.' } })
  const values: PlayerEditValues = {}
  for (const group of playerEditGroups) {
    for (const { key } of group.fields) {
      if (!Object.hasOwn(row, key)) continue
      const value = row[key]
      values[key] = key === 'vk_user_id' && Number(value) <= 0 ? '' : String(value ?? '')
    }
  }
  return values
}

function invalid(field: PlayerEditField, message: string): never {
  throw createError({ statusCode: 400, data: { message: `«${field.label}». ${message}` } })
}

function normalizeField(field: PlayerEditField, raw: string): string | number | null {
  const text = raw.trim()
  if (field.kind === 'text') {
    const cleaned = removeEmoji(text)
    if (cleaned.length > 255) invalid(field, 'Допустимо до 255 символов.')
    if (field.key === 'username') return normalizePlayerUsername(cleaned)
    if (!cleaned) invalid(field, 'Введите имя.')
    return cleaned
  }
  if (field.kind === 'photo') {
    if (!text) return null
    if (text.length > 255 || !playerPhotoPublicUrl(text) || !/\.(webp|jpe?g|png|gif|avif)$/i.test(text)) {
      invalid(field, 'Укажите имя файла изображения без пути.')
    }
    return text
  }
  if (field.kind === 'vk' && !text) return null
  if (field.kind === 'rating') {
    if (!/^\d+(?:[.,]\d+)?$/.test(text)) invalid(field, 'Введите число от 0 до 200 с точностью до десятых.')
    const number = Number(text.replace(',', '.'))
    if (number > 200 || !Number.isInteger(number * 10)) invalid(field, 'Введите число от 0 до 200 с точностью до десятых.')
    return number
  }
  if (field.kind === 'trend') {
    if (!['-1', '0', '1'].includes(text)) invalid(field, 'Выберите направление стрелки.')
    return Number(text)
  }
  const number = Number(text)
  if (!/^\d+$/.test(text) || !Number.isSafeInteger(number) || (field.kind === 'vk' ? number < 1 : number > 2147483647)) {
    invalid(field, field.kind === 'vk' ? 'Введите положительный числовой ID или очистите поле.' : 'Введите целое неотрицательное число.')
  }
  return number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function playerEditorChanges(current: PlayerEditValues, body: unknown) {
  if (!isRecord(body) || !isRecord(body.changes) || !isRecord(body.original)) throw createError({ statusCode: 400 })
  const { changes, original } = body
  const keys = Object.keys(changes)
  if (!keys.length || keys.some(key => !Object.hasOwn(current, key))) throw createError({ statusCode: 400 })
  const edits: { field: PlayerEditField['key']; value: string | number | null }[] = []
  for (const group of playerEditGroups) {
    for (const field of group.fields) {
      const key = field.key
      if (!Object.hasOwn(changes, key)) continue
      const raw = changes[key]
      if (typeof raw !== 'string' || typeof original[key] !== 'string') throw createError({ statusCode: 400 })
      if (original[key] !== current[key]) {
        throw createError({ statusCode: 409, data: { message: `Поле «${field.label}» уже изменилось. Откройте карточку заново и проверьте значение.` } })
      }
      edits.push({ field: key, value: normalizeField(field, raw) })
    }
  }
  return edits
}
