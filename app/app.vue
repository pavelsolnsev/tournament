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
  <!-- Светлая тема: холст slate-100 (палитра смягчена в tailwind.config), текст slate-900. Тёмная: dark:. -->
  <div
    id="scroll-root"
    class="touch-pan-y bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100 h-full transition-colors duration-200"
    style="position:fixed;inset:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:none;scrollbar-gutter:stable;touch-action:pan-y;-webkit-overflow-scrolling:touch;"
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
