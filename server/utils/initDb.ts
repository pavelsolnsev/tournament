import { queryWithRetry } from './db'

// Флаг инициализации — чтобы не запускать CREATE TABLE каждый запрос.
// Сбрасывается при потере соединения, чтобы пересоздать таблицы при следующем запросе.
let initialized = false

// Создаёт нужные таблицы в базе данных, если их ещё нет.
// Вызывается перед каждым API-обработчиком — повторно выполняется только при потере соединения.
export async function ensureTablesExist() {
  if (initialized) return

  try {
    // Таблица app_settings: хранит пароль администратора и другие настройки.
    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key_name VARCHAR(64) PRIMARY KEY,
        value TEXT NOT NULL
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)

    // Таблица app_state: хранит текущее состояние турнира (один ряд, key = 'tournament').
    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS app_state (
        key_name VARCHAR(64) PRIMARY KEY,
        value LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)

    // Таблица feedback: хранит пожелания и идеи от пользователей сайта.
    await queryWithRetry(`
      CREATE TABLE IF NOT EXISTS feedback (
        id BIGINT PRIMARY KEY,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `)

    // Помечаем как инициализированное только после успешного создания таблиц.
    initialized = true
  } catch (err) {
    // Не помечаем как инициализированное при ошибке — следующий запрос попробует снова.
    console.error('[db] Failed to ensure tables exist:', err)
    throw err
  }
}
