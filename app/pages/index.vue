<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-2 sm:px-4 bg-gradient-to-b from-slate-900 via-slate-800/50 to-slate-900">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.15),transparent)] pointer-events-none" />

    <main class="relative z-10 text-center max-w-xl mx-auto">
      <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-3">
        Турниры
      </h1>
      <p class="text-slate-400 text-lg sm:text-xl mb-10">
        Организуйте турнир и управляйте им в одном месте
      </p>

      <NuxtLink
        to="/tournament"
        class="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold text-lg shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        Создать турнир
        <span class="text-xl" aria-hidden="true">→</span>
      </NuxtLink>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })
</script>
