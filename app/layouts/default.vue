<template>
  <!-- overflow-y-auto убран — скролл нативный через body, не через вложенный контейнер. -->
  <!-- Светлая тема: белый фон. Тёмная: dark: классы. -->
  <div class="min-h-screen bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
    <main class="mx-auto flex max-w-4xl flex-col gap-4 px-2 py-4 sm:px-4 sm:py-8 min-h-full">
      <section class="rounded-xl bg-slate-100/70 py-2 sm:py-4 dark:bg-slate-900/70">
        <slot />
      </section>
    </main>
  </div>
</template>
