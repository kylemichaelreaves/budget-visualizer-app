import { useMutation, useQueryClient } from '@tanstack/solid-query'
import axios from 'axios'
import { type Accessor, createSignal, onCleanup } from 'solid-js'
import { createCsvImport } from '@api/transactions/createCsvImport'
import { invalidateAfterTransactionCreate } from '@api/queryInvalidation'
import { mutationKeys, queryKeys } from '@api/queryKeys'

export type CreateCsvImportVariables = {
  file: File
  contentType: string
}

/**
 * Two-step CSV import: POST collection resource for a presigned PUT URL, then PUT to S3.
 *
 * The S3 ObjectCreated notification on transactions-bucket auto-fires the
 * transactions-bucket-to-db lambda, which parses, dedupes, and upserts. We
 * invalidate transactions broadly on success — the lambda's write usually
 * lands within a few seconds, so a delayed invalidation also fires at 30s
 * to catch the eventual rows without forcing the user to refresh.
 */
export function useCreateCsvImport(): {
  mutation: ReturnType<typeof useMutation<unknown, Error, CreateCsvImportVariables>>
  progress: Accessor<number>
  reset: () => void
  cancel: () => void
} {
  const queryClient = useQueryClient()
  const [progress, setProgress] = createSignal(0)
  let controller: AbortController | null = null
  let delayedInvalidation: ReturnType<typeof setTimeout> | null = null

  const clearDelayedInvalidation = () => {
    if (delayedInvalidation != null) {
      clearTimeout(delayedInvalidation)
      delayedInvalidation = null
    }
  }

  const mutation = useMutation<unknown, Error, CreateCsvImportVariables>(() => ({
    mutationKey: mutationKeys.createCsvImport,
    mutationFn: async ({ file, contentType }) => {
      setProgress(0)
      controller = new AbortController()
      const { signal } = controller
      const { uploadUrl } = await createCsvImport({ filename: file.name, contentType }, { signal })
      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': contentType },
        signal,
        onUploadProgress: (event) => {
          if (event.total && event.total > 0) {
            setProgress(Math.min(1, event.loaded / event.total))
          } else if (typeof event.progress === 'number') {
            setProgress(event.progress)
          }
        },
      })
      return null
    },
    onSuccess: () => {
      void invalidateAfterTransactionCreate(queryClient)
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions.csv })
      clearDelayedInvalidation()
      delayedInvalidation = setTimeout(() => {
        delayedInvalidation = null
        void invalidateAfterTransactionCreate(queryClient)
      }, 30_000)
    },
    onSettled: () => {
      controller = null
    },
  }))

  const cancel = () => {
    clearDelayedInvalidation()
    controller?.abort()
    controller = null
    setProgress(0)
    mutation.reset()
  }

  const reset = () => {
    clearDelayedInvalidation()
    setProgress(0)
    mutation.reset()
  }

  onCleanup(() => {
    clearDelayedInvalidation()
    controller?.abort()
    controller = null
  })

  return { mutation, progress, reset, cancel }
}
