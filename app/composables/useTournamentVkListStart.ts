// Логика OrganismsTournamentStepVkListStartPanel — вынесена для лимита max-lines в .vue.
import { useAdminAuth } from '~/composables/useAdminAuth'
import { defaultProfDateTime, defaultTrDateTime } from '~/utils/vkMoscowPresetDefaults'

export type VkListPreset = 'prof' | 'tr'

/** `;` `|` → `,`, схлопываем подряд запятые, убираем недопустимые символы. */
export function sanitizeTrTeamSlotsInput(s: string): string {
  return s
    .replace(/[;|｜]/g, ',')
    .replace(/,{2,}/g, ',')
    .replace(/[^\p{L}\p{N}\s,.\-+'«»№#/]/gu, '')
}

type VkStatusResponse = {
  ok: boolean
  linked: boolean
  /** Сайт попросил бота закрыть список в чате (как e!); ждём бота и unlink. */
  vkListClosePending?: boolean
  peerId: number | null
  gameEventId: string | null
  pendingVkStart: { commandText: string; peerId: number; requestedAt: string } | null
}

export function useTournamentVkListStart() {
  const { adminRole } = useAdminAuth()
  const showPanel = computed(() => adminRole.value === 'full')

  const config = useRuntimeConfig()

  /** local / production — дефолтные peer из nuxt.config; иначе other. */
  const vkPeerEnvironment = computed(() => {
    const s = String(config.public.vkDefaultPeerId ?? '').trim()
    if (s === '2000000001') return 'local' as const
    if (s === '2000000002') return 'production' as const
    return 'other' as const
  })

  /** Подпись для UI: Локалка / Продакшен или число / «Не задано». */
  const vkDefaultPeerLabel = computed(() => {
    const env = vkPeerEnvironment.value
    if (env === 'local') return 'Локалка'
    if (env === 'production') return 'Продакшен'
    const s = String(config.public.vkDefaultPeerId ?? '').trim()
    if (/^\d+$/.test(s)) return s
    return 'Не задано'
  })

  const {
    data: vkStatus,
    refresh: refreshVkStatus,
    pending: vkStatusPending,
    error: vkStatusFetchError,
  } = useFetch<VkStatusResponse>('/api/tournament/vk-status', {
    credentials: 'include',
    immediate: false,
  })

  /** Одно обновление через N мс (после «Создать матч», отмена/бот, или когда очередь/e! снялись). */
  const VK_STATUS_FOLLOWUP_MS = 10_000
  let followupTimer: ReturnType<typeof setTimeout> | null = null
  /** След. тик watch не планирует второй follow-up (избегаем цепочки 10+10 с после своего таймера). */
  let vkStatusRefreshFromFollowupTimer = false
  /** UI: после «Создать матч» / отмены / follow-up — ждём тик vk-status. */
  const awaitingVkStatusFollowup = ref(false)

  function clearFollowupTimer() {
    if (followupTimer) {
      clearTimeout(followupTimer)
      followupTimer = null
    }
  }

  function scheduleOneVkStatusRefreshIn(ms: number) {
    clearFollowupTimer()
    awaitingVkStatusFollowup.value = true
    followupTimer = setTimeout(() => {
      followupTimer = null
      if (!showPanel.value) {
        awaitingVkStatusFollowup.value = false
        return
      }
      vkStatusRefreshFromFollowupTimer = true
      void refreshVkStatus()
        .catch(() => {})
        .finally(() => {
          awaitingVkStatusFollowup.value = false
          nextTick(() => {
            vkStatusRefreshFromFollowupTimer = false
          })
        })
    }, ms)
  }

  const vkStatusError = computed(() => {
    const e = vkStatusFetchError.value
    if (!e) return null
    const msg = e instanceof Error ? e.message : String(e)
    return msg && msg !== '[object Object]'
      ? msg
      : 'Не удалось загрузить статус ВК. Проверьте сеть и админ-сессию.'
  })

  watch(
    showPanel,
    (on) => {
      if (on) void refreshVkStatus()
    },
    { immediate: true },
  )

  if (import.meta.client) {
    const onVkStatusRefresh = () => {
      if (showPanel.value) void refreshVkStatus()
    }
    const onScheduleFollowup = () => {
      scheduleOneVkStatusRefreshIn(VK_STATUS_FOLLOWUP_MS)
    }
    window.addEventListener('football-vk-status-refresh', onVkStatusRefresh)
    window.addEventListener('football-vk-status-schedule-followup', onScheduleFollowup)
    onUnmounted(() => {
      window.removeEventListener('football-vk-status-refresh', onVkStatusRefresh)
      window.removeEventListener('football-vk-status-schedule-followup', onScheduleFollowup)
      clearFollowupTimer()
      awaitingVkStatusFollowup.value = false
    })
  }

  // Бот в VK: очередь (s tr / s prof / …) снялся или e! отработал — один догон через 10 с (не сразу после таймера follow-up).
  watch(
    () =>
      [vkStatus.value?.pendingVkStart ?? null, vkStatus.value?.vkListClosePending === true] as const,
    (next, prev) => {
      if (!prev) return
      if (vkStatusRefreshFromFollowupTimer) return
      const [nP, nC] = next
      const [pP, pC] = prev
      const queueCleared = pP != null && nP == null
      const eCloseDone = pC === true && nC === false
      if (queueCleared || eCloseDone) {
        scheduleOneVkStatusRefreshIn(VK_STATUS_FOLLOWUP_MS)
      }
    },
  )

  const selectedPreset = ref<VkListPreset | null>(null)
  const vkEventDate = ref('')
  const vkEventTime = ref('')
  const trTeamSlotsInput = ref('')
  const vkBusy = ref(false)
  const vkStartError = ref<string | null>(null)

  const uid = useId?.() ?? Math.random().toString(36).slice(2)
  const trSlotsId = `vk-tr-slots-${uid}`
  const vkEventDateId = `vk-event-date-${uid}`
  const vkEventTimeId = `vk-event-time-${uid}`

  const presetButtons = [
    { preset: 'prof' as const, label: 'Профилакторий' },
    { preset: 'tr' as const, label: 'Турнир (пт)' },
  ]

  /** Нет запятой, но 2+ слов подряд — похоже на несколько команд без разделителя. */
  const trTeamSlotsFormatInvalid = computed(() => {
    if (selectedPreset.value !== 'tr') {
      return false
    }
    const t = trTeamSlotsInput.value.trim()
    if (!t) {
      return false
    }
    if (t.includes(',')) {
      return false
    }
    return t.split(/\s+/).filter(Boolean).length >= 2
  })

  function onTrTeamSlotsInput(raw: string) {
    trTeamSlotsInput.value = sanitizeTrTeamSlotsInput(raw)
  }

  const canSubmitCreateMatch = computed(() => {
    if (!selectedPreset.value || vkBusy.value) return false
    if (vkEventDate.value.trim() === '' || vkEventTime.value.trim() === '') return false
    if (selectedPreset.value === 'tr' && trTeamSlotsFormatInvalid.value) {
      return false
    }
    return true
  })

  function presetChipClass(preset: VkListPreset) {
    if (vkBusy.value) {
      return 'border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800'
    }
    if (selectedPreset.value === preset) {
      return 'border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    }
    return 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-700/60 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:border-slate-600'
  }

  async function manualRefreshVkStatus() {
    clearFollowupTimer()
    awaitingVkStatusFollowup.value = false
    await refreshVkStatus()
  }

  const vkStatusFollowupMessage = computed(() => {
    if (!awaitingVkStatusFollowup.value) {
      return ''
    }
    if (vkStatusPending.value) {
      return 'Обновляем статус…'
    }
    return 'Скоро обновим статус ВК…'
  })

  function selectPreset(preset: VkListPreset) {
    if (vkBusy.value) return
    vkStartError.value = null
    const next = selectedPreset.value === preset ? null : preset
    selectedPreset.value = next
    if (next === 'prof') {
      const d = defaultProfDateTime()
      vkEventDate.value = d.dateIso
      vkEventTime.value = d.time
    } else if (next === 'tr') {
      const d = defaultTrDateTime()
      vkEventDate.value = d.dateIso
      vkEventTime.value = d.time
    } else {
      vkEventDate.value = ''
      vkEventTime.value = ''
      trTeamSlotsInput.value = ''
    }
  }

  /** Peer беседы для vk-request-start, если ещё нет привязки — только из runtimeConfig (локалка/прод). */
  function resolvedPeerForRequest(): number | undefined {
    const id = String(config.public.vkDefaultPeerId ?? '').trim()
    if (!id || !/^\d+$/.test(id)) return undefined
    const n = Number(id)
    if (!Number.isFinite(n) || n === 0) return undefined
    return Math.trunc(n)
  }

  async function requestVkStart(preset: VkListPreset) {
    vkStartError.value = null
    if (preset === 'tr' && trTeamSlotsFormatInvalid.value) {
      return
    }
    const linked = vkStatus.value?.linked === true
    if (!linked) {
      const p = resolvedPeerForRequest()
      if (p == null) {
        vkStartError.value =
          'Не задан peer беседы ВК. Укажите NUXT_PUBLIC_VK_DEFAULT_PEER_ID или vkDefaultPeerId в runtimeConfig.'
        return
      }
    }

    const body: Record<string, unknown> = {
      preset,
      date: vkEventDate.value.trim(),
      time: vkEventTime.value.trim(),
    }
    if (!linked) {
      body.peer_id = resolvedPeerForRequest()
    }

    if (preset === 'tr') {
      const slots = trTeamSlotsInput.value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (slots.length) body.team_slots = slots
    }

    vkBusy.value = true
    try {
      await $fetch<{ ok: boolean }>('/api/tournament/vk-request-start', {
        method: 'POST',
        credentials: 'include',
        body,
      })
      scheduleOneVkStatusRefreshIn(VK_STATUS_FOLLOWUP_MS)
    } catch (err: unknown) {
      const msg =
        (err as { data?: { statusMessage?: string }; statusMessage?: string })?.data?.statusMessage
        ?? (err as { statusMessage?: string })?.statusMessage
        ?? 'Не удалось отправить запрос. Проверьте права и настройки бота.'
      vkStartError.value = msg
    } finally {
      vkBusy.value = false
    }
  }

  async function submitCreateMatch() {
    const preset = selectedPreset.value
    if (!preset || !canSubmitCreateMatch.value) return
    await requestVkStart(preset)
    if (!vkStartError.value) {
      selectedPreset.value = null
      vkEventDate.value = ''
      vkEventTime.value = ''
      trTeamSlotsInput.value = ''
    }
  }

  return {
    showPanel,
    vkPeerEnvironment,
    vkDefaultPeerLabel,
    vkStatus,
    refreshVkStatus,
    manualRefreshVkStatus,
    vkStatusPending,
    awaitingVkStatusFollowup,
    vkStatusFollowupMessage,
    vkStatusError,
    selectedPreset,
    vkEventDate,
    vkEventTime,
    trTeamSlotsInput,
    trTeamSlotsFormatInvalid,
    onTrTeamSlotsInput,
    vkBusy,
    vkStartError,
    trSlotsId,
    vkEventDateId,
    vkEventTimeId,
    presetButtons,
    canSubmitCreateMatch,
    presetChipClass,
    selectPreset,
    submitCreateMatch,
  }
}
