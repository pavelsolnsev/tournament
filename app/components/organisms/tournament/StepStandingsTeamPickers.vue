<!-- Компонент StepStandingsTeamPickers: выбор хозяев и гостей для текущего матча. -->
<template>
  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
    <div class="flex-1 min-w-0">
      <label for="home-team" class="mb-1 block text-xs font-medium text-slate-400">Хозяева</label>
      <select
        id="home-team"
        :value="homeTeam"
        class="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-100 ring-0 transition focus:border-emerald-500 focus:outline-none"
        @change="$emit('update:homeTeam', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">
          — Выберите команду —
        </option>
        <option
          v-for="name in teams"
          :key="name"
          :value="name"
          :disabled="name === awayTeam"
        >
          {{ name }}
        </option>
      </select>
    </div>

    <div class="flex-1 min-w-0">
      <label for="away-team" class="mb-1 block text-xs font-medium text-slate-400">Гости</label>
      <select
        id="away-team"
        :value="awayTeam"
        class="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-100 ring-0 transition focus:border-sky-500 focus:outline-none"
        @change="$emit('update:awayTeam', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">
          — Выберите команду —
        </option>
        <option
          v-for="name in teams"
          :key="name"
          :value="name"
          :disabled="name === homeTeam"
        >
          {{ name }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
// Этот блок только выбирает хозяев и гостей, без логики счёта.
defineProps<{
  teams: string[]
  homeTeam: string
  awayTeam: string
}>()

// Эти события нужны, чтобы родитель мог обновить выбранные команды.
defineEmits<{
  'update:homeTeam': [value: string]
  'update:awayTeam': [value: string]
}>()
</script>
