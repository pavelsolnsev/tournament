export const playerEditGroups = [
  { title: 'Профиль', fields: [
    { key: 'name', label: 'Имя', kind: 'text' },
    { key: 'username', label: 'Ник', kind: 'text' },
    { key: 'vk_user_id', label: 'ID пользователя ВКонтакте', kind: 'vk' },
    { key: 'photo', label: 'Файл фотографии', kind: 'photo' },
  ] },
  { title: 'Статистика за все турниры', fields: [
    { key: 'gamesPlayed', label: 'Сыграно матчей', kind: 'count' },
    { key: 'wins', label: 'Победы', kind: 'count' },
    { key: 'draws', label: 'Ничьи', kind: 'count' },
    { key: 'losses', label: 'Поражения', kind: 'count' },
    { key: 'goals', label: 'Голы', kind: 'count' },
    { key: 'assists', label: 'Голевые передачи', kind: 'count' },
    { key: 'saves', label: 'Сейвы', kind: 'count' },
    { key: 'mvp', label: 'Звания MVP турнира', kind: 'count' },
    { key: 'yellow_cards', label: 'Жёлтые карточки', kind: 'count' },
    { key: 'red_cards', label: 'Красные карточки', kind: 'count' },
  ] },
  { title: 'Рейтинг', fields: [
    { key: 'rating', label: 'Рейтинг', kind: 'rating' },
    { key: 'rating_prev', label: 'Предыдущий рейтинг', kind: 'rating' },
    { key: 'rating_trend', label: 'Стрелка рейтинга', kind: 'trend' },
  ] },
] as const

export type PlayerEditField = (typeof playerEditGroups)[number]['fields'][number]
export type PlayerEditValues = Partial<Record<PlayerEditField['key'], string>>
