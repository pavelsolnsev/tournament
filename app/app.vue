<template>
  <!-- Если на клиенте поймали критическую ошибку — показываем текст вместо «вечного фона». -->
  <div
    v-if="faultMessage"
    class="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-slate-100 px-6 text-center dark:bg-slate-900"
    role="alert"
  >
    <h1 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
      Страница не загрузилась
    </h1>
    <!-- Технический текст только в dev — зрителю достаточно заголовка и кнопки. -->
    <p
      v-if="showFaultDetails && faultMessage"
      class="max-w-md break-words text-left text-xs text-slate-500 dark:text-slate-400"
    >
      {{ faultMessage }}
    </p>
    <button
      type="button"
      class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      @click="reloadPage"
    >
      Обновить
    </button>
  </div>
  <!--
    #scroll-root — единственный scroll-контейнер приложения.
    body зафиксирован (position:fixed в nuxt.config.ts), поэтому rubber-band
    эффект на iOS/Chrome физически невозможен — тянуть нечего.
    Скролл разрешён только здесь: если контент короче — тихо, если длиннее — скроллим.
  -->
  <!-- h-full на NuxtLayout и slot пробрасывает высоту вниз по цепочке,
       чтобы min-h-full в дочерних компонентах работал корректно. -->
  <!-- transition-colors добавляет плавный переход при смене темы — без рывков. -->
  <!-- Светлая тема: холст slate-100 (палитра смягчена в tailwind.config), текст slate-900. Тёмная: dark:. -->
  <div
    v-else
    id="scroll-root"
    class="scroll-smooth touch-pan-y bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100 h-full transition-colors duration-200"
    style="position:fixed;inset:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:none;scrollbar-gutter:stable;touch-action:pan-y;-webkit-overflow-scrolling:touch;"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { useAppClientFault } from '~/composables/useAppClientFault'
import { useTheme } from '~/composables/useTheme'

const { initTheme } = useTheme()
const { faultMessage } = useAppClientFault()
// В шаблоне нельзя писать import.meta — парсер Vue ругается; выносим флаг сюда.
const showFaultDetails = import.meta.dev

// Полная перезагрузка — самый надёжный способ после сбоя чанка или состояния Vue.
function reloadPage() {
  window.location.reload()
}

// Инициализируем тему после монтирования — читаем localStorage и системные настройки.
// Это единственное место где вызываем initTheme, чтобы не дублировать логику.
onMounted(() => {
  initTheme()
})
</script>
