import { queryWithRetry } from '../../utils/db'
import { ensureTablesExist } from '../../utils/initDb'
import { normalizePlayerUsername } from '../../utils/normalizePlayerUsername'
import { requireVkBotToken } from '../../utils/vkBotAuth'
import { getRequestIdempotencyKey, runIdempotent } from '../../utils/idempotency'

// API: POST /api/vk/join — вызывается VK-ботом когда пользователь жмёт «Играть» или «+».
// Создаёт игрока при необходимости и добавляет в selectedIds. Не удаляет строки из players.

// Тип тела запроса от бота.
interface VkJoinBody {
  vk_user_id: number
  first_name: string
  last_name: string
  /** Подпись команды с кнопки в чате (турнир с teamSlots). */
  team?: string
}

// Тип строки состояния турнира из базы.
interface TournamentState {
  selectedIds?: number[]
  /** Подпись команды из ВК (id игрока → название), строковые ключи для JSON. */
  vkTeamLabelByPlayerId?: Record<string, string>
  /** upcoming | live | finished — при live запись через бота в список турнира запрещена. */
  matchStatus?: string
  [key: string]: unknown
}

const TOURNAMENT_KEY = 'tournament'
const VK_TEAM_MAX = 64

function normalizeVkTeamLabel(raw: string | undefined): string | null {
  const t = String(raw ?? '').trim()
  if (!t) return null
  return t.slice(0, VK_TEAM_MAX)
}

function setVkLabelOnState(
  state: TournamentState,
  playerId: number,
  team: string | null,
) {
  const prevMap = (state.vkTeamLabelByPlayerId && typeof state.vkTeamLabelByPlayerId === 'object'
    ? state.vkTeamLabelByPlayerId
    : {}) as Record<string, string>
  const k = String(playerId)
  // Без delete по динамическому ключу — ESLint no-dynamic-delete; собираем новый объект.
  const entries = Object.entries(prevMap).filter(([key]) => key !== k)
  if (team) {
    entries.push([k, team])
  }
  if (entries.length === 0) {
    state.vkTeamLabelByPlayerId = undefined
  } else {
    state.vkTeamLabelByPlayerId = Object.fromEntries(entries)
  }
}

type AppStateRow = { value: string }
type DbWriteResult = { affectedRows?: number }

function isDuplicatePrimaryError(err: unknown): boolean {
  const e = err as { code?: string; errno?: number; sqlMessage?: string }
  if (e?.code !== 'ER_DUP_ENTRY' && e?.errno !== 1062) return false
  return String(e?.sqlMessage ?? '').toLowerCase().includes('primary')
}

function isDuplicateVkError(err: unknown): boolean {
  const e = err as { code?: string; errno?: number; sqlMessage?: string }
  if (e?.code !== 'ER_DUP_ENTRY' && e?.errno !== 1062) return false
  return String(e?.sqlMessage ?? '').toLowerCase().includes('vk_user')
}

function nextPlayerIdCandidate() {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000)
}

async function persistTournamentStateCas(prevValue: string | null, nextValue: string): Promise<boolean> {
  if (prevValue != null) {
    const res = await queryWithRetry<DbWriteResult>(
      'UPDATE app_state SET value = ? WHERE key_name = ? AND value = ?',
      [nextValue, TOURNAMENT_KEY, prevValue],
    )
    return Number(res?.affectedRows ?? 0) === 1
  }

  const res = await queryWithRetry<DbWriteResult>(
    'INSERT IGNORE INTO app_state (key_name, value) VALUES (?, ?)',
    [TOURNAMENT_KEY, nextValue],
  )
  return Number(res?.affectedRows ?? 0) === 1
}

