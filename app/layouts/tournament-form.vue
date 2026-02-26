<template>
  <div class="h-screen overflow-hidden bg-slate-900 text-slate-100 flex flex-col">
    <main class="flex-1 min-h-0 overflow-auto mx-auto w-full max-w-4xl flex flex-col gap-4 px-2 py-4 sm:px-4 sm:py-8">
      <OrganismsBreadcrumbs class="shrink-0 mb-1" />
      <section class="flex-1 min-h-0 flex flex-col rounded-xl bg-slate-900/70 py-2 sm:py-4">
        <slot />
      </section>
    </main>
  </div>
</template>
