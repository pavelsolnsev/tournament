// Этот файл: composable для назначения игроков в команды.
// Он держит выбранные команды, подтверждения и распределение игроков.
import type { Ref, ComputedRef } from 'vue'
import { unref } from 'vue'
import {
  dedupeTeamNamesPreservingOrder,
  normalizeTeamName,
  teamNameCollides,
} from '~/utils/teamNames'
import { distributePlayersByRating } from '~/utils/distributeByRating'
import type { Player } from '~/types/tournament'

// Логика назначения игроков в команды и работы с командами.
export function useTeamAssignment(existingTeamNames: Ref<string[]> | ComputedRef<string[]>) {
  // Имена новых команд, созданных пользователем.
  const newTeamNames = ref<string[]>([])
  // Все команды: из API и новые, без дублей (в т.ч. совпадение с БД и лишние пробелы).
  const teamOptions = computed(() =>
    dedupeTeamNamesPreservingOrder([
      ...(unref(existingTeamNames) ?? []),
      ...newTeamNames.value,
    ]),
  )
  // Какой игрок в какой команде.
  const assignment = ref<Record<number, string>>({})
  // ID игрока, для которого сейчас создаём новую команду.
  const newTeamInputForPlayer = ref<number | null>(null)
  // Текст для имени новой команды.
  const newTeamName = ref('')
  /** Команды, которые участвуют в турнире. */
  const confirmedTeamNames = ref<Set<string>>(new Set())
  /** Цвета команд по имени (индекс 0–5). */
  const teamColors = ref<Record<string, number>>({})
  /** Имена команд, созданных авто-распределением — нужны для визуального разделения в UI. */
  const autoDistributedNames = ref<Set<string>>(new Set())

  /** Список имён уже в опциях (БД + новые), для проверки перед добавлением. */
  function listedTeamNamesRaw(): string[] {
    return [...(unref(existingTeamNames) ?? []), ...newTeamNames.value]
  }

  function setTeamColor(teamName: string, colorIndex: number) {
    if (colorIndex < 0 || colorIndex > 5) return
    const key = normalizeTeamName(teamName)
    if (!key) return
    teamColors.value = { ...teamColors.value, [key]: colorIndex }
  }

  function getTeamColor(teamName: string): number {
    const key = normalizeTeamName(teamName)
    if (!key) return 0
    return teamColors.value[key] ?? 0
  }

  function confirmTeam(teamName: string) {
    const key = normalizeTeamName(teamName)
    if (!key) return
    const next = new Set(confirmedTeamNames.value)
    next.add(key)
    confirmedTeamNames.value = next
  }

  function unconfirmTeam(teamName: string) {
    const key = normalizeTeamName(teamName)
    const next = new Set(confirmedTeamNames.value)
    next.delete(key)
    confirmedTeamNames.value = next
    // Команда ушла в «Не участвуют» — освобождаем её игроков обратно в «Свободные».
    assignment.value = Object.fromEntries(
      Object.entries(assignment.value).filter(([, team]) => normalizeTeamName(team) !== key),
    ) as Record<number, string>
  }

  function isTeamConfirmed(teamName: string) {
    return confirmedTeamNames.value.has(normalizeTeamName(teamName))
  }

  function openNewTeamInput(playerId: number) {
    newTeamInputForPlayer.value = playerId
    newTeamName.value = ''
  }

  function closeNewTeamInput() {
    newTeamInputForPlayer.value = null
    newTeamName.value = ''
  }

  function confirmNewTeam(playerId: number) {
    const name = normalizeTeamName(newTeamName.value)
    if (name.length < 2) return
    // Не дублируем строку в newTeamNames, если такое имя уже есть в БД или в списке новых.
    if (!teamNameCollides(name, listedTeamNamesRaw())) {
      newTeamNames.value = [...newTeamNames.value, name]
    }
    assignment.value = { ...assignment.value, [playerId]: name }
    closeNewTeamInput()
  }

  function setTeam(playerId: number, teamName: string) {
    if (teamName === '__new__') {
      openNewTeamInput(playerId)
      return
    }
    const name = normalizeTeamName(teamName)
    if (!name) return
    assignment.value = { ...assignment.value, [playerId]: name }
    closeNewTeamInput()
  }

  function getTeam(playerId: number) {
    return assignment.value[playerId] ?? ''
  }

  /** @returns Нормализованное имя, если команда добавлена; иначе null. */
  function addNewTeam(name: string): string | null {
    const trimmed = normalizeTeamName(name)
    if (trimmed.length < 2) return null
    if (teamNameCollides(trimmed, listedTeamNamesRaw())) return null
    newTeamNames.value = [...newTeamNames.value, trimmed]
    return trimmed
  }

  function removeFromTeam(playerId: number) {
    assignment.value = Object.fromEntries(
      Object.entries(assignment.value).filter(([id]) => Number(id) !== playerId),
    ) as Record<number, string>
  }

  /**
   * Автоматически распределяет игроков по рейтингу.
   * Создаёт teamCount новых команд и назначает игроков так, чтобы суммы рейтингов были близки.
   * Перед этим сбрасывает текущие назначения и команды — чистый старт.
   */
  function autoDistribute(players: Player[], teamCount: number) {
    // Считаем распределение по алгоритму greedy.
    const { teamAssignments, teamRatings: _ } = distributePlayersByRating(players, teamCount)

    // Сбрасываем текущие назначения, команды и метки авто-распределения — пишем с нуля.
    assignment.value = {}
    confirmedTeamNames.value = new Set()
    teamColors.value = {}
    autoDistributedNames.value = new Set()
    // Удаляем только пользовательские команды из предыдущих авто-запусков.
    const teamNamesGenerated = Array.from(
      { length: Math.min(4, Math.max(2, teamCount)) },
      (_, i) => `Команда ${i + 1}`,
    )
    newTeamNames.value = newTeamNames.value.filter(
      (n) => !teamNamesGenerated.some((g) => normalizeTeamName(g) === normalizeTeamName(n)),
    )

    // Добавляем новые сгенерированные команды в список, если их ещё нет.
    const existing = listedTeamNamesRaw()
    const toAdd = teamNamesGenerated.filter(
      (name) => !teamNameCollides(name, existing),
    )
    newTeamNames.value = [...newTeamNames.value, ...toAdd]

    // Назначаем игроков и цвет по индексу; участие не подтверждаем — только вручную (кнопка ✓).
    // Команда 1 → индекс 0 (🔴), Команда 2 → 1 (🔵), Команда 3 → 2 (🟢), Команда 4 → 3 (🟡).
    const nextAssignment: Record<number, string> = {}
    const nextColors: Record<string, number> = {}

    teamNamesGenerated.forEach((teamName, idx) => {
      const playerIds = teamAssignments[teamName] ?? []
      for (const id of playerIds) {
        nextAssignment[id] = teamName
      }
      nextColors[normalizeTeamName(teamName)] = idx
    })

    assignment.value = nextAssignment
    teamColors.value = nextColors
    confirmedTeamNames.value = new Set()
    // Запоминаем нормализованные имена авто-команд — чтобы UI мог их выделить отдельно.
    autoDistributedNames.value = new Set(teamNamesGenerated.map(normalizeTeamName))
  }

  function removeTeam(teamName: string) {
    const normalized = normalizeTeamName(teamName)
    if (!normalized) return

    // Удаляем только команды, созданные пользователем (сравнение по нормализованному имени).
    if (newTeamNames.value.some((n) => normalizeTeamName(n) === normalized)) {
      newTeamNames.value = newTeamNames.value.filter((n) => normalizeTeamName(n) !== normalized)
    }

    // Сбрасываем назначения игроков (без delete по динамическому ключу — правило ESLint).
    assignment.value = Object.fromEntries(
      Object.entries(assignment.value).filter(
        ([, name]) => normalizeTeamName(name) !== normalized,
      ),
    ) as Record<number, string>

    // Убираем участие и цвет (ищем ключ подтверждения по нормализованному имени).
    const nextConfirmed = new Set<string>()
    for (const c of confirmedTeamNames.value) {
      if (normalizeTeamName(c) !== normalized) nextConfirmed.add(c)
    }
    confirmedTeamNames.value = nextConfirmed

    const nextColors: Record<string, number> = {}
    for (const [k, v] of Object.entries(teamColors.value)) {
      const nk = normalizeTeamName(k)
      if (!nk || nk === normalized) continue
      nextColors[nk] = v
    }
    teamColors.value = nextColors

    // При удалении команды убираем её из списка авто-команд.
    const nextAuto = new Set(autoDistributedNames.value)
    nextAuto.delete(normalized)
    autoDistributedNames.value = nextAuto
  }

  return {
    newTeamNames,
    teamOptions,
    assignment,
    confirmedTeamNames,
    teamColors,
    newTeamInputForPlayer,
    newTeamName,
    openNewTeamInput,
    closeNewTeamInput,
    confirmNewTeam,
    setTeam,
    getTeam,
    addNewTeam,
    removeFromTeam,
    removeTeam,
    confirmTeam,
    unconfirmTeam,
    isTeamConfirmed,
    setTeamColor,
    getTeamColor,
    autoDistribute,
    autoDistributedNames,
  }
}
