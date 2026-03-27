<template>
  <!-- Затемнённый фон модального окна. Нажатие на фон закрывает форму. -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-sm rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl p-6 flex flex-col gap-5">

      <!-- Заголовок модального окна. -->
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-slate-100">Вход для администратора</h2>
        <!-- Кнопка закрытия крестиком. -->
        <button
          type="button"
          class="text-slate-400 hover:text-slate-200 transition text-xl leading-none focus:outline-none"
          aria-label="Закрыть"
          @click="$emit('close')"
        >
          ×
        </button>
      </div>

      <!-- Пояснение для пользователя. -->
      <p class="text-sm text-slate-400">
        Введите пароль администратора, чтобы получить доступ к управлению турниром.
        При первом входе введённый пароль станет мастер-паролем.
      </p>

      <!-- Форма ввода пароля. -->
      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <div class="flex flex-col gap-1.5">
          <label for="admin-password" class="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Пароль
          </label>
          <!-- Поле пароля: type=password чтобы символы скрыты. -->
          <input
            id="admin-password"
            v-model="password"
            type="password"
            placeholder="Введите пароль..."
            autocomplete="current-password"
            :disabled="isLoading"
            class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:opacity-50"
          />
        </div>

        <!-- Сообщение об ошибке, если пароль неверный. -->
        <p v-if="errorMessage" class="text-sm text-red-400">{{ errorMessage }}</p>

        <!-- Кнопка входа. -->
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

// Введённый пароль.
const password = ref('')
// Флаг загрузки — пока идёт запрос.
const isLoading = ref(false)
// Сообщение об ошибке при неверном пароле.
const errorMessage = ref('')

async function handleSubmit() {
  if (!password.value || isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''

  const result = await login(password.value)

  isLoading.value = false

  if (result.ok) {
    // isAdmin.value = true уже выставлен в useAdminAuth — страница переключится реактивно.
    emit('close')
  } else {
    errorMessage.value = result.error ?? 'Ошибка входа'
    password.value = ''
  }
}
</script>
