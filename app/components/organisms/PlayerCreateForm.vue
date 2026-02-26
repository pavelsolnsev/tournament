<template>
  <section class="mb-6 rounded-xl bg-slate-800/50 p-2 sm:p-4 sm:p-5">
    <h2 class="text-lg font-semibold text-slate-200 mb-3">
      Добавить нового игрока
    </h2>
    <form
      class="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4"
      @submit.prevent="createPlayer"
    >
      <div class="flex-1 min-w-0">
        <label for="new-name" class="mb-1 block text-sm text-slate-400">Имя</label>
        <input
          id="new-name"
          v-model="newName"
          type="text"
          placeholder="Имя игрока"
          class="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
      </div>
      <div class="flex-1 min-w-0">
        <label for="new-username" class="mb-1 block text-sm text-slate-400">Username (необязательно)</label>
        <input
          id="new-username"
          v-model="newUsername"
          type="text"
          placeholder="@username"
          class="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
      </div>
      <button
        type="submit"
        :disabled="creating"
        class="shrink-0 rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-900 transition hover:bg-emerald-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        {{ creating ? 'Добавляем…' : 'Добавить игрока' }}
      </button>
    </form>
    <p v-if="createError" class="mt-2 text-sm text-red-400">
      {{ createError }}
    </p>
  </section>
</template>

<script setup lang="ts">
const newName = ref('')
const newUsername = ref('')
const creating = ref(false)
const createError = ref('')

const emit = defineEmits<{ created: [] }>()

async function createPlayer() {
  const name = newName.value.trim()
  if (!name) {
    createError.value = 'Введите имя'
    return
  }
  createError.value = ''
  creating.value = true
  try {
    await $fetch('/api/players', {
      method: 'POST',
      body: { name, username: newUsername.value.trim() || undefined },
    })
    newName.value = ''
    newUsername.value = ''
    emit('created')
  } catch {
    createError.value = 'Не удалось добавить игрока'
  } finally {
    creating.value = false
  }
}
</script>
