// Этот файл: композабл мастера создания турнира (wizard).
// Он хранит шаги, данные игроков/команд и связывает всё вместе через composables.
import type { Player, Team } from '~/types/tournament'
import type { PlayedMatch, PlayerMatchStats } from '~/composables/tournament-standings/types'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'
import { useTeamAssignment } from '~/composables/useTeamAssignment'

// Снапшот состояния турнирной таблицы — сохраняется отдельно при каждом изменении матчей.
export type SavedStandingsSnapshot = {
  standingsRows: StandingsRow[]
  playedMatchesList: PlayedMatch[]
  aggregatePlayerStats: Record<number, PlayerMatchStats>
  matchCount: number
  teamGamesCount: Record<string, number>
  consecutiveGames: Record<string, number>
  matchHistory: Record<string, Record<string, number>>
  lastMatchIndex: Record<string, Record<string, number>>
  playedSingleMatch: boolean
  // Накопленные дельты рейтинга за все матчи турнира — нужны для UI и восстановления после перезагрузки.
  playerRatingDeltas: Record<number, number>
}

type SavedTournamentContext = {
  step: number
  tournamentName: string
  tournamentDate: string
  selectedIds: number[]
  assignmentByPlayerId: Record<number, string>
  confirmedTeamNames: string[]
  teamColors: Record<string, number>
  // Снапшот таблицы и матчей — восстанавливается при старте шага "Таблица".
  standingsSnapshot: SavedStandingsSnapshot | null
}

