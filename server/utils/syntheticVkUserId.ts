import { queryWithRetry } from './db'

/**
 * Следующий «виртуальный» vk id: отрицательные числа не пересекаются с реальными id ВК.
 * Берём MIN(отрицательных) − 1; если таких ещё нет — начинаем с −1.
 */
export async function nextSyntheticVkUserIdCandidate(): Promise<number> {
  const rows = await queryWithRetry<Array<{ m: number | null }>>(
    'SELECT MIN(vk_user_id) AS m FROM players WHERE vk_user_id < 0',
  )
  const minVal = rows[0]?.m
  if (minVal == null || !Number.isFinite(Number(minVal))) return -1
  return Number(minVal) - 1
}
