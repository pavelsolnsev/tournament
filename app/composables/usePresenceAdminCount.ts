import { useQuery } from '@tanstack/vue-query'

// Число «сейчас на сайте» для админки — тот же источник, что пинги зрителей и админа.
export function usePresenceAdminCount() {
  const query = useQuery({
    queryKey: ['presence-count'],
    queryFn: () => $fetch<{ count: number }>('/api/presence/count'),
    // Обновляем цифру чаще пинга, чтобы админ видел относительно свежие данные.
    refetchInterval: 12_000,
    retry: 1,
  })

  return {
    count: computed(() => query.data.value?.count ?? 0),
    query,
  }
}
