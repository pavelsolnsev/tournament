// Логика OrganismsTournamentStepVkListStartPanel — вынесена для лимита max-lines в .vue.
import { useAdminAuth } from '~/composables/useAdminAuth'
import { defaultProfDateTime, defaultTrDateTime } from '~/utils/vkMoscowPresetDefaults'

export type VkListPreset = 'prof' | 'tr'

type VkStatusResponse = {
  ok: boolean
  linked: boolean
  peerId: number | null
  gameEventId: string | null
  pendingVkStart: { commandText: string; peerId: number; requestedAt: string } | null
}

export function useTournamentVkListStart() {
  const { adminRole } = useAdminAuth()
  const showPanel = computed(() => adminRole.value === 'full')

  const config = useRuntimeConfig()
  const defaultPeerHint = computed(() => {
    const s = String(config.public.vkDefaultPeerId ?? '').trim()
    return /^\d+$/.test(s) ? s : '2000000001'
  })

  const { data: vkStatus, refresh: refreshVkStatus, pending: vkStatusPending } =
    useFetch<VkStatusResponse>('/api/tournament/vk-status', {
      credentials: 'include',
      immediate: false,
    })

  watch(
    showPanel,
    (on) => {
      if (on) void refreshVkStatus()
    },
    { immediate: true },
  )

  const peerIdManual = ref('')
  const defaultPeerApplied = ref(false)
  watch([showPanel, vkStatus], () => {
    if (!showPanel.value || defaultPeerApplied.value) return
    if (vkStatus.value?.linked === true) return
    if (peerIdManual.value.trim()) {
      defaultPeerApplied.value = true
      return
    }
    const id = String(config.public.vkDefaultPeerId ?? '').trim()
    if (id && /^\d+$/.test(id)) peerIdManual.value = id
    defaultPeerApplied.value = true
  }, { immediate: true })

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

  const canSubmitCreateMatch = computed(() => {
    if (!selectedPreset.value || vkBusy.value) return false
    return vkEventDate.value.trim() !== '' && vkEventTime.value.trim() !== ''
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
    }
  }

  function manualPeerNumber(): number | undefined {
    const raw = peerIdManual.value.trim()
    if (!raw) return undefined
    const n = Number(raw)
    if (!Number.isFinite(n) || n === 0) return undefined
    return Math.trunc(n)
  }

  function resolvedPeerForRequest(): number | undefined {
    const fromInput = manualPeerNumber()
    if (fromInput != null) return fromInput
    const id = String(config.public.vkDefaultPeerId ?? '').trim()
    if (!id || !/^\d+$/.test(id)) return undefined
    const n = Number(id)
    if (!Number.isFinite(n) || n === 0) return undefined
    return Math.trunc(n)
  }

  async function requestVkStart(preset: VkListPreset) {
    vkStartError.value = null
    const linked = vkStatus.value?.linked === true
    if (!linked) {
      const p = resolvedPeerForRequest()
      if (p == null) {
        vkStartError.value = 'Укажите peer_id беседы ВК (целое число).'
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
      await refreshVkStatus()
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
    }
  }

  return {
    showPanel,
    defaultPeerHint,
    vkStatus,
    refreshVkStatus,
    vkStatusPending,
    peerIdManual,
    selectedPreset,
    vkEventDate,
    vkEventTime,
    trTeamSlotsInput,
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
