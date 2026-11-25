import type { RowDataPacket } from 'mysql2'
import { unlink as removeFile } from 'node:fs/promises'
import { getPool } from '../../utils/db'
import { playerEditorChanges, playerEditorId, playerEditorValues } from '../../utils/playerEditor'
import { preparePlayerPhoto, readPlayerEditBody, storePlayerPhoto } from '../../utils/uploadedPlayerPhoto'

export default defineEventHandler(async event => {
  const id = playerEditorId(event)
  const body = await readPlayerEditBody(event) as { photoUpload?: unknown } | null
  const photo = body?.photoUpload === undefined ? null : await preparePlayerPhoto(body.photoUpload)
  const conn = await getPool().getConnection()
  let storedPath: string | undefined
  let committing = false
  try {
    await conn.beginTransaction()
    const [rows] = await conn.execute<RowDataPacket[]>('SELECT * FROM players WHERE id = ? FOR UPDATE', [id])
    const current = playerEditorValues(rows[0])
    const edits = playerEditorChanges(current, body)
    if (photo) {
      const photoEdit = edits.find(edit => edit.field === 'photo')
      if (!photoEdit) throw createError({ statusCode: 400 })
      const nameEdit = edits.find(edit => edit.field === 'name')
      const playerName = typeof nameEdit?.value === 'string' ? nameEdit.value : current.name ?? ''
      const stored = await storePlayerPhoto(event, photo, playerName)
      storedPath = stored.path
      photoEdit.value = stored.name
    }
    const unlink = edits.find(edit => edit.field === 'vk_user_id' && edit.value === null)
    if (unlink) {
      const [synthetic] = await conn.execute<RowDataPacket[]>('SELECT vk_user_id FROM players WHERE vk_user_id < 0 ORDER BY vk_user_id LIMIT 1 FOR UPDATE')
      unlink.value = Number(synthetic[0]?.vk_user_id ?? 0) - 1
    }
    const assignments = edits.map(edit => `\`${edit.field}\` = ?`).join(', ')
    await conn.execute(`UPDATE players SET ${assignments} WHERE id = ?`, [...edits.map(edit => edit.value), id])
    committing = true
    await conn.commit()
    return { ok: true }
  } catch (error) {
    try {
      await conn.rollback()
    } finally {
      if (storedPath && !committing) await removeFile(storedPath).catch(() => {})
    }
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw createError({ statusCode: 409, data: { message: 'Такое значение уже используется другим игроком. Проверьте привязку ВКонтакте и ник.' } })
    }
    throw error
  } finally {
    conn.release()
  }
})
