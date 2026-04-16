// Соответствие имени команды (как в турнире) и файла логотипа в /public/team-photos/.
// Ключи — нормализованное имя в нижнем регистре; при отсутствии ключа показываем цветной маркер как раньше.
import { normalizeTeamName } from '~/utils/teamNames'

/** Путь от корня сайта; файлы лежат в public/team-photos. */
const TEAM_LOGO_PATH_BY_NORMALIZED_KEY: Record<string, string> = {
  // Анжи — anji.png
  анжи: '/team-photos/anji.png',
  anji: '/team-photos/anji.png',
  // Леон — leon.webp
  леон: '/team-photos/leon.webp',
  leon: '/team-photos/leon.webp',
  // Титан — titan.png
  титан: '/team-photos/titan.png',
  titan: '/team-photos/titan.png',
  // Worlds — worlds.png
  worlds: '/team-photos/worlds.png',
  ворлдс: '/team-photos/worlds.png',
  // California — california.webp
  california: '/team-photos/california.webp',
  калифорния: '/team-photos/california.webp',
  // Volt — volt.webp
  volt: '/team-photos/volt.webp',
  вольт: '/team-photos/volt.webp',
  // Rych — rych.webp
  rych: '/team-photos/rych.webp',
  ручеёк: '/team-photos/rych.webp',
  // Engelbert — ключ только в нижнем регистре (lookup всегда toLowerCase)
  engelbert: '/team-photos/Engelbert.png',
  // Ясность / вариант имени файла iasnostb.jpg
  ясность: '/team-photos/iasnostb.jpg',
  iasnostb: '/team-photos/iasnostb.jpg',
  // UN — un.webp
  un: '/team-photos/un.webp',
  юн: '/team-photos/un.webp',
  // РФОИ — кириллица и латиница после toLowerCase дают рфои / rfoi
  рфои: '/team-photos/admin.png',
  rfoi: '/team-photos/admin.png',
  челси: '/team-photos/сhelsea.jpg',
  chelsea: '/team-photos/сhelsea.jpg',
  'fc chelsea': '/team-photos/сhelsea.jpg',
}

function logoLookupKey(teamName: string): string {
  return normalizeTeamName(teamName).toLowerCase()
}

/** URL логотипа или null — тогда UI показывает эмодзи-маркер цвета. */
export function getTeamLogoSrc(teamName: string): string | null {
  const key = logoLookupKey(teamName)
  if (!key) return null
  return TEAM_LOGO_PATH_BY_NORMALIZED_KEY[key] ?? null
}
