<template>
  <!-- Затемнённый фон — закрывается кликом снаружи. -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <!-- На телефоне и на десктопе окно по центру экрана (раньше снизу было только на узком экране). -->
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        @click.self="closeModal"
      >
        <!-- Полупрозрачный фон — визуально отделяет модальное окно от контента. -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" @click="closeModal" />

        <!-- Само модальное окно — карточка с формой. -->
        <div
          class="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
          @click.stop
        >
          <!-- Заголовок и кнопка закрытия. -->
          <div class="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2
                id="feedback-modal-title"
                class="text-lg font-semibold text-slate-800 dark:text-slate-100"
              >
                Пожелания и идеи
              </h2>
              <p class="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                Расскажи, что хотел бы улучшить на сайте
              </p>
            </div>
            <!-- Кнопка закрытия в углу. -->
            <button
              type="button"
              aria-label="Закрыть"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              @click="closeModal"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Если сообщение уже успешно отправлено — показываем благодарность. -->
          <div
            v-if="success"
            class="flex flex-col items-center gap-3 py-4 text-center"
          >
            <span class="text-4xl" aria-hidden="true">🙌</span>
            <p class="text-base font-semibold text-emerald-700 dark:text-emerald-300">Спасибо!</p>
            <p class="text-sm text-slate-600 dark:text-slate-400">Твоё пожелание отправлено.</p>
            <button
              type="button"
              class="mt-2 inline-flex h-10 items-center rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-5 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              @click="closeModal"
            >
              Закрыть
            </button>
          </div>

          <!-- Форма ввода пожелания — видна, пока не отправлено. -->
          <form
            v-else
            class="flex flex-col gap-4"
            @submit.prevent="submit"
          >
            <!-- Поле ввода текста пожелания. -->
            <div class="flex flex-col gap-1.5">
              <label
                for="feedback-text"
                class="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Твоя идея
              </label>
              <textarea
                id="feedback-text"
                v-model="text"
                :maxlength="500"
                rows="4"
                placeholder="Напиши, что хочешь улучшить или добавить…"
                class="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-emerald-500"
              />
              <!-- Счётчик символов справа внизу. -->
              <p class="self-end text-xs text-slate-600 dark:text-slate-500">
                {{ text.length }}/500
              </p>
            </div>

            <!-- Ошибка отправки — показываем, если что-то пошло не так. -->
            <p
              v-if="error"
              class="text-sm text-red-600 dark:text-red-400"
            >
              {{ error }}
            </p>

            <!-- Кнопки: отмена и отправить. -->
            <div class="flex gap-2 justify-end">
              <button
                type="button"
                class="inline-flex h-10 items-center rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent px-4 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40"
                @click="closeModal"
              >
                Отмена
              </button>
              <button
                type="submit"
                :disabled="loading || !text.trim()"
                class="inline-flex h-10 items-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 active:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <!-- Спиннер во время отправки. -->
                <span v-if="loading" class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
                {{ loading ? 'Отправляем…' : 'Отправить' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useFeedbackModal, useFeedbackSubmit } from '~/composables/useFeedback'

// Берём состояние открытия/закрытия из composable.
const { isOpen, closeModal } = useFeedbackModal()

// Берём форму отправки пожелания из composable.
const { text, loading, error, success, submit } = useFeedbackSubmit()

// При закрытии сбрасываем состояние успеха, чтобы в следующий раз форма снова была чистой.
watch(isOpen, (val) => {
  if (!val) {
    setTimeout(() => {
      success.value = false
      error.value = null
    }, 300)
  }
})
</script>
