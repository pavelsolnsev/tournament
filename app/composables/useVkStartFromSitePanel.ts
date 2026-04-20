import { computed } from 'vue'
import { useAdminAuth } from '~/composables/useAdminAuth'
import { useMatchManagementVkStatus } from '~/composables/stepStandingsMatchManagementVk'

/** Привязка ВК для панели «Создать список в ВК» (только full admin). */
export function useVkStartFromSitePanel() {
  const { adminRole } = useAdminAuth()
  const canViewVk = computed(() => adminRole.value === 'full')
  const { vkStatusLinked, vkPeerId } = useMatchManagementVkStatus(canViewVk)
  return { vkStatusLinkedForStart: vkStatusLinked, vkPeerIdForStart: vkPeerId }
}
