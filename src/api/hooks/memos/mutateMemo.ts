import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { invalidateAfterMemoMutation } from '@api/queryInvalidation'
import { updateMemo } from '@api/memos/updateMemo'
import type { MemoUpdateInput } from '@types'

export default function mutateMemo() {
  const queryClient = useQueryClient()
  return useMutation(() => ({
    mutationKey: ['mutate-memo'],
    mutationFn: (memo: MemoUpdateInput) => updateMemo(memo),
    onSuccess: async () => {
      await invalidateAfterMemoMutation(queryClient)
    },
  }))
}
