<template>
  <!-- Затемнённый фон. Нажатие на фон закрывает форму. -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-[env(safe-area-inset-bottom)]"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-2xl p-6 flex flex-col gap-5 max-h-[min(80vh,640px)] overflow-auto">

      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">Вход для администратора</h2>
        <!-- Кнопка закрытия: 44×44px тач-зона -->
        <button
          type="button"
          class="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 active:bg-slate-200 dark:active:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          aria-label="Закрыть"
          @click="$emit('close')"
        >
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>

      <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        Введите пароль администратора. При первом входе он станет мастер-паролем.
      </p>

      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <div class="flex flex-col gap-2">
          <label for="admin-password" class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Пароль
          </label>
          <!-- font-size: 16px — предотвращает автозум на iOS Safari при фокусе -->
          <input
            id="admin-password"
            v-model="password"
            type="password"
            placeholder="Введите пароль..."
            autocomplete="current-password"
            :disabled="isLoading"
            class="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 px-4 py-3 text-base text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors focus:border-emerald-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:opacity-50"
          />
        </div>

        <p v-if="errorMessage" role="alert" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {{ errorMessage }}
        </p>

        <!-- Кнопка входа: высота 48px — удобно тапать -->
        <AtomsPrimaryButton
          native-type="submit"
          size="block"
          :disabled="isLoading || !password"
        >
          {{ isLoading ? 'Проверяем...' : 'Войти' }}
        </AtomsPrimaryButton>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAdminAuth } from '~/composables/useAdminAuth'

const emit = defineEmits<{ close: [] }>()

const { login } = useAdminAuth()

const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  if (!password.value || isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''

  const result = await login(password.value)

  isLoading.value = false

  if (result.ok) {
    emit('close')
  } else {
    errorMessage.value = result.error ?? 'Ошибка входа'
    password.value = ''
  }
}
</script>
