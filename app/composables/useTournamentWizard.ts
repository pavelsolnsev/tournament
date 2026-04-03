// Этот файл: композабл мастера создания турнира (wizard).
// Он хранит шаги, данные игроков/команд и связывает всё вместе через composables.
// Состояние теперь сохраняется в базу данных (не в cookie) для синхронизации между устройствами.
import type { Player, Team, MatchStatus } from '~/types/tournament'
import type { PlayedMatch, PlayerMatchStats } from '~/composables/tournament-standings/types'
import type { StandingsRow } from '~/components/organisms/standings/Table.vue'
import { useTeamAssignment } from '~/composables/useTeamAssignment'
import type { TournamentStateSyncApi } from '~/composables/useTournamentState'
import { dedupeTeamNamesPreservingOrder, normalizeTeamName } from '~/utils/teamNames'

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
  // Текущий незавершённый матч — нужен чтобы админ мог выйти и вернуться к нему.
  currentHomeTeam: string
  currentAwayTeam: string
  currentHomeStats: Record<number, PlayerMatchStats>
  currentAwayStats: Record<number, PlayerMatchStats>
}

export type SavedTournamentContext = {
  step: number
  tournamentName: string
  tournamentDate: string
  selectedIds: number[]
  assignmentByPlayerId: Record<number, string>
  confirmedTeamNames: string[]
  teamColors: Record<string, number>
  // Снапшот таблицы и матчей — восстанавливается при старте шага "Таблица".
  standingsSnapshot: SavedStandingsSnapshot | null
  // Текущий статус матча — зрители подтягивают через useFetch + опрос в live на клиенте.
  matchStatus: MatchStatus
  // Текущие команды матча — показываем зрителям название командд в статусе Live.
  liveHomeTeam: string
  liveAwayTeam: string
}

