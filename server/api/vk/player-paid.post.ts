import { ensureTablesExist } from '../../utils/initDb'
import { requireVkBotToken } from '../../utils/vkBotAuth'
import { setPlayerPaidByVkUserId, togglePlayerPaidByVkUserId } from '../../utils/tournamentPaidPlayers'

// POST /api/vk/player-paid — оплата по vk_user_id: body.paid true/false или без поля — toggle.
export default defineEventHandler(async (event) => {
  await ensureTablesExist()
  requireVkBotToken(event)

  const body = await readBody(event)
  const vkUserId = Number(body?.vk_user_id ?? body?.vkUserId)
  if (!Number.isFinite(vkUserId) || vkUserId === 0) {
    throw createError({ statusCode: 400, statusMessage: 'vk_user_id is required' })
  }

  const paidFlag = body?.paid
  const result = typeof paidFlag === 'boolean'
    ? await setPlayerPaidByVkUserId(vkUserId, paidFlag)
    : await togglePlayerPaidByVkUserId(vkUserId)
  if (!result.ok) {
    throw createError({ statusCode: 400, statusMessage: result.statusMessage })
  }

  return {
    ok: true,
    paid: result.paid,
    playerId: result.playerId,
    paidPlayerIds: result.paidPlayerIds,
  }
})
