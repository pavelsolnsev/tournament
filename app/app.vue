<template>
  <!--
    #scroll-root — единственный scroll-контейнер приложения.
    body зафиксирован (position:fixed в nuxt.config.ts), поэтому rubber-band
    эффект на iOS/Chrome физически невозможен — тянуть нечего.
    Скролл разрешён только здесь: если контент короче — тихо, если длиннее — скроллим.
  -->
  <div
    id="scroll-root"
    class="bg-slate-900 text-slate-100"
    style="position:fixed;inset:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:none;"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