export default defineEventHandler(async (event) => {
  await ensureTablesExist()
  requireVkBotToken(event)
  const idemKey = getRequestIdempotencyKey(event)

  return await runIdempotent(idemKey, async () => {
    // Читаем тело запроса от бота.
    const body = await readBody<VkJoinBody>(event)

    // vk_user_id обязателен — по нему ищем игрока при выходе. Допускаются отрицательные «синтетические» id (игрок без ВК, +add / сайт).
    const vkUserId = Number(body?.vk_user_id)
    if (vkUserId == null || !Number.isFinite(vkUserId) || vkUserId === 0) {
      throw createError({ statusCode: 400, statusMessage: 'vk_user_id is required' })
    }

    // Собираем имя игрока из first_name + last_name, убираем лишние пробелы.
    const name = `${(body?.first_name ?? '').trim()} ${(body?.last_name ?? '').trim()}`.trim()

    if (!name) {
      throw createError({ statusCode: 400, statusMessage: 'Name is required' })
    }

    const teamLabel = normalizeVkTeamLabel(body?.team)

    // Пока идёт live-матч — не добавляем в список турнира и не создаём игрока «в никуда».
    const stateRowsEarly = await queryWithRetry<AppStateRow[]>(
      'SELECT value FROM app_state WHERE key_name = ?',
      [TOURNAMENT_KEY],
    )
    if (stateRowsEarly.length > 0 && stateRowsEarly[0]?.value) {
      try {
        const early = JSON.parse(stateRowsEarly[0].value) as TournamentState
        if (early.matchStatus === 'live') {
          throw createError({
            statusCode: 409,
            statusMessage: 'Tournament live: registration closed',
            data: { code: 'TOURNAMENT_LIVE' },
          })
        }
      } catch (err) {
        if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 409) {
          throw err
        }
        // Битый JSON — не блокируем join.
      }
    }

    // Проверяем — есть ли уже игрок с таким vk_user_id в базе.
    // Если есть — не создаём дубль, просто берём его id.
    const existing = await queryWithRetry<Array<{ id: number }>>(
      'SELECT id FROM players WHERE vk_user_id = ?',
      [vkUserId],
    )

    let playerId: number | null = null

    if (existing.length > 0 && existing[0]) {
      // Игрок уже есть — используем его существующий id.
      playerId = existing[0].id
    } else {
      // Новый игрок — создаём запись в таблице.
      // username не передаётся — ставим @unknown как плейсхолдер (можно вручную поменять позже).
      // Передаём строку 'unknown' — normalizePlayerUsername превратит её в '@unknown'.
      const username = normalizePlayerUsername('unknown')
      let created = false

      for (let attempt = 0; attempt < 8; attempt++) {
          playerId = nextPlayerIdCandidate()
        try {
          await queryWithRetry(
            `INSERT INTO players (id, name, username, vk_user_id, goals, assists, saves, gamesPlayed, wins, draws, losses, rating, mvp, yellow_cards)
             VALUES (?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`,
            [playerId, name, username, vkUserId],
          )
          created = true
          break
        } catch (err) {
          if (isDuplicatePrimaryError(err)) {
            continue
          }
          if (isDuplicateVkError(err)) {
            const raced = await queryWithRetry<Array<{ id: number }>>(
              'SELECT id FROM players WHERE vk_user_id = ?',
              [vkUserId],
            )
            if (raced.length > 0 && raced[0]) {
                playerId = raced[0].id
              created = true
              break
            }
          }
          const mysqlErr = err as { code?: string; sqlMessage?: string; message?: string }
          console.error('[vk/join] Failed to create player:', mysqlErr?.code, mysqlErr?.sqlMessage ?? mysqlErr?.message)
          throw createError({
            statusCode: 500,
            statusMessage: `Failed to create player: ${mysqlErr?.sqlMessage ?? mysqlErr?.message ?? 'unknown'}`,
          })
        }
      }
      if (!created) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to allocate player id' })
      }
    }

    if (playerId == null) {
      throw createError({ statusCode: 500, statusMessage: 'Player id resolve failed' })
    }

    // CAS-обновление состояния, чтобы параллельные join не теряли игроков.
    let persisted = false
    for (let attempt = 0; attempt < 8; attempt++) {
      const rows = await queryWithRetry<AppStateRow[]>(
        'SELECT value FROM app_state WHERE key_name = ?',
        [TOURNAMENT_KEY],
      )
      const prev = rows.length > 0 && rows[0]?.value ? rows[0].value : null

      let state: TournamentState = { selectedIds: [] }
      if (prev) {
        try {
          state = JSON.parse(prev) as TournamentState
        } catch {
          state = { selectedIds: [] }
        }
      }

      const selected = Array.isArray(state.selectedIds) ? state.selectedIds : []
      if (selected.includes(playerId)) {
        if (teamLabel) {
          setVkLabelOnState(state, playerId, teamLabel)
          const next = JSON.stringify(state)
          const ok = await persistTournamentStateCas(prev, next)
          if (ok) {
            persisted = true
            break
          }
          continue
        }
        persisted = true
        break
      }
      state.selectedIds = [...selected, playerId]
      if (teamLabel) {
        setVkLabelOnState(state, playerId, teamLabel)
      }
      const next = JSON.stringify(state)

      const ok = await persistTournamentStateCas(prev, next)
      if (ok) {
        persisted = true
        break
      }
    }
    if (!persisted) {
      throw createError({ statusCode: 409, statusMessage: 'Concurrent update conflict on tournament state' })
    }

    // Возвращаем данные игрока боту — бот может использовать их для ответа пользователю в ВК.
    return { ok: true, player: { id: playerId, name } }
  })
})
