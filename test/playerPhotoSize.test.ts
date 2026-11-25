import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { base64ByteLength, playerPhotoMaxBytes, playerPhotoTargetBytes } from '../app/utils/playerPhotoSize'
import { preparePlayerPhoto, uploadedPlayerPhotoName } from '../server/utils/uploadedPlayerPhoto'
import { playerPhotoPublicUrl, uploadedPlayerPhotoPattern } from '../app/utils/playerPhotoUrl'

describe('uploaded avatar filenames', () => {
  it('uses a readable name with a different suffix for each upload', () => {
    const first = uploadedPlayerPhotoName('Ёлкин Иван')
    expect(first).toMatch(/^avatar-yolkin-ivan-[a-f0-9]{32}\.webp$/)
    expect(uploadedPlayerPhotoName('Ёлкин Иван')).not.toBe(first)
    expect(playerPhotoPublicUrl(first)).toBe(`/player-photos/uploads/${first}`)
  })

  it('keeps long names and special characters safe and supports existing photos', () => {
    expect(uploadedPlayerPhotoName('../' + 'Длинное имя '.repeat(20))).toMatch(uploadedPlayerPhotoPattern)
    expect(uploadedPlayerPhotoName('🏆')).toMatch(uploadedPlayerPhotoPattern)
    expect(playerPhotoPublicUrl('avatar-' + 'a'.repeat(32) + '.webp')).toContain('/player-photos/uploads/')
    expect(playerPhotoPublicUrl('ivan.webp')).toBe('/player-photos/ivan.webp')
  })
})

describe('avatar compression', () => {
  it.each([19_999, 20_000, 20_001])('counts %i bytes before base64 transport', size => {
    expect(base64ByteLength(Buffer.alloc(size).toString('base64'))).toBe(size)
  })

  it('rejects an upload above the photo limit before decoding', async () => {
    const image = Buffer.alloc(playerPhotoMaxBytes + 1).toString('base64')
    await expect(preparePlayerPhoto(image)).rejects.toMatchObject({ statusCode: 413 })
  })

  it('stores a simple photo below the target as WebP', async () => {
    const image = await sharp({ create: { width: 256, height: 256, channels: 3, background: '#507caa' } }).png().toBuffer()
    const avatar = await preparePlayerPhoto(image.toString('base64'))
    expect(avatar.length).toBeLessThanOrEqual(playerPhotoTargetBytes)
    expect(await sharp(avatar).metadata()).toMatchObject({ width: 128, height: 128, format: 'webp' })
  })

  it('keeps a highly detailed photo below the maximum and preserves a square crop', async () => {
    let state = 1
    const pixels = Buffer.alloc(256 * 256 * 3)
    for (let index = 0; index < pixels.length; index++) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0
      pixels[index] = state >>> 24
    }
    const image = await sharp(pixels, { raw: { width: 256, height: 256, channels: 3 } }).jpeg({ quality: 32 }).toBuffer()
    expect(image.length).toBeLessThanOrEqual(playerPhotoMaxBytes)
    const avatar = await preparePlayerPhoto(image.toString('base64'))
    expect(avatar.length).toBeLessThanOrEqual(playerPhotoMaxBytes)
    const meta = await sharp(avatar).metadata()
    expect(meta.format).toBe('webp')
    expect(meta.width).toBeLessThanOrEqual(128)
    expect(meta.width).toBe(meta.height)
  })
})
