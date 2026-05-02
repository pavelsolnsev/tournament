<!-- Бейджи статуса ВК-списка: «Список не создан» / «Матч создан» / «Закрытие в боте» + чип окружения и команда в очереди. -->
<template>
  <div>
    <div
      class="flex flex-wrap items-center gap-2 transition-opacity"
      :class="[
        awaitingVkStatusFollowup ? 'mt-2' : 'mt-3',
        awaitingVkStatusFollowup && 'pointer-events-none opacity-55',
      ]"
    >
      <template v-if="vkStatus?.linked && vkStatus?.vkListClosePending">
        <div class="flex w-full min-w-0 flex-wrap items-center justify-between gap-2">
          <span
            class="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/25"
            role="status"
          >
            <svg
              class="h-3.5 w-3.5 shrink-0 animate-spin text-amber-600 dark:text-amber-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Закрытие в боте (e!)
          </span>
          <MoleculesTournamentVkPeerEnvironmentChip
            :environment="vkPeerEnvironment"
            :label="vkDefaultPeerLabel"
          />
        </div>
      </template>
      <template v-else>
        <template v-if="!vkStatus?.linked">
          <div class="flex w-full min-w-0 flex-wrap items-center justify-between gap-2">
            <span
              class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200/90 dark:bg-slate-800/80 dark:text-slate-400 dark:ring-slate-600/50"
            >
              <svg
                class="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              Список не создан
            </span>
            <MoleculesTournamentVkPeerEnvironmentChip
              :environment="vkPeerEnvironment"
              :label="vkDefaultPeerLabel"
            />
          </div>
        </template>
        <template v-else>
          <div class="flex w-full min-w-0 flex-wrap items-center justify-between gap-2">
            <span
              class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20"
            >
              <svg
                class="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Матч создан
            </span>
            <MoleculesTournamentVkPeerEnvironmentChip
              :environment="vkPeerEnvironment"
              :label="vkDefaultPeerLabel"
            />
          </div>
        </template>
      </template>
      <span
        v-if="vkStatus?.pendingVkStart"
        class="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full bg-amber-500/12 px-3 py-1.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-500/20 motion-safe:animate-pulse dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/25"
        role="status"
        aria-busy="true"
        :aria-label="`Команда в очереди бота: ${vkStatus.pendingVkStart.commandText}`"
        :title="vkStatus.pendingVkStart.commandText"
      >
        <svg
          class="h-3.5 w-3.5 shrink-0 animate-spin text-amber-600 dark:text-amber-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <span class="shrink-0">В очереди</span>
        <span class="min-w-0 truncate font-mono text-[10px] font-normal opacity-90">{{ vkStatus.pendingVkStart.commandText }}</span>
      </span>
    </div>

    <p
      v-if="vkStatus?.linked && vkStatus?.vkListClosePending && !vkStatusError"
      class="mt-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400"
    >
      Нужен запущенный vk-bot; привязка пропадёт после ответа бота.
    </p>

    <div
      v-if="vkStatus?.pendingVkStart && !vkStatusError"
      class="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400"
    >
      Ожидайте сообщение в чате или проверьте логи бота.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VkStatusResponse } from '~/composables/useTournamentVkListStart'

defineProps<{
  vkStatus: VkStatusResponse | null | undefined
  vkStatusError: string | null
  vkPeerEnvironment: 'local' | 'production' | 'other'
  vkDefaultPeerLabel: string
  awaitingVkStatusFollowup: boolean
}>()
</script>