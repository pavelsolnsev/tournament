import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(process.cwd())
const DIR = path.join(ROOT, 'public', 'player-photos')

const exts = new Set(['.png', '.jpg', '.jpeg'])

async function main() {
  let entries
  try {
    entries = await fs.readdir(DIR, { withFileTypes: true })
  } catch (e) {
    console.error(`Не нашёл папку: ${DIR}`)
    throw e
  }

  const files = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => exts.has(path.extname(name).toLowerCase()))

  if (files.length === 0) {
    console.log('В public/player-photos нет png/jpg/jpeg для конвертации.')
    return
  }

  let converted = 0
  let skipped = 0
  let failed = 0

  for (const name of files) {
    const srcPath = path.join(DIR, name)
    const base = name.slice(0, -path.extname(name).length)
    const outPath = path.join(DIR, `${base}.webp`)

    try {
      // Не перетираем, если уже есть webp рядом.
      await fs.access(outPath)
      skipped += 1
      continue
    } catch {
      // ok
    }

    try {
      await sharp(srcPath)
        // Аватары маленькие: quality 70 обычно даёт сильное сжатие без артефактов.
        .webp({ quality: 70 })
        .toFile(outPath)
      converted += 1
    } catch (e) {
      failed += 1
      console.error(`Не удалось конвертировать ${name}:`, e?.message ?? e)
    }
  }

  console.log(
    JSON.stringify({ converted, skipped, failed, dir: DIR }, null, 2),
  )
}

await main()

