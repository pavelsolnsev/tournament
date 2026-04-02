// Composable для работы с пожеланиями пользователей.
// Управляет отправкой нового пожелания и загрузкой списка для администратора.
import { useQuery } from '@tanstack/vue-query'

export interface FeedbackItem {
  id: number
  text: string
  created_at: string
}

// Глобальное состояние модального окна — виден ли попап с формой.
const isOpen = ref(false)

export function useFeedbackModal() {
  // Открывает форму пожеланий.
  function openModal() { isOpen.value = true }
  // Закрывает форму пожеланий.
  function closeModal() { isOpen.value = false }

  return { isOpen: readonly(isOpen), openModal, closeModal }
}

export function useFeedbackSubmit() {
  // Текст пожелания, которое вводит пользователь.
  const text = ref('')
  // Показываем состояние отправки и ошибку.
  const loading = ref(false)
  const error = ref<string | null>(null)
  const success = ref(false)

  // Отправляет пожелание на сервер.
  async function submit() {
    if (!text.value.trim()) return
    loading.value = true
    error.value = null
    success.value = false
    try {
      await $fetch('/api/feedback', { method: 'POST', body: { text: text.value.trim() } })
      success.value = true
      text.value = ''
    } catch {
      error.value = 'Не удалось отправить. Попробуй ещё раз.'
    } finally {
      loading.value = false
    }
  }

  return { text, loading, error, success, submit }
}

export function useFeedbackAdmin() {
  // Запрашиваем список пожеланий с сервера (только для администратора).
  // Этот composable используется только на клиенте в admin-режиме, поэтому SSR пропускаем.
  const query = useQuery({
    queryKey: ['feedback-admin'],
    queryFn: () => $fetch<FeedbackItem[]>('/api/feedback'),
    // Не запускаем на сервере — список пожеланий нужен только клиентскому адм. интерфейсу.
    enabled: import.meta.client,
  })

  // Состояние удаления — идёт ли очистка прямо сейчас.
  const clearing = ref(false)
  const clearError = ref<string | null>(null)

  // Удаляет все пожелания и обновляет список.
  async function clearAll() {
    clearing.value = true
    clearError.value = null
    try {
      await $fetch('/api/feedback', { method: 'DELETE' })
      // Обновляем кеш запроса, чтобы список стал пустым.
      await query.refetch()
    } catch {
      clearError.value = 'Не удалось очистить историю.'
    } finally {
      clearing.value = false
    }
  }

  return {
    items: query.data,
    isLoading: query.isLoading,
    clearing,
    clearError,
    clearAll,
    query,
  }
}
