// Хранилище «кто недавно стучался» — в памяти процесса (один инстанс сервера = один счётчик).
// Ключ — случайный id из cookie у клиента, значение — время последнего POST /presence/ping.

const g = globalThis as typeof globalThis & { __footballPresenceMap?: Map<string, number> }

function presenceMap(): Map<string, number> {
  if (!g.__footballPresenceMap) {
    g.__footballPresenceMap = new Map()
  }
  return g.__footballPresenceMap
}

// Запоминаем визит: вызывается при каждом пинге с клиента.
export function touchPresence(visitorId: string) {
  presenceMap().set(visitorId, Date.now())
}

// Считаем живых: пинг был не дольше maxAgeMs назад. Старые ключи выкидываем, чтобы Map не росла бесконечно.
export function countActiveVisitors(maxAgeMs: number, pruneOlderMs: number) {
  const map = presenceMap()
  const now = Date.now()
  for (const [id, at] of [...map.entries()]) {
    if (now - at > pruneOlderMs) {
      map.delete(id)
    }
  }
  let n = 0
  for (const at of map.values()) {
    if (now - at <= maxAgeMs) n += 1
  }
  return n
}
