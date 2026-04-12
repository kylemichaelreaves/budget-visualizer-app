import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { getUser } from '@api/users/getUser'

export default function useUser(userId: () => number | undefined) {
  return useQuery(() => ({
    queryKey: queryKeys.userDetail(userId()),
    queryFn: () => getUser(userId()!),
    enabled: userId() != null && !Number.isNaN(Number(userId())) && Number(userId()!) > 0,
    refetchOnWindowFocus: false,
  }))
}
