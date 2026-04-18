<template>
  <!-- Simple10: Внешние ссылки — игроки, турнир, табло, инфо, ВК. -->
  <div id="summary-links" class="scroll-mt-24 pt-4 pb-5 sm:px-6 print:break-inside-avoid">
    <p class="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">🔗 Полезные ссылки</p>
    <ul class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2">
      <li v-for="item in usefulLinks" :key="item.href" class="w-full min-w-0 sm:w-auto">
        <a
          :href="item.href"
          target="_blank"
          rel="noopener noreferrer"
          class="flex w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-white sm:inline-flex sm:w-auto sm:max-w-full sm:py-2 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/70"
        >
          <span class="shrink-0" aria-hidden="true">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const usefulLinks = [
  { href: 'https://football.pavelsolntsev.ru/', icon: '🌐', label: 'Игроки' },
  { href: 'https://football.pavelsolntsev.ru/tournament/', icon: '🏆', label: 'Команды' },
  { href: 'https://tournament.pavelsolntsev.ru/', icon: '📺', label: 'Итоги игр и live-режим' },
  { href: 'https://football.pavelsolntsev.ru/info', icon: 'ℹ️', label: 'Информация' },
  { href: 'https://vk.com/rmsfootball', icon: '📣', label: 'Группа ВКонтакте' },
] as const
</script>
