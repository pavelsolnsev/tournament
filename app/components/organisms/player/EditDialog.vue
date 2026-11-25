<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      aria-labelledby="edit-player-title"
      aria-modal="true"
      class="fixed inset-0 z-50 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      @cancel.prevent="close"
    >
      <form class="space-y-4 p-4 sm:p-6" @submit.prevent="save">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <h2 id="edit-player-title" class="text-xl font-bold">Редактировать игрока</h2>
            <p class="break-words text-sm text-slate-600 dark:text-slate-300">{{ player.name }} · ID {{ player.id }}</p>
          </div>
          <button type="button" class="h-11 w-11 shrink-0 rounded-lg text-xl hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Закрыть редактор" :disabled="saving" @click="close">×</button>
        </div>
        <p v-if="loading" role="status">Загружаем данные игрока…</p>
        <template v-if="original">
          <fieldset v-for="group in playerEditGroups" :key="group.title" class="min-w-0 border-t border-slate-200 pt-3 dark:border-slate-700" :disabled="saving">
            <legend class="pr-2 text-sm font-bold">{{ group.title }}</legend>
            <div class="grid grid-cols-2 gap-3">
              <template v-for="field in group.fields" :key="field.key">
                <label v-if="original[field.key] !== undefined" class="min-w-0 space-y-1 text-sm" :class="{ 'col-span-2': field.kind === 'photo' || field.kind === 'vk' }">
                  <span class="block">{{ field.label }}</span>
                  <select v-if="field.kind === 'trend'" v-model="draft[field.key]" :class="inputClass">
                    <option v-if="original[field.key] === ''" value="">Не задана</option>
                    <option value="-1">↓ Снижение</option><option value="0">Без изменения</option><option value="1">↑ Рост</option>
                  </select>
                  <input
                    v-else
                    :value="draft[field.key]"
                    :class="inputClass"
                    :type="field.kind === 'rating' || field.kind === 'count' ? 'number' : 'text'"
                    :inputmode="field.kind === 'vk' || field.kind === 'count' ? 'numeric' : field.kind === 'rating' ? 'decimal' : 'text'"
                    :min="field.kind === 'count' || field.kind === 'rating' ? 0 : undefined"
                    :max="field.kind === 'rating' ? 200 : undefined"
                    :step="field.kind === 'rating' ? 0.1 : undefined"
                    :required="field.key === 'name'"
                    :list="field.kind === 'photo' ? 'edit-player-photos' : undefined"
                    :disabled="field.kind === 'photo' && Boolean(photoUpload)"
                    @input="draft[field.key] = ($event.target as HTMLInputElement).value"
                  />
                  <span v-if="field.kind === 'vk'" class="block text-xs text-slate-600 dark:text-slate-400">Числовой ID связывает игрока с ботом. Очистите поле, чтобы снять привязку.</span>
                  <span v-if="field.kind === 'photo'" class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <AtomsPlayerAvatar :photo="draft.photo" :fallback-name="draft.name || player.name" size="md" />
                    Выберите файл из фотографий сайта или очистите поле для показа инициала.
                  </span>
                </label>
              </template>
              <MoleculesPlayerPhotoUpload
                v-if="group.fields.some(field => field.key === 'photo') && original.photo !== undefined"
                class="col-span-2"
                @change="photoUpload = $event"
                @pending="photoPending = $event"
              />
            </div>
          </fieldset>
          <datalist id="edit-player-photos">
            <option v-for="photo in photos" :key="photo" :value="photo" />
          </datalist>
        </template>
        <p v-if="error" role="alert" class="rounded-lg bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{{ error }}</p>
        <div class="flex flex-wrap justify-end gap-2">
          <AtomsPrimaryButton variant="muted" size="md" :disabled="saving" @click="close">Отмена</AtomsPrimaryButton>
          <AtomsPrimaryButton v-if="!loading && !original" size="md" @click="loadPlayer">Повторить</AtomsPrimaryButton>
          <AtomsPrimaryButton v-if="original" native-type="submit" size="md" :disabled="saving || photoPending || (!changedFields.length && !photoUpload)">
            {{ saving ? 'Сохраняем…' : 'Сохранить' }}
          </AtomsPrimaryButton>
        </div>
      </form>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import type { Player } from '~/types/tournament'
import { playerEditGroups, type PlayerEditValues } from '~/utils/playerEditFields'

const props = defineProps<{ player: Player }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const original = ref<PlayerEditValues | null>(null)
const draft = ref<PlayerEditValues>({})
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const photoUpload = ref<string | null>(null)
const photoPending = ref(false)
const inputClass = 'block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white'
const photos = Object.keys(import.meta.glob('../../../../public/player-photos/*.{webp,png,jpg,jpeg,gif,avif}', { query: '?url', import: 'default' }))
  .map(path => path.slice(path.lastIndexOf('/') + 1)).sort()
const changedFields = computed(() => {
  const keys = Object.keys(draft.value) as (keyof PlayerEditValues)[]
  return keys.filter(key => draft.value[key] !== original.value?.[key])
})

function close() {
  if (saving.value) return
  dialog.value?.close?.()
  emit('close')
}

function errorMessage(err: unknown, fallback: string) {
  return (err as { data?: { data?: { message?: string } } })?.data?.data?.message || fallback
}

async function loadPlayer() {
  error.value = ''
  loading.value = true
  try {
    original.value = await $fetch<PlayerEditValues>(`/api/players/${props.player.id}`)
    draft.value = { ...original.value }
  } catch (err) {
    error.value = errorMessage(err, 'Не удалось загрузить данные игрока.')
  } finally {
    loading.value = false
  }
}

async function save() {
  if (saving.value || photoPending.value || !original.value || (!changedFields.value.length && !photoUpload.value)) return
  saving.value = true
  error.value = ''
  try {
    const changes: PlayerEditValues = {}
    const previous: PlayerEditValues = {}
    for (const key of changedFields.value) {
      changes[key] = draft.value[key]
      previous[key] = original.value[key]
    }
    if (photoUpload.value) {
      changes.photo = ''
      previous.photo = original.value.photo
    }
    await $fetch(`/api/players/${props.player.id}`, {
      method: 'PATCH',
      body: { changes, original: previous, photoUpload: photoUpload.value ?? undefined },
    })
    emit('saved')
    saving.value = false
    close()
  } catch (err) {
    error.value = errorMessage(err, 'Не удалось сохранить изменения. Проверьте данные и попробуйте ещё раз.')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (dialog.value?.showModal) dialog.value.showModal()
  else dialog.value?.setAttribute('open', '')
  void loadPlayer()
})
</script>
