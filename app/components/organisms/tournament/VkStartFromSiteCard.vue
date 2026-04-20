<template>
  <div
    v-if="show"
    class="rounded-2xl border border-slate-200/90 bg-white/90 p-4 dark:border-slate-700/60 dark:bg-slate-900/50"
  >
    <MoleculesTournamentVkStartFromSitePanel
      :vk-linked="vkStatusLinkedForStart"
      :saved-peer-id="vkPeerIdForStart"
    />
  </div>
</template>

<script setup lang="ts">
import { useVkStartFromSitePanel } from '~/composables/useVkStartFromSitePanel'

defineProps<{ show: boolean }>()

const { vkStatusLinkedForStart, vkPeerIdForStart } = useVkStartFromSitePanel()
</script>
