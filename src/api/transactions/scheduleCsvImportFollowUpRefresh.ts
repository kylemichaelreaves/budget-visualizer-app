import type { QueryClient } from '@tanstack/solid-query'
import { invalidateAfterTransactionCreate } from '@api/queryInvalidation'

export const CSV_IMPORT_FOLLOW_UP_MS = 30_000

let pending: ReturnType<typeof setTimeout> | null = null

/**
 * Refresh transactions once the ingestion Lambda has had time to write the rows.
 *
 * This lives at module scope, not in the import page, on purpose: the success
 * screen's "View transactions" button unmounts that page, and a timer cleared on
 * unmount was cancelled by the very click it existed to serve. The file is already
 * in S3 by now and will be ingested regardless, so nothing on the page cancels it.
 * A second upload restarts the clock, which covers the first file too.
 */
export function scheduleCsvImportFollowUpRefresh(queryClient: QueryClient): void {
  if (pending != null) clearTimeout(pending)
  pending = setTimeout(() => {
    pending = null
    void invalidateAfterTransactionCreate(queryClient)
  }, CSV_IMPORT_FOLLOW_UP_MS)
}
