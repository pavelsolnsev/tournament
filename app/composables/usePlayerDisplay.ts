// Этот файл: util/composable для красивого отображения игрока в UI.
// Он приводит username к нормальному виду, чтобы список выглядел единообразно.
import type { Player } from '~/types/tournament'

export function usePlayerDisplay() {
  function displayPlayerLabel(p: Player) {
    const cleaned = p.username?.replace(/^@+/, '').trim()
    if (!cleaned || cleaned.toLowerCase() === 'unknown') {
      return p.name
    }
    return cleaned
  }

  return {
    displayPlayerLabel,
  }
}

