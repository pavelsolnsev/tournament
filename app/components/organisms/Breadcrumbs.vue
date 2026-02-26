<template>
  <nav aria-label="Хлебные крошки" class="flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
    <template v-for="(item, i) in breadcrumbs" :key="item.href || i">
      <span v-if="i > 0" class="text-slate-600" aria-hidden="true">/</span>
      <NuxtLink
        v-if="item.href"
        :to="item.href"
        class="hover:text-slate-200 transition"
      >
        {{ item.label }}
      </NuxtLink>
      <span v-else class="text-slate-200" aria-current="page">
        {{ item.label }}
      </span>
    </template>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()

const labels: Record<string, string> = {
  '': 'Главная',
  tournament: 'Турнир',
  players: 'Игроки на турнир',
  teams: 'Команды',
}

const breadcrumbs = computed(() => {
  const path = route.path
  if (path === '/') {
    return [{ label: labels[''], href: '/' }]
  }
  const segments = path.split('/').filter(Boolean)
  const items: { label: string; href: string }[] = [
    { label: labels[''], href: '/' },
  ]
  let href = ''
  for (let i = 0; i < segments.length; i++) {
    href += `/${segments[i]}`
    const label = labels[segments[i]] ?? segments[i]
    items.push({ label, href: i === segments.length - 1 ? '' : href })
  }
  return items
})
</script>
