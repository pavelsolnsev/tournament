// Скрипт генерирует splash-экраны для всех популярных iPhone.
// Каждый файл — тёмный фон #0f172a + логотип по центру нужного размера.

import sharp from 'sharp'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const logo = resolve(root, 'public/icon-512.png')
const out = resolve(root, 'public/splash')

// Все популярные экраны iPhone (portrait, @2x/@3x).
const SCREENS = [
  { name: 'iphone-se',          w: 640,  h: 1136, logo: 200 }, // SE 1st/2nd
  { name: 'iphone-8',           w: 750,  h: 1334, logo: 220 }, // 6/7/8
  { name: 'iphone-8plus',       w: 1242, h: 2208, logo: 300 }, // 6+/7+/8+
  { name: 'iphone-x',           w: 1125, h: 2436, logo: 280 }, // X/XS/11 Pro
  { name: 'iphone-xr',          w: 828,  h: 1792, logo: 240 }, // XR/11
  { name: 'iphone-xs-max',      w: 1242, h: 2688, logo: 300 }, // XS Max/11 Pro Max
  { name: 'iphone-12-mini',     w: 1080, h: 2340, logo: 270 }, // 12 mini/13 mini
  { name: 'iphone-12',          w: 1170, h: 2532, logo: 280 }, // 12/13/14
  { name: 'iphone-12-pro-max',  w: 1284, h: 2778, logo: 310 }, // 12 Pro Max/13 Pro Max
  { name: 'iphone-14-pro',      w: 1179, h: 2556, logo: 280 }, // 14 Pro/15 Pro
  { name: 'iphone-14-pro-max',  w: 1290, h: 2796, logo: 320 }, // 14 Pro Max/15 Pro Max
  { name: 'iphone-15',          w: 1179, h: 2556, logo: 280 }, // 15/16
  { name: 'iphone-15-plus',     w: 1290, h: 2796, logo: 320 }, // 15 Plus/16 Plus
]

const BG = { r: 15, g: 23, b: 42 } // #0f172a — slate-900

for (const s of SCREENS) {
  const logoSize = s.logo
  const left = Math.round((s.w - logoSize) / 2)
  const top = Math.round((s.h - logoSize) / 2) - Math.round(s.h * 0.04) // чуть выше центра

  // Масштабируем лого и накладываем поверх тёмного фона.
  const logoBuffer = await sharp(logo)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()

  await sharp({
    create: { width: s.w, height: s.h, channels: 4, background: { ...BG, alpha: 255 } },
  })
    .composite([{ input: logoBuffer, left, top }])
    .png({ compressionLevel: 9 })
    .toFile(`${out}/${s.name}.png`)

  console.log(`✓ ${s.name}  ${s.w}×${s.h}`)
}

console.log('\nВсе splash-экраны готовы!')
