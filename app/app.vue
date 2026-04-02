<template>
  <!--
    #scroll-root — единственный scroll-контейнер приложения.
    body зафиксирован (position:fixed в nuxt.config.ts), поэтому rubber-band
    эффект на iOS/Chrome физически невозможен — тянуть нечего.
    Скролл разрешён только здесь: если контент короче — тихо, если длиннее — скроллим.
  -->
  <!-- h-full на NuxtLayout и slot пробрасывает высоту вниз по цепочке,
       чтобы min-h-full в дочерних компонентах работал корректно. -->
  <!-- transition-colors добавляет плавный переход при смене темы — без рывков. -->
  <!-- Светлая тема: bg-slate-50, text-slate-900. Тёмная тема: dark: классы. -->
  <div
    id="scroll-root"
    class="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 h-full transition-colors duration-200"
    style="position:fixed;inset:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:none;scrollbar-gutter:stable;"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '~/composables/useTheme'

const { initTheme } = useTheme()

// Инициализируем тему после монтирования — читаем localStorage и системные настройки.
// Это единственное место где вызываем initTheme, чтобы не дублировать логику.
onMounted(() => {
  initTheme()
})
</script>
