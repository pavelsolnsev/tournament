<template>
  <!-- overflow-x-hidden оставляем только на уровне html/body через Tailwind config.
       Вложенные overflow-y-auto заменяем на нативный скролл страницы. -->
  <div class="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
    <main class="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-8">
      <section class="flex-1 min-h-0 flex flex-col rounded-xl bg-slate-900/70 py-2 sm:py-4">
        <slot />
      </section>
    </main>
  </div>
</template>
