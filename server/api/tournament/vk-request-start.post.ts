import { createError } from 'h3'
import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'
import { setVkStartListRequested } from '../../utils/vkStartListRequest'

const LINK_KEY = 'tournament_vk_link'

type VkLinkJson = {
  peerId?: number
  gameEventId?: string
}

type Body = {
  preset?: string
  team_slots?: unknown
  peer_id?: unknown
  /** YYYY-MM-DD для custom */
  date?: unknown
  time?: unknown
  place?: unknown
}

function normalizeTeamSlotsForTr(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of raw) {
    const cleaned = String(item ?? '').replace(/\s+/g, ' ').trim().slice(0, 40)
    if (!cleaned) continue
    const key = cleaned.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(cleaned)
    if (out.length >= 9) break
  }
  return out
}

function isoDateToDdMmYyyy(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const yyyy = Number(m[1])
  const mm = Number(m[2])
  const dd = Number(m[3])
  if (!Number.isInteger(dd) || !Number.isInteger(mm) || !Number.isInteger(yyyy)) return null
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null
  return `${String(dd).padStart(2, '0')}.${String(mm).padStart(2, '0')}.${yyyy}`
}

function normalizeHhMm(raw: string): string | null {
  const t = raw.trim()
  const m = /^(\d{1,2}):(\d{2})$/.exec(t)
  if (!m) return null
  const hh = Number(m[1])
  const min = Number(m[2])
  if (!Number.isInteger(hh) || !Number.isInteger(min)) return null
  if (hh < 0 || hh > 23 || min < 0 || min > 59) return null
  return `${String(hh).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

async function readLinkedPeerId(): Promise<number | null> {
  const linkRows = await queryWithRetry<Array<{ value: string }>>(
    'SELECT value FROM app_state WHERE key_name = ?',
    [LINK_KEY],
  )
  if (linkRows.length === 0 || !linkRows[0]?.value) return null
  try {
    const link = JSON.parse(linkRows[0].value) as VkLinkJson
    const peerId = Number(link.peerId)
    const gameEventId = typeof link.gameEventId === 'string' ? link.gameEventId.trim() : ''
    if (!peerId || !Number.isFinite(peerId) || !gameEventId) return null
    return Math.trunc(peerId)
  } catch {
    return null
  }
}

/** Явная дата/время + prof/tr — парсит бот через parseDatedProfTrCommand. */
function tryBuildDatedProfTr(preset: 'prof' | 'tr', body: Body): string | null {
  const dateIso = typeof body.date === 'string' ? body.date.trim() : ''
  const timeRaw = typeof body.time === 'string' ? body.time.trim() : ''
  if (!dateIso || !timeRaw) return null
  const ddmmyyyy = isoDateToDdMmYyyy(dateIso)
  const time = normalizeHhMm(timeRaw)
  if (!ddmmyyyy || !time) return null
  if (preset === 'prof') {
    return `s ${ddmmyyyy} ${time} prof`
  }
  const slots = normalizeTeamSlotsForTr(body.team_slots)
  if (slots.length > 0) {
    return `s ${ddmmyyyy} ${time} tr ${slots.join(', ')}`
  }
  return `s ${ddmmyyyy} ${time} tr`
}

function buildCommand(body: Body): string {
  const preset = String(body.preset ?? '').trim().toLowerCase()
  if (preset === 'prof') {
    const dated = tryBuildDatedProfTr('prof', body)
    if (dated) return dated
    return 's prof'
  }
  if (preset === 'test') return 's test'
  if (preset === 'tr') {
    const dated = tryBuildDatedProfTr('tr', body)
    if (dated) return dated
    const slots = normalizeTeamSlotsForTr(body.team_slots)
    if (slots.length === 0) return 's tr'
    return `s tr ${slots.join(', ')}`
  }
  if (preset === 'custom') {
    const dateIso = typeof body.date === 'string' ? body.date : ''
    const ddmmyyyy = isoDateToDdMmYyyy(dateIso)
    if (!ddmmyyyy) {
      throw createError({ statusCode: 400, statusMessage: 'Нужна дата в формате ГГГГ-ММ-ДД' })
    }
    const timeRaw = typeof body.time === 'string' ? body.time : '20:00'
    const time = normalizeHhMm(timeRaw)
    if (!time) {
      throw createError({ statusCode: 400, statusMessage: 'Нужно время ЧЧ:ММ' })
    }
    const place = typeof body.place === 'string' ? body.place.replace(/\s+/g, ' ').trim() : ''
    if (!place) {
      throw createError({ statusCode: 400, statusMessage: 'Укажите место проведения' })
    }
    return `s ${ddmmyyyy} ${time} ${place}`
  }
  throw createError({
    statusCode: 400,
    statusMessage: 'Неизвестный preset: prof, tr, test или custom',
  })
}

// Админ: поставить в очередь команду для бота — тот создаст список в чате ВК (как s tr / s prof).
export default defineEventHandler(async (event) => {
  await ensureTablesExist()

  const session = getCookie(event, 'admin_session')
  if (session !== 'full') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: full admin only' })
  }

  const body = await readBody<Body>(event)
  const commandText = buildCommand(body)

  let peerId: number | null = null
  const rawPeer = body.peer_id
  if (typeof rawPeer === 'number' && Number.isFinite(rawPeer) && rawPeer !== 0) {
    peerId = Math.trunc(rawPeer)
  } else if (typeof rawPeer === 'string' && rawPeer.trim()) {
    const n = Number(rawPeer.trim())
    if (Number.isFinite(n) && n !== 0) peerId = Math.trunc(n)
  }

  if (peerId == null || peerId === 0) {
    peerId = await readLinkedPeerId()
  }

  if (peerId == null || peerId === 0) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Нет peer_id беседы: привяжите чат через бота или укажите peer_id вручную (id чата ВК).',
    })
  }

  await setVkStartListRequested({ commandText, peerId })

  return { ok: true, commandText, peerId }
})
