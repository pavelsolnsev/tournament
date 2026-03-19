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