// Управляет мастером создания турнира:
// шаги, загрузка данных, выбор игроков/команд и сохранение состояния в базу данных.
// stateSync передаётся снаружи — один useTournamentState() на странице, без второго параллельного GET.
export function useTournamentWizard(stateSync: TournamentStateSyncApi) {
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

  // Имена команд из БД без повторов (дубли строк или отличия только пробелами).
  const existingTeamNames = computed(() =>
    dedupeTeamNamesPreservingOrder((teamsFromApi.value ?? []).map((t) => t.name)),
  )

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

    // Показываем все доступные игроки при пустом запросе, фильтруем от 1 символа.
    if (term.length < 1) return list

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

  // Снапшот таблицы и матчей — обновляется из компонента StepStandings при каждом изменении.
  const standingsSnapshot = ref<SavedStandingsSnapshot | null>(null)

  // Текущий статус матча — синхронизируется с БД, зритель видит его через polling.
  const matchStatus = ref<MatchStatus>('upcoming')
  // Команды текущего live-матча — передаём зрителю чтобы он видел кто играет.
  const liveHomeTeam = ref('')
  const liveAwayTeam = ref('')

  // Флаг: было ли уже восстановлено состояние из базы.
  const stateRestored = ref(false)

  const { serverState, isLoading, saveTournamentState, saveTournamentStateNow } = stateSync

  // Восстанавливаем состояние из базы, когда оно загрузится.
  // Срабатывает один раз после первой загрузки — даже если state = null (турнир ещё не начат).
  watch(
    [serverState, isLoading],
    ([ctx, loading]) => {
      // Ждём, пока загрузка завершится (isLoading = false).
      if (loading || stateRestored.value) return

      // Загрузка завершена. Если состояния нет — просто отмечаем как восстановленное.
      stateRestored.value = true

      if (!ctx) return

      // Читаем шаг из базы. Если это старый формат (0–4), приводим к новому (0–2).
      const raw = ctx.step
      let migrated: 0 | 1 | 2
      if (raw === 0 || raw === 1 || raw === 2) {
        migrated = raw
      } else if (raw === 3) {
        migrated = 1
      } else {
        migrated = 2
      }
      step.value = migrated

      tournamentName.value = ctx.tournamentName ?? ''
      tournamentDate.value = ctx.tournamentDate ?? ''

      // Восстанавливаем набор выбранных игроков.
      selectedIds.value = new Set(
        (ctx.selectedIds ?? []).filter((id) => Number.isFinite(id)),
      )

      // Восстанавливаем назначение игроков по командам (имена в одном формате, как в списке команд).
      const rawAssign = ctx.assignmentByPlayerId ?? {}
      const normalizedAssign: Record<number, string> = {}
      for (const [idStr, team] of Object.entries(rawAssign)) {
        const n = normalizeTeamName(String(team))
        if (n) normalizedAssign[Number(idStr)] = n
      }
      assignment.assignment.value = normalizedAssign
      assignment.confirmedTeamNames.value = new Set(
        dedupeTeamNamesPreservingOrder(ctx.confirmedTeamNames ?? []),
      )
      assignment.teamColors.value = ctx.teamColors ?? {}

      // Восстанавливаем снапшот турнирной таблицы.
      standingsSnapshot.value = ctx.standingsSnapshot ?? null

      // Восстанавливаем статус матча и текущие команды.
      matchStatus.value = ctx.matchStatus ?? 'upcoming'
      liveHomeTeam.value = ctx.liveHomeTeam ?? ''
      liveAwayTeam.value = ctx.liveAwayTeam ?? ''

      // Восстанавливаем пользовательские команды для списка; без дублей и без повторов имён из БД.
      const namesFromAssignments = Object.values(ctx.assignmentByPlayerId ?? {})
      const namesFromConfirmed = ctx.confirmedTeamNames ?? []
      const namesFromColors = Object.keys(ctx.teamColors ?? {})
      const mergedFromContext = [
        ...namesFromAssignments,
        ...namesFromConfirmed,
        ...namesFromColors,
      ].filter((name) => !!name && typeof name === 'string')
      const uniqueFromContext = dedupeTeamNamesPreservingOrder(mergedFromContext)

      const existingKeys = new Set((existingTeamNames.value ?? []).map((n) => normalizeTeamName(n)))
      assignment.newTeamNames.value = uniqueFromContext.filter(
        (name) => !existingKeys.has(normalizeTeamName(name)),
      )
    },
    { immediate: true },
  )

  // Текущее состояние для записи в базу данных.
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
    // Сохраняем статус матча — зритель видит Live/Upcoming/Finished через polling.
    matchStatus: matchStatus.value,
    liveHomeTeam: liveHomeTeam.value,
    liveAwayTeam: liveAwayTeam.value,
  }))

  // При изменении состояния сохраняем в базу данных (с debounce).
  // Не сохраняем до тех пор, пока состояние не восстановлено — иначе затрём данные с сервера.
  watch(
    savedContext,
    (val) => {
      if (!stateRestored.value) return
      saveTournamentState(val)
    },
    { deep: true },
  )

  // Вызывается из StepStandings при каждом изменении матчей/таблицы.
  function saveStandingsSnapshot(snapshot: SavedStandingsSnapshot) {
    standingsSnapshot.value = snapshot
  }

  // Обновляет статус матча — вызывается из StepStandings при смене команд или завершении.
  function updateMatchStatus(status: MatchStatus, home: string, away: string) {
    matchStatus.value = status
    liveHomeTeam.value = home
    liveAwayTeam.value = away
  }

  // Полный сброс wizard после завершения турнира — начинаем с чистого листа.
  async function resetWizard() {
    // Сбрасываем шаг в начало (шаг 0 — выбор игроков).
    step.value = 0
    tournamentName.value = ''
    tournamentDate.value = ''

    // Очищаем выбранных игроков.
    selectedIds.value = new Set()
    playerSearch.value = ''

    // Очищаем назначение по командам и все списки команд.
    assignment.assignment.value = {}
    assignment.confirmedTeamNames.value = new Set()
    assignment.teamColors.value = {}
    assignment.newTeamNames.value = []
    assignment.newTeamName.value = ''

    // Очищаем снапшот матчей и таблицы.
    standingsSnapshot.value = null

    // Сбрасываем статус матча — турнир очищен.
    matchStatus.value = 'upcoming'
    liveHomeTeam.value = ''
    liveAwayTeam.value = ''

    // Сразу сохраняем сброшенное состояние в базу (без debounce — важный момент).
    await saveTournamentStateNow({
      step: 0,
      tournamentName: '',
      tournamentDate: '',
      selectedIds: [],
      assignmentByPlayerId: {},
      confirmedTeamNames: [],
      teamColors: {},
      standingsSnapshot: null,
      matchStatus: 'upcoming',
      liveHomeTeam: '',
      liveAwayTeam: '',
    })
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
    matchStatus,
    liveHomeTeam,
    liveAwayTeam,
    updateMatchStatus,
    resetWizard,
    stateRestored,
  }
}
