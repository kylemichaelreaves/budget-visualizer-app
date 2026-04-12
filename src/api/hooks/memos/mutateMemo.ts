import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { invalidateAfterMemoMutation } from '@api/queryInvalidation'
import { updateMemo } from '@api/memos/updateMemo'
import type { MemoUpdateInput } from '@types'

export default function mutateMemo() {
  const queryClient = useQueryClient()
  return useMutation(() => ({
    mutationKey: mutationKeys.mutateMemo,
    mutationFn: (memo: MemoUpdateInput) => updateMemo(memo),
    onSuccess: async () => {
      await invalidateAfterMemoMutation(queryClient)
    },
  }))
}
