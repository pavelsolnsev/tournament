<template>
  <!-- Панель пожеланий: раскрывающийся блок — заголовок всегда виден, список внутри. -->
  <section
    class="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 dark:border-slate-700/50 dark:bg-slate-800/30"
  >
    <!-- Строка заголовка: клик раскрывает или сворачивает содержимое. -->
    <!-- Без py на обёртке — высоту и паддинги задаёт кнопка, чтобы hover покрывал всю строку слева. -->
    <div class="flex min-h-11 items-stretch gap-2 border-b border-slate-200/80 dark:border-slate-700/50">
      <button
        type="button"
        class="flex min-h-11 min-w-0 flex-1 items-center gap-2 px-3 text-left transition-colors hover:bg-slate-200/70 active:bg-slate-200/90 dark:hover:bg-slate-700/50 dark:active:bg-slate-700/70 sm:px-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/50"
        :aria-expanded="expanded"
        aria-controls="feedback-admin-panel"
        id="feedback-admin-heading"
        @click="expanded = !expanded"
      >
        <!-- Шеврон: поворачивается, когда блок открыт. -->
        <svg
          class="h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 dark:text-slate-400"
          :class="expanded && 'rotate-180'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
        <span class="min-w-0">
          <span class="text-base font-semibold text-slate-800 dark:text-slate-100">
            Пожелания пользователей
          </span>
          <!-- Счётчик пожеланий рядом с заголовком. -->
          <span
            v-if="items && items.length > 0"
            class="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          >
            {{ items.length }}
          </span>
        </span>
      </button>

      <!-- Очистка только когда блок раскрыт и есть записи — stopPropagation чтобы не схлопнуть панель. -->
      <button
        v-if="expanded && items && items.length > 0"
        type="button"
        class="inline-flex shrink-0 items-center gap-1.5 self-stretch rounded-xl border border-red-300/60 dark:border-red-700/50 bg-red-50 dark:bg-red-900/20 px-3 text-xs font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 sm:mr-3"
        @click.stop="showConfirm = true"
      >
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
        </svg>
        Очистить историю
      </button>
    </div>

    <!-- Содержимое: показываем только в раскрытом состоянии. -->
    <div
      v-show="expanded"
      id="feedback-admin-panel"
      class="flex flex-col gap-4 p-3 sm:p-4"
      role="region"
      aria-labelledby="feedback-admin-heading"
    >
      <!-- Подтверждение перед очисткой — рендерим только когда оно открыто. -->
      <MoleculesDangerConfirmInline
        v-if="showConfirm"
        :open="showConfirm"
        :seconds-left="confirmSeconds"
        :busy="clearing"
        title="Удалить все пожелания?"
        subtitle="Это действие нельзя отменить."
        cancel-text="Отмена"
        confirm-text="Удалить всё"
        busy-text="Удаляем…"
        aria-label="Подтверждение удаления пожеланий"
        @cancel="cancelClear"
        @confirm="confirmClear"
      />

      <!-- Ошибка очистки — если что-то пошло не так. -->
      <p v-if="clearError" class="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400">
        {{ clearError }}
      </p>

      <!-- Загрузка — спиннер пока данные ещё не пришли. -->
      <div v-if="isLoading" class="flex items-center gap-3 py-2 text-sm text-slate-400 dark:text-slate-500">
        <span class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-emerald-500" aria-hidden="true" />
        Загружаем пожелания…
      </div>

      <!-- Пустое состояние — ещё никто ничего не написал. -->
      <AtomsEmptyStateBox v-else-if="!items || items.length === 0">
        Пожеланий пока нет
      </AtomsEmptyStateBox>

      <!-- Список пожеланий — каждое в своей карточке. -->
      <ul v-else class="flex flex-col gap-2">
        <li
          v-for="item in items"
          :key="item.id"
          class="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700/50 dark:bg-slate-800/50"
        >
          <p class="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words">
            {{ item.text }}
          </p>
          <p class="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
            {{ formatDate(item.created_at) }}
          </p>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useFeedbackAdmin } from '~/composables/useFeedback'

// Получаем список пожеланий и методы управления из composable.
// Запрос выполняется только на клиенте — suspense не нужен, используем isLoading.
const { items, isLoading, clearing, clearError, clearAll } = useFeedbackAdmin()

// Раскрыт ли блок со списком — по умолчанию свёрнут, чтобы не занимать место на шаге «Игроки».
const expanded = ref(false)

// Показывать ли подтверждение удаления.
const showConfirm = ref(false)
// Обратный отсчёт перед разблокировкой кнопки подтверждения.
const confirmSeconds = ref(3)
let countdownTimer: ReturnType<typeof setInterval> | null = null

// Запускает обратный отсчёт и открывает подтверждение удаления.
function startCountdown() {
  confirmSeconds.value = 3
  countdownTimer = setInterval(() => {
    confirmSeconds.value -= 1
    if (confirmSeconds.value <= 0 && countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

// Показываем подтверждение и запускаем отсчёт.
watch(showConfirm, (val) => {
  if (val) startCountdown()
  else {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
    confirmSeconds.value = 3
  }
})

// Отменяем удаление — закрываем подтверждение.
function cancelClear() {
  showConfirm.value = false
}

// Выполняем очистку и закрываем подтверждение.
async function confirmClear() {
  await clearAll()
  showConfirm.value = false
}

// Форматирует дату создания пожелания в читаемый вид.
function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('ru', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}
</script>
