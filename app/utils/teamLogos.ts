// Соответствие имени команды (как в турнире) и файла логотипа в /public/team-photos/.
// Ключи — нормализованное имя в нижнем регистре; при отсутствии ключа показываем цветной маркер как раньше.
import { normalizeTeamName } from '~/utils/teamNames'

/** Путь от корня сайта; файлы лежат в public/team-photos. */
const TEAM_LOGO_PATH_BY_NORMALIZED_KEY: Record<string, string> = {
  анжи: '/team-photos/anji.png',
  anji: '/team-photos/anji.png',
  леон: '/team-photos/leon.webp',
  leon: '/team-photos/leon.webp',
  титан: '/team-photos/titan.png',
  titan: '/team-photos/titan.png',
  worlds: '/team-photos/worlds.png',
  ворлдс: '/team-photos/worlds.png',
  california: '/team-photos/california.webp',
  калифорния: '/team-photos/california.webp',
  volt: '/team-photos/volt.webp',
  вольт: '/team-photos/volt.webp',
  rych: '/team-photos/rych.webp',
  ручеёк: '/team-photos/rych.webp',
  engelbert: '/team-photos/Engelbert.png',
  ясность: '/team-photos/iasnostb.jpg',
  iasnostb: '/team-photos/iasnostb.jpg',
  un: '/team-photos/un.webp',
  юн: '/team-photos/un.webp',
  рфои: '/team-photos/admin.png',
  rfoi: '/team-photos/admin.png',
  челси: '/team-photos/сhelsea.jpg',
  chelsea: '/team-photos/сhelsea.jpg',
  'fc chelsea': '/team-photos/сhelsea.jpg',
  артемида: '/team-photos/artemida.webp',
  artemida: '/team-photos/artemida.webp',
  mixteam: '/team-photos/mixteam.webp',
  микстим: '/team-photos/mixteam.webp',
  'uzb.фк.1956.пахтакор': '/team-photos/paxtakor.webp',
  'фк.1956.пахтакор': '/team-photos/paxtakor.webp',
  пахтакор: '/team-photos/paxtakor.webp',
  paxtakor: '/team-photos/paxtakor.webp',
  pakhtakor: '/team-photos/paxtakor.webp',
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
