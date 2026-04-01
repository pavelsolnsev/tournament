<template>
  <!-- Скролл отдаём нативному body — overflow-y-scroll и overscroll-contain убраны,
       они блокировали колёсико мыши на десктопе и создавали двойные scroll-контейнеры. -->
  <div class="min-h-screen bg-slate-900 text-slate-100">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
