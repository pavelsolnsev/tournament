// Одноразовый скрипт оптимизации картинок в public/.
// Уменьшает гигантские логотипы команд и фото игроков до разумных размеров.
// Аватары в UI максимум 40px, поэтому держать исходники в мегабайтах бессмысленно.
// Формат файлов сохраняем (на конкретные имена есть прямые ссылки в коде и в БД).
import { readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

// Папка → максимальная сторона картинки в пикселях (с запасом под retina).
const TARGETS = [
  { dir: 'team-photos', maxSide: 160 },
  { dir: 'player-photos', maxSide: 128 },
]

// Сжимаем один файл: читаем, ресайзим по большей стороне, пишем во временный и заменяем оригинал.
async function optimizeOne(filePath, maxSide) {
  const ext = extname(filePath).toLowerCase()
  if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return null
  const before = (await stat(filePath)).size
  // Читаем в буфер: так sharp не держит дескриптор исходника и мы можем
  // безопасно перезаписать тот же файл (на Windows rename поверх даёт EPERM).
  const input = await readFile(filePath)
  let pipeline = sharp(input).rotate().resize({
    width: maxSide,
    height: maxSide,
    fit: 'inside',
    withoutEnlargement: true,
  })
  // Подбираем кодер под исходное расширение, чтобы не менять имя файла.
  if (ext === '.png') pipeline = pipeline.png({ compressionLevel: 9, palette: true, quality: 80 })
  else if (ext === '.webp') pipeline = pipeline.webp({ quality: 78 })
  else pipeline = pipeline.jpeg({ quality: 78, mozjpeg: true })
  const output = await pipeline.toBuffer()
  await writeFile(filePath, output)
  const after = (await stat(filePath)).size
  return { before, after }
}

// Проходим по целевым папкам и считаем суммарную экономию.
let totalBefore = 0
let totalAfter = 0
for (const { dir, maxSide } of TARGETS) {
  const abs = join(root, dir)
  let files = []
  try {
    files = await readdir(abs)
  } catch {
    continue
  }
  for (const name of files) {
    if (name.startsWith('.tmp-')) continue
    const res = await optimizeOne(join(abs, name), maxSide)
    if (!res) continue
    totalBefore += res.before
    totalAfter += res.after
    const saved = res.before - res.after
    if (saved > 50 * 1024) {
      console.log(`${dir}/${name}: ${(res.before / 1024).toFixed(0)}KB -> ${(res.after / 1024).toFixed(0)}KB`)
    }
  }
}
console.log(`\nИТОГО: ${(totalBefore / 1024 / 1024).toFixed(2)}MB -> ${(totalAfter / 1024 / 1024).toFixed(2)}MB`)
