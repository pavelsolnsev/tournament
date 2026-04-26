import type { ComputedRef } from 'vue'
import { watch } from 'vue'

type VkStatusResponse = {
  ok: true
  linked: boolean
  vkListClosePending?: boolean
  peerId: number | null
  gameEventId: string | null
  pendingVkStart?: { commandText: string; peerId: number; requestedAt: string } | null
}

/** VK-статус в панели управления матчем (только полный админ). */
export function useMatchManagementVkStatus(canViewVkStatus: ComputedRef<boolean>) {
  const vkStatusPending = ref(false)
  const vkStatusError = ref<string | null>(null)
  const vkStatusLinked = ref(false)
  const vkPeerId = ref<number | null>(null)

  async function refreshVkStatus() {
    if (!canViewVkStatus.value) return
    if (vkStatusPending.value) return
    vkStatusPending.value = true
    vkStatusError.value = null
    try {
      const res = await $fetch<VkStatusResponse>('/api/tournament/vk-status', { method: 'GET' })
      vkStatusLinked.value = res.linked === true
      vkPeerId.value = res.peerId ?? null
    } catch (_e: unknown) {
      vkStatusError.value = 'Не удалось получить VK статус (проверьте админ-сессию и сервер).'
    } finally {
      vkStatusPending.value = false
    }
  }

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
