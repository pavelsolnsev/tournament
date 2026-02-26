<template>
  <div class="min-h-screen bg-slate-900 text-slate-100">
    <main class="mx-auto flex max-w-4xl flex-col gap-4 px-2 py-4 sm:px-4 sm:py-8">
      <OrganismsBreadcrumbs class="mb-1" />
      <section class="rounded-xl bg-slate-900/70 py-2 sm:py-4">
        <slot />
      </section>
    </main>
  </div>
</template>
