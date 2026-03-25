import { useQuery } from '@tanstack/solid-query'
import { getUser } from '@api/users/getUser'

export default function useUser(userId: () => number | undefined) {
  return useQuery(() => ({
    queryKey: ['user', userId()],
    queryFn: () => getUser(userId()!),
    enabled: userId() != null && !Number.isNaN(Number(userId())) && Number(userId()!) > 0,
    refetchOnWindowFocus: false,
  }))
}
