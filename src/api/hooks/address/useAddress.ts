import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchAddress } from '@api/address/fetchAddress'

export default function useAddress(id: () => string | undefined, fetchURL?: () => string | undefined) {
  return useQuery(() => ({
    queryKey: queryKeys.address(id() ?? '', fetchURL?.() ?? ''),
    queryFn: () => fetchAddress(id()!, fetchURL?.()),
    enabled: !!id() && id()!.trim() !== '',
    refetchOnWindowFocus: false,
  }))
}
