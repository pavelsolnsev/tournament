// Подмешиваем актуальные фото из таблицы players — в архиве JSON мог быть сохранён до загрузки фото.
import type { Player } from '../../app/types/tournament'
import { queryWithRetry } from './db'

type PhotoRow = { id: number; photo: string | null }

/** Одним запросом: id → текущее имя файла фото в БД (или null). */
export async function fetchPlayerPhotosByIds(ids: readonly number[]): Promise<Map<number, string | null>> {
  const map = new Map<number, string | null>()
  const unique = [...new Set(ids.map((n) => Number(n)).filter((n) => Number.isFinite(n)))]
  if (unique.length === 0) return map

  const placeholders = unique.map(() => '?').join(',')
  const rows = await queryWithRetry<PhotoRow[]>(
    `SELECT id, photo FROM players WHERE id IN (${placeholders})`,
    unique,
  )
  for (const r of Array.isArray(rows) ? rows : []) {
    const id = Number(r.id)
    const raw = r.photo != null ? String(r.photo).trim() : ''
    map.set(id, raw || null)
  }
  return map
}

/** Если игрок есть в map — берём фото из БД; иначе оставляем как в архиве (удалённый из БД и т.п.). */
export function applyPlayerPhotosMap(
  players: Player[] | null | undefined,
  photoById: Map<number, string | null>,
): Player[] {
  if (!players?.length) return []
  return players.map((p) => ({
    ...p,
    photo: photoById.has(p.id) ? (photoById.get(p.id) ?? null) : (p.photo ?? null),
  }))
}

/** Удобно для одного турнира: один SELECT по id из списка игроков архива. */
export async function mergePlayerPhotosFromDb(players: Player[] | null | undefined): Promise<Player[]> {
  if (!players?.length) return players ?? []
  const map = await fetchPlayerPhotosByIds(players.map((p) => p.id))
  return applyPlayerPhotosMap(players, map)
}