// Управляет мастером создания турнира:
// шаги, загрузка данных, выбор игроков/команд и сохранение состояния в cookie.
export function useTournamentWizard() {
  // Текущий шаг: 0 — игроки, 1 — команды, 2 — турнирная таблица.
  const step = ref<0 | 1 | 2>(0)
  const tournamentName = ref('')
  const tournamentDate = ref('')

  // Загружаем игроков из API.
  const { data: players, refresh: refreshPlayers } = useFetch<Player[]>('/api/players', {
    default: () => [],
  })

  // Загружаем команды из API.
  const { data: teamsFromApi } = useFetch<Team[]>('/api/teams', {
    default: () => [],
  })

  // Имена команд, которые уже есть в базе.
  const existingTeamNames = computed(() => (teamsFromApi.value ?? []).map((t) => t.name))

  // Логика назначения игроков по командам + подтверждение команд.
  const assignment = useTeamAssignment(existingTeamNames)

  // Список подтверждённых команд для передачи в шаг таблицы.
  const confirmedTeamsList = computed(() => Array.from(assignment.confirmedTeamNames.value))

  // ID выбранных игроков.
  const selectedIds = ref<Set<number>>(new Set())

  // Игроки, которые сейчас добавлены в турнир.
  const selectedPlayers = computed(() => {
    const list = players.value ?? []
    return list.filter((p) => selectedIds.value.has(p.id))
  })

  // Игроки, которые ещё не выбраны в турнир.
  const availablePlayers = computed(() => {
    const list = players.value ?? []
    return list.filter((p) => !selectedIds.value.has(p.id))
  })

  // Поиск по доступным игрокам.
  const playerSearch = ref('')
  const filteredAvailablePlayers = computed(() => {
    const list = availablePlayers.value
    const term = playerSearch.value.trim().toLowerCase()

    // Чтобы не делать фильтрацию по коротким строкам, ждём 3+ символа.
    if (term.length < 3) return list

    // Убираем ведущие @, чтобы поиск работал и по username.
    const normalized = term.replace(/^@/, '')

    return list.filter((p) => {
      const name = p.name.toLowerCase()
      const username = (p.username || '').replace(/^@/, '').toLowerCase()
      return name.includes(term) || (!!username && username.includes(normalized))
    })
  })

  function selectPlayer(id: number) {
    // Добавляем игрока в выбранные.
    const next = new Set(selectedIds.value)
    next.add(id)
    selectedIds.value = next
  }

  function removePlayer(id: number) {
    // Убираем игрока из выбранных.
    const next = new Set(selectedIds.value)
    next.delete(id)
    selectedIds.value = next
  }

  function onAddNewTeam() {
    // Создаём команду на основе текущего ввода в шаге команд.
    assignment.addNewTeam(assignment.newTeamName.value)
    assignment.newTeamName.value = ''
  }

  // Cookie для сохранения состояния турнира.
  const contextCookie = useCookie<SavedTournamentContext | null>('tournament-context', {
    default: () => null,
    // Храним состояние турнира 30 дней.
    maxAge: 60 * 60 * 24 * 30,
  })

  // Снапшот таблицы и матчей — обновляется из компонента StepStandings при каждом изменении.
  const standingsSnapshot = ref<SavedStandingsSnapshot | null>(
    contextCookie.value?.standingsSnapshot ?? null,
  )

  // Восстанавливаем контекст, если он есть в cookie.
  if (contextCookie.value) {
    const ctx = contextCookie.value

    // Читаем шаг из куки. Если это старый формат (0–4), приводим к новому (0–2).
    // Старые шаги: 0=приветствие, 1=детали, 2=игроки, 3=команды, 4=таблица.
    // Новые шаги: 0=игроки, 1=команды, 2=таблица.
    const raw = ctx.step
    let migrated: 0 | 1 | 2
    if (raw === 0 || raw === 1 || raw === 2) {
      // Новый формат — используем как есть.
      migrated = raw
    } else if (raw === 3) {
      // Старый шаг "команды" → новый шаг 1.
      migrated = 1
    } else {
      // Старый шаг "таблица" (4) или любое другое → новый шаг 2.
      migrated = 2
    }
    step.value = migrated

    tournamentName.value = ctx.tournamentName ?? ''
    tournamentDate.value = ctx.tournamentDate ?? ''

    // Восстанавливаем набор выбранных игроков.
    selectedIds.value = new Set(
      (ctx.selectedIds ?? []).filter((id) => Number.isFinite(id)),
    )

    // Восстанавливаем назначение игроков по командам.
    assignment.assignment.value = ctx.assignmentByPlayerId ?? {}
    assignment.confirmedTeamNames.value = new Set(ctx.confirmedTeamNames ?? [])
    assignment.teamColors.value = ctx.teamColors ?? {}

    // Восстанавливаем пользовательские команды, чтобы они снова появились в выпадающем списке.
    const namesFromAssignments = Object.values(ctx.assignmentByPlayerId ?? {})
    const namesFromConfirmed = ctx.confirmedTeamNames ?? []
    const namesFromColors = Object.keys(ctx.teamColors ?? {})
    const allNames = new Set<string>([
      ...namesFromAssignments,
      ...namesFromConfirmed,
      ...namesFromColors,
    ].filter((name) => !!name && typeof name === 'string'))

    const existingNames = new Set(existingTeamNames.value ?? [])
    assignment.newTeamNames.value = Array.from(allNames).filter((name) => !existingNames.has(name))
  }

  // Текущее состояние для записи в cookie.
  const savedContext = computed<SavedTournamentContext>(() => ({
    step: step.value,
    tournamentName: tournamentName.value,
    tournamentDate: tournamentDate.value,
    selectedIds: Array.from(selectedIds.value),
    assignmentByPlayerId: assignment.assignment.value,
    confirmedTeamNames: Array.from(assignment.confirmedTeamNames.value),
    teamColors: assignment.teamColors.value,
    // Сохраняем последний снапшот таблицы — он обновляется снаружи через saveStandingsSnapshot.
    standingsSnapshot: standingsSnapshot.value,
  }))

  // При изменении состояния обновляем cookie.
  watch(savedContext, (val) => {
    contextCookie.value = val
  }, { deep: true })

  // Вызывается из StepStandings при каждом изменении матчей/таблицы.
  function saveStandingsSnapshot(snapshot: SavedStandingsSnapshot) {
    standingsSnapshot.value = snapshot
  }

  return {
    step,
    tournamentName,
    tournamentDate,
    players,
    refreshPlayers,
    assignment,
    confirmedTeamsList,
    selectedPlayers,
    availablePlayers,
    playerSearch,
    filteredAvailablePlayers,
    selectPlayer,
    removePlayer,
    onAddNewTeam,
    standingsSnapshot,
    saveStandingsSnapshot,
  }
}

