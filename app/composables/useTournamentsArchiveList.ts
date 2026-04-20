import type { Ref } from 'vue'
import { resolveTeamColorIndex } from '~/utils/teamNames'
import { useTeamColors } from '~/composables/useTeamColors'
import type { ArchiveListRow } from '~/composables/tournamentsArchiveTypes'

/** Логика списка архива турниров — вынесена из pages/tournaments/index.vue. */
export function useTournamentsArchiveList(tournaments: Ref<ArchiveListRow[] | null | undefined>) {
  const { getMarkerByIndex } = useTeamColors()

  const localTournaments = computed(() => tournaments.value ?? [])

  const deletingId = ref<string | null>(null)
  const savingDateId = ref<string | null>(null)

  function archiveCardTitle(t: {
    venue_label?: string
    format_label?: string
    tournament_name?: string
  }): string {
    const venue = (t.venue_label ?? '').trim()
    const format = (t.format_label ?? '').trim()
    if (venue && format) return `${venue} · ${format}`
    if (venue) return venue
    if (format) return format
    return (t.tournament_name ?? '').trim() || 'Турнир'
  }

  function archiveCardAriaLabel(t: ArchiveListRow): string {
    const base = archiveCardTitle(t)
    const parts = [base]
    const champ = championTeamLabel(t)
    if (champ) parts.push(`Чемпион: ${champ}`)
    const mvp = mvpPlayerLabel(t)
    if (mvp) {
      const mvpTeam = mvpTeamLabel(t)
      parts.push(mvpTeam ? `MVP: ${mvp}, команда ${mvpTeam}` : `MVP: ${mvp}`)
    }
    return parts.join('. ')
  }

  function championTeamLabel(t: ArchiveListRow): string {
    return (t.champion_team_name ?? '').trim()
  }

  function championMarker(teamName: string): string {
    const idx = resolveTeamColorIndex(teamName, null, 0)
    return getMarkerByIndex(idx)
  }

  function mvpPlayerLabel(t: ArchiveListRow): string {
    return (t.mvp_player_name ?? '').trim()
  }

  function mvpTeamLabel(t: ArchiveListRow): string {
    return (t.mvp_team_name ?? '').trim()
  }

  function archiveDateInputValue(raw: string | undefined): string {
    const t = (raw ?? '').trim().slice(0, 10)
    return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : ''
  }

  async function openArchiveDatePickerUi(host: HTMLElement) {
    const input = host.querySelector('input[data-archive-date-input]') as HTMLInputElement | null
    if (!input || input.disabled) return
    if (typeof input.showPicker === 'function') {
      try {
        await input.showPicker()
      } catch {
        input.click()
      }
    } else {
      input.click()
    }
  }

  async function onArchiveDateInputChange(row: ArchiveListRow, ev: Event) {
    const el = ev.target as HTMLInputElement
    const next = el.value
    const prev = archiveDateInputValue(row.tournament_date)
    if (!next || next === prev) return

    savingDateId.value = row.id
    try {
      await $fetch(`/api/tournaments/${row.id}`, {
        method: 'PATCH',
        body: { tournament_date: next },
      })
      if (tournaments.value) {
        const found = tournaments.value.find((t) => t.id === row.id)
        if (found) found.tournament_date = next
      }
    } catch {
      el.value = prev
      alert('Не удалось сохранить дату. Попробуйте ещё раз.')
    } finally {
      savingDateId.value = null
    }
  }

  async function deleteTournament(id: string) {
    const row = localTournaments.value.find(entry => entry.id === id)
    const name = row ? archiveCardTitle(row) : 'этот турнир'
    if (!confirm(`Удалить «${name}» из архива? Это действие нельзя отменить.`)) return

    deletingId.value = id
    try {
      await $fetch(`/api/tournaments/${id}`, { method: 'DELETE' })
      if (tournaments.value) {
        tournaments.value = tournaments.value.filter(t => t.id !== id)
      }
    } catch {
      alert('Не удалось удалить турнир. Попробуйте ещё раз.')
    } finally {
      deletingId.value = null
    }
  }

  function formatDate(dateStr: string): string {
    const t = (dateStr ?? '').trim().slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return ''
    const y = Number(t.slice(0, 4))
    const m = Number(t.slice(5, 7))
    const d = Number(t.slice(8, 10))
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return {
    localTournaments,
    deletingId,
    savingDateId,
    archiveCardTitle,
    archiveCardAriaLabel,
    championTeamLabel,
    championMarker,
    mvpPlayerLabel,
    mvpTeamLabel,
    archiveDateInputValue,
    openArchiveDatePickerUi,
    onArchiveDateInputChange,
    deleteTournament,
    formatDate,
  }
}
