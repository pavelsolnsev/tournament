import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { uploadedPlayerPhotoPattern } from '../../../../app/utils/playerPhotoUrl'
import { uploadedPlayerPhotoDirectory } from '../../../utils/uploadedPlayerPhoto'

export default defineEventHandler(async event => {
  const name = getRouterParam(event, 'name') ?? ''
  if (!uploadedPlayerPhotoPattern.test(name)) throw createError({ statusCode: 404 })
  try {
    const photo = await readFile(resolve(uploadedPlayerPhotoDirectory(event), name))
    setResponseHeader(event, 'Content-Type', 'image/webp')
    setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    return photo
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw createError({ statusCode: 404 })
    throw error
  }
})
