import type { ComputedRef } from 'vue'
import { onUnmounted, watch } from 'vue'

type VkStatusResponse = {
  ok: true
  linked: boolean
  vkListClosePending?: boolean
  peerId: number | null
  gameEventId: string | null
  pendingVkStart?: { commandText: string; peerId: number; requestedAt: string } | null
}

/** Синхронно с useTournamentVkListStart — догон после бота (e! / s…). */
const VK_STATUS_FOLLOWUP_MS = 10_000

/** VK-статус в панели управления матчем (только полный админ). */
export function useMatchManagementVkStatus(canViewVkStatus: ComputedRef<boolean>) {
  const vkStatusPending = ref(false)
  const vkStatusError = ref<string | null>(null)
  const vkStatusLinked = ref(false)
  const vkPeerId = ref<number | null>(null)

  let followupTimer: ReturnType<typeof setTimeout> | null = null
  const lastVkSnapshot = ref<{
    pending: VkStatusResponse['pendingVkStart'] | null
    close: boolean
  } | null>(null)

  function clearStandingsFollowup() {
    if (followupTimer) {
      clearTimeout(followupTimer)
      followupTimer = null
    }
  }

  function scheduleStandingsVkFollowup() {
    clearStandingsFollowup()
    followupTimer = setTimeout(() => {
      followupTimer = null
      if (canViewVkStatus.value) void refreshVkStatus()
    }, VK_STATUS_FOLLOWUP_MS)
  }

  async function refreshVkStatus() {
    if (!canViewVkStatus.value) return
    if (vkStatusPending.value) return
    vkStatusPending.value = true
    vkStatusError.value = null
    try {
      const res = await $fetch<VkStatusResponse>('/api/tournament/vk-status', { method: 'GET' })
      const snap = {
        pending: res.pendingVkStart ?? null,
        close: res.vkListClosePending === true,
      }
      const prev = lastVkSnapshot.value
      if (prev) {
        const queueCleared = prev.pending != null && snap.pending == null
        const eCloseDone = prev.close && !snap.close
        if (queueCleared || eCloseDone) {
          scheduleStandingsVkFollowup()
        }
      }
      lastVkSnapshot.value = snap
      vkStatusLinked.value = res.linked === true
      vkPeerId.value = res.peerId ?? null
    } catch (_e: unknown) {
      vkStatusError.value = 'Не удалось получить VK статус (проверьте админ-сессию и сервер).'
    } finally {
      vkStatusPending.value = false
    }
  }

  onUnmounted(() => {
    clearStandingsFollowup()
  })

  watch(
    canViewVkStatus,
    (v) => {
      if (v) void refreshVkStatus()
    },
    { immediate: true },
  )

  return {
    vkStatusPending,
    vkStatusError,
    vkStatusLinked,
    vkPeerId,
    refreshVkStatus,
  }
}
