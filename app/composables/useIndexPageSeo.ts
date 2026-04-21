/** Мета главной: SEO + canonical (без og:image). */
export function useIndexPageSeo() {
  const requestURL = useRequestURL()
  const canonicalHref = requestURL.href.split('#')[0]

  useSeoMeta({
    title: 'РФОИ',
    description:
      'Веб-приложение для футбольных турниров: распределение игроков по командам, матчи и турнирная таблица. Режим администратора и просмотр для зрителей.',
    ogSiteName: 'РФОИ',
    ogTitle: 'РФОИ — турниры, команды и таблица',
    ogDescription:
      'Составы команд, матчи и турнирная таблица в одном месте — для организатора и зрителей.',
    ogType: 'website',
    ogUrl: canonicalHref,
    ogLocale: 'ru_RU',
    twitterCard: 'summary',
    twitterTitle: 'РФОИ — турниры, команды и таблица',
    twitterDescription:
      'Составы команд, матчи и турнирная таблица — для организатора и зрителей.',
    robots: 'index, follow',
  })

  useHead({
    link: [{ rel: 'canonical', href: canonicalHref }],
  })

  return { canonicalHref }
}
