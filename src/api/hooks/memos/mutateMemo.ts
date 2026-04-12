import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { updateMemo } from '@api/memos/updateMemo'
import type { MemoUpdateInput } from '@types'

export default function mutateMemo() {
  const queryClient = useQueryClient()
  return useMutation(() => ({
    mutationKey: ['mutate-memo'],
    mutationFn: (memo: MemoUpdateInput) => updateMemo(memo),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['memo'] })
      await queryClient.invalidateQueries({ queryKey: ['memo-summary'] })
      await queryClient.invalidateQueries({ queryKey: ['memos'] })
      await queryClient.invalidateQueries({ queryKey: ['memo-transactions'] })
      await queryClient.invalidateQueries({ queryKey: ['memos-count'] })
    },
  }))
}
