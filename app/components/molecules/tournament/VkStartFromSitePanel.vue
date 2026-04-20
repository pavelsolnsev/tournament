<template>
  <div class="space-y-2">
    <p class="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">
      🧩 Создать матч в ВК
    </p>

    <p class="text-[11px] leading-snug text-slate-600 dark:text-slate-500">
      Выбери пресет или введи команду как в чате ВК (<strong>s tr</strong>, <strong>s prof</strong>).
      Список появится в беседе с указанным <strong>peer_id</strong> (или в уже привязанной беседе — см. ниже).
    </p>

    <div class="space-y-1.5">
      <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
        Peer ID беседы ВК
      </label>
      <input
        v-model="peerIdInput"
        class="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm text-slate-800 placeholder:text-slate-400
               focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-100 dark:placeholder:text-slate-500"
        :disabled="busy"
        placeholder="Например 2000000001"
        inputmode="numeric"
        autocomplete="off"
      >
      <p class="text-[11px] leading-snug text-slate-500 dark:text-slate-500">
        <span v-if="vkLinked && savedPeerId != null">
          Привязка есть: можно оставить поле пустым — уйдёт в ту же беседу (<strong class="font-mono">{{ savedPeerId }}</strong>).
        </span>
        <span v-else>
          Если чат ещё не привязывали к сайту — введи <strong>peer_id</strong> той беседы, где стоит бот (тот же id, что в ответах API / в настройках чата).
        </span>
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50
               focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-900/60"
        :disabled="busy"
        @click="commandText = 's tr'"
      >
        s tr
      </button>
      <button
        type="button"
        class="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50
               focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-900/60"
        :disabled="busy"
        @click="commandText = 's prof'"
      >
        s prof
      </button>
      <button
        type="button"
        class="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50
               focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-900/60"
        :disabled="busy"
        @click="commandText = 's test'"
      >
        s test
      </button>
    </div>

    <div class="space-y-1.5">
      <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
        Команда
      </label>
      <input
        v-model="commandText"
        class="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400
               focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-100 dark:placeholder:text-slate-500"
        :disabled="busy"
        placeholder="s tr"
        inputmode="text"
        autocomplete="off"
      >
    </div>

    <div v-if="error" class="rounded-lg bg-red-500/10 px-3 py-2 text-[11px] text-red-700 dark:text-red-300">
      {{ error }}
    </div>
    <div v-else-if="success" class="rounded-lg bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-800 dark:text-emerald-300">
      ✅ Запрос отправлен боту. Если бот в сети — список появится в ВК в течение ~10 секунд.
    </div>

    <button
      type="button"
      class="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-3 text-sm font-semibold text-white transition-colors
             hover:bg-sky-400 active:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-40
             focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 dark:text-slate-900"
      :disabled="busy || !canSubmit"
      @click="send"
    >
      <span
        v-if="busy"
        class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/60 border-t-white"
        aria-hidden="true"
      />
      Создать список в ВК
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  /** Есть ли запись tournament_vk_link в БД. */
  vkLinked: boolean
  /** peer_id из привязки (если есть). */
  savedPeerId: number | null
}>()

const commandText = ref('s tr')
const peerIdInput = ref('')
const busy = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

watch(
  () => props.savedPeerId,
  (id) => {
    if (id != null && id > 0 && !peerIdInput.value.trim()) {
      peerIdInput.value = String(id)
    }
  },
  { immediate: true },
)

const hasPeerForServer = computed(() => {
  const raw = peerIdInput.value.trim()
  if (raw) {
    const n = Number(raw)
    return Number.isFinite(n) && n !== 0
  }
  return props.vkLinked === true && props.savedPeerId != null && props.savedPeerId > 0
})

const canSubmit = computed(() => Boolean(commandText.value.trim()) && hasPeerForServer.value)

async function send() {
  if (!canSubmit.value || busy.value) return
  busy.value = true
  error.value = null
  success.value = false
  try {
    const body: { commandText: string, peerId?: number } = { commandText: commandText.value.trim() }
    const raw = peerIdInput.value.trim()
    if (raw) {
      const n = Number(raw)
      if (Number.isFinite(n) && n !== 0) {
        body.peerId = Math.trunc(n)
      }
    }
    await $fetch('/api/tournament/request-vk-start', {
      method: 'POST',
      body,
    })
    success.value = true
  } catch (e: unknown) {
    const status = (e as { data?: { statusMessage?: string }, statusMessage?: string })?.data?.statusMessage
      ?? (e as { statusMessage?: string })?.statusMessage
    if (status?.includes('peerId')) {
      error.value = 'Укажи peer_id беседы ВК в поле выше (или сначала привяжи чат через бота).'
    } else {
      error.value = 'Не удалось отправить запрос (нужен полный админ и доступный сервер).'
    }
  } finally {
    busy.value = false
  }
}
</script>
