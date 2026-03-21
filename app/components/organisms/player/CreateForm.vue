<!-- Компонент PlayerCreateForm: те же поля и кнопка, что в турнире, в чуть более крупном блоке. -->
<template>
  <AtomsTournamentPanel as="section" tone="raised" root-class="mb-6">
    <h2 class="mb-3 text-lg font-semibold text-slate-200">
      Добавить нового игрока
    </h2>
    <form
      class="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4"
      @submit.prevent="createPlayer"
    >
      <MoleculesFieldBlock id="new-name" label="Имя" label-size="sm" wrapper-class="flex-1">
        <AtomsTournamentTextInput
          id="new-name"
          v-model="newName"
          variant="field"
          size="md"
          placeholder="Имя игрока"
        />
      </MoleculesFieldBlock>
      <MoleculesFieldBlock id="new-username" label="Username (необязательно)" label-size="sm" wrapper-class="flex-1">
        <AtomsTournamentTextInput
          id="new-username"
          v-model="newUsername"
          variant="field"
          size="md"
          placeholder="@username"
        />
      </MoleculesFieldBlock>
      <AtomsPrimaryButton
        native-type="submit"
        size="md"
        :disabled="creating"
      >
        {{ creating ? 'Добавляем…' : 'Добавить игрока' }}
      </AtomsPrimaryButton>
    </form>
    <p v-if="createError" class="mt-2 text-sm text-red-400">
      {{ createError }}
    </p>
  </AtomsTournamentPanel>
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
