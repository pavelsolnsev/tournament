<template>
  <div class="h-full flex flex-col items-center justify-center py-4 sm:py-8">
    <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-50 mb-6 md:mb-8 text-center">
      Турнир
    </h1>

    <form
      class="w-full max-w-md space-y-5"
      @submit.prevent="goToAddPlayers"
    >
      <div>
        <label for="tournament-name" class="mb-1.5 block text-sm font-medium text-slate-300">
          Название турнира
        </label>
        <input
          id="tournament-name"
          v-model="tournamentName"
          type="text"
          placeholder="Например: Кубок осени"
          class="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
      </div>

      <div>
        <label for="tournament-date" class="mb-1.5 block text-sm font-medium text-slate-300">
          Дата турнира
        </label>
        <input
          id="tournament-date"
          v-model="tournamentDate"
          type="date"
          class="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
      </div>

      <button
        type="submit"
        class="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 sm:w-auto sm:min-w-[200px]"
      >
        Добавим игроков на турнир
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'tournament-form' })

const tournamentName = ref('')
const tournamentDate = ref('')

const router = useRouter()

function goToAddPlayers() {
  const query: Record<string, string> = {}
  if (tournamentName.value) query.tournamentName = tournamentName.value
  if (tournamentDate.value) query.tournamentDate = tournamentDate.value
  router.push({ path: '/tournament/players', query })
}
</script>
