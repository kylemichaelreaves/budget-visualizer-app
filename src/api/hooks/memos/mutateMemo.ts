import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { invalidateAfterMemoMutation } from '@api/queryInvalidation'
import { updateMemo } from '@api/memos/updateMemo'
import type { MemoUpdateInput } from '@types'

/**
 * @param options.awaitInvalidation - Keep the mutation pending until the memo
 *   views have refetched. Use it where a control shows the saved value straight
 *   from the query (the memos table checkbox, the summary page selects), so the
 *   spinner covers the refetch instead of flashing the old value. Leave it off
 *   where a `mutate()` callback closes a dialog or navigates: TanStack holds
 *   those callbacks until `onSuccess` settles.
 */
export default function mutateMemo(options: { awaitInvalidation?: boolean } = {}) {
  const queryClient = useQueryClient()
  return useMutation(() => ({
    mutationKey: mutationKeys.mutateMemo,
    mutationFn: (memo: MemoUpdateInput) => updateMemo(memo),
    onSuccess: () => {
      const invalidation = invalidateAfterMemoMutation(queryClient)
      if (options.awaitInvalidation) return invalidation
      void invalidation
    },
  }))
}
