<!-- Компонент StepDetails: шаг ввода названия и даты турнира. -->
<template>
  <div>
    <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-50 text-center">
      Турнир
    </h1>
    <form
      class="w-full max-w-md mx-auto space-y-5"
      @submit.prevent="emit('next')"
    >
      <div>
        <label for="tournament-name" class="mb-1.5 block text-sm font-medium text-slate-300">
          Название турнира
        </label>
        <input
          id="tournament-name"
          :value="tournamentName"
          type="text"
          placeholder="Например: Кубок осени"
          class="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          @input="emit('update:tournamentName', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div>
        <label for="tournament-date" class="mb-1.5 block text-sm font-medium text-slate-300">
          Дата турнира
        </label>
        <input
          id="tournament-date"
          :value="tournamentDate"
          type="date"
          class="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 [&::-webkit-calendar-picker-indicator]:invert focus:border-emerald-500 focus:outline-none"
          @input="emit('update:tournamentDate', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <button
        type="submit"
        class="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400 focus:outline-none sm:w-auto sm:min-w-[200px]"
      >
        Добавим игроков на турнир
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  tournamentName: string
  tournamentDate: string
}>()

const emit = defineEmits<{
  'update:tournamentName': [value: string]
  'update:tournamentDate': [value: string]
  next: []
}>()
</script>

