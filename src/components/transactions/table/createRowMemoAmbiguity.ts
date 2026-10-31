import type { Accessor } from 'solid-js'
import { useMemoById } from '@api/hooks/memos/useMemoById'
import type { Transaction } from '@types'

/**
 * Whether a row's memo is ambiguous. The transactions endpoint returns `memo_ambiguous`
 * on each row, so the table makes no memo request at all. A backend that predates the
 * field leaves it absent; only then does the row fetch its memo, and rows sharing a memo
 * share that request.
 */
export function createRowMemoAmbiguity(row: Accessor<Transaction>): Accessor<boolean> {
  const memoQuery = useMemoById({
    memoId: () => (row().memo_ambiguous === undefined ? (row().memo_id ?? null) : null),
  })
  return () => {
    const flag = row().memo_ambiguous
    return flag === undefined ? !!memoQuery.data?.ambiguous : !!flag
  }
}
