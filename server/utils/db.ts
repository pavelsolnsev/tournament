import mysql from 'mysql2/promise'

function getDbConfig() {
  return {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4' as const,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    connectTimeout: 10000,
    // Keepalive — TCP пингует сервер, чтобы MySQL не разрывал простаивающие соединения.
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    // Закрываем соединение в пуле после 55 сек простоя (MySQL по умолчанию убивает через 60 сек).
    // Это предотвращает "packets out of order" и "connection lost" при следующем запросе.
    idleTimeout: 55000,
  }
}

let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(getDbConfig())
  }
  return pool
}

// Сбрасывает пул соединений — следующий вызов getPool() создаст новый.
function resetPool(): void {
  pool = null
}

// Коды ошибок, при которых соединение считается разорванным и нужен retry.
// ECONNRESET и PROTOCOL_CONNECTION_LOST — обрыв TCP.
// ER_CLIENT_INTERACTION_TIMEOUT — сервер закрыл простаивающее соединение.
// PROTOCOL_PACKETS_OUT_OF_ORDER — MySQL прислал пакеты не в том порядке (обычно после разрыва).
const RECONNECT_CODES = new Set([
  'ER_CLIENT_INTERACTION_TIMEOUT',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_PACKETS_OUT_OF_ORDER',
  'ECONNRESET',
])

// Выполняет SQL-запрос с одной повторной попыткой при обрыве соединения.
// MySQL может разорвать простаивающее соединение — в этом случае пересоздаём пул и пробуем снова.
export async function queryWithRetry<T>(
  sql: string,
  params?: unknown[],
): Promise<T> {
  try {
    const [rows] = await getPool().query(sql, params)
    return rows as T
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    if (code && RECONNECT_CODES.has(code)) {
      console.warn('[db] Connection lost, recreating pool and retrying...')
      // Сбрасываем пул через функцию — не трогаем константу локальной области.
      resetPool()
      const [rows] = await getPool().query(sql, params)
      return rows as T
    }
    throw err
  }
}
