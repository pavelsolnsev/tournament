import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'
import type { H3Event } from 'h3'
import { createError, getRequestWebStream } from 'h3'
import { base64ByteLength, playerPhotoDimensions, playerPhotoMaxBytes, playerPhotoTargetBytes } from '../../app/utils/playerPhotoSize'

export function uploadedPlayerPhotoDirectory(event: H3Event) {
  return resolve(useRuntimeConfig(event).playerPhotosDir || '.data/player-photos')
}

export async function readPlayerEditBody(event: H3Event): Promise<unknown> {
  const stream = getRequestWebStream(event)
  const reader = stream?.getReader()
  if (!reader) throw createError({ statusCode: 400 })
  const chunks: Buffer[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 512 * 1024) throw createError({ statusCode: 413, data: { message: 'Файл слишком большой.' } })
      chunks.push(Buffer.from(value))
    }
  } finally {
    reader.releaseLock()
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw createError({ statusCode: 400 })
  }
}

export async function preparePlayerPhoto(value: unknown) {
  if (typeof value !== 'string' || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw invalidPhoto()
  if (base64ByteLength(value) > playerPhotoMaxBytes) {
    throw createError({ statusCode: 413, data: { message: 'Фотография должна весить не больше 20 КБ.' } })
  }
  const image = Buffer.from(value, 'base64')
  try {
    const pipeline = sharp(image, { limitInputPixels: 1024 ** 2 })
    const metadata = await pipeline.metadata()
    if (!metadata.format || !['jpeg', 'png', 'webp'].includes(metadata.format) || !metadata.width || !metadata.height) {
      throw invalidPhoto()
    }
    for (const size of playerPhotoDimensions) {
      const resized = pipeline.clone().rotate().resize(size, size, { fit: 'cover', withoutEnlargement: true })
      let acceptable: Buffer | null = null
      for (const quality of [82, 72, 62]) {
        const webp = await resized.clone().webp({ quality }).toBuffer()
        if (webp.length <= playerPhotoTargetBytes) return webp
        if (webp.length <= playerPhotoMaxBytes) acceptable ??= webp
      }
      if (acceptable) return acceptable
    }
  } catch {
    throw invalidPhoto()
  }
  throw invalidPhoto()
}

function invalidPhoto() {
  return createError({ statusCode: 400, data: { message: 'Не удалось обработать фотографию. Выберите другое изображение.' } })
}

const cyrillic = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'
const latin = ['a', 'b', 'v', 'g', 'd', 'e', 'yo', 'zh', 'z', 'i', 'y', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'f', 'kh', 'ts', 'ch', 'sh', 'shch', '', 'y', '', 'e', 'yu', 'ya']

export function uploadedPlayerPhotoName(playerName: string) {
  const slug = playerName.toLowerCase()
    .replace(/[а-яё]/g, letter => latin[cyrillic.indexOf(letter)] ?? '')
    .normalize('NFKD')
    .replace(/\p{Mark}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .slice(0, 40)
    .replace(/-+$/, '')
  const unique = randomUUID().replaceAll('-', '')
  return `avatar-${slug ? `${slug}-` : ''}${unique}.webp`
}

export async function storePlayerPhoto(event: H3Event, photo: Buffer, playerName: string) {
  const directory = uploadedPlayerPhotoDirectory(event)
  const name = uploadedPlayerPhotoName(playerName)
  const path = resolve(directory, name)
  await mkdir(directory, { recursive: true })
  await writeFile(path, photo, { flag: 'wx' })
  return { name, path }
}
