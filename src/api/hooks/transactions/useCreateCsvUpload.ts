import { useMutation, useQueryClient } from '@tanstack/solid-query'
import axios from 'axios'
import { type Accessor, createSignal } from 'solid-js'
import { createCsvUploadUrl } from '@api/transactions/createCsvUploadUrl'
import { invalidateAfterTransactionCreate } from '@api/queryInvalidation'
import { mutationKeys, queryKeys } from '@api/queryKeys'

export type UploadCsvVariables = {
  file: File
  contentType: string
}

/**
 * Two-step upload: request a presigned PUT URL, then PUT the file directly to S3.
 *
 * The S3 ObjectCreated notification on transactions-bucket auto-fires the
 * transactions-bucket-to-db lambda, which parses, dedupes, and upserts. We
 * invalidate transactions broadly on success — the lambda's write usually
 * lands within a few seconds, so a delayed invalidation also fires at 30s
 * to catch the eventual rows without forcing the user to refresh.
 */
export function useCreateCsvUpload(): {
  mutation: ReturnType<typeof useMutation<unknown, Error, UploadCsvVariables>>
  progress: Accessor<number>
  reset: () => void
} {
  const queryClient = useQueryClient()
  const [progress, setProgress] = createSignal(0)

  const mutation = useMutation<unknown, Error, UploadCsvVariables>(() => ({
    mutationKey: mutationKeys.uploadCsv,
    mutationFn: async ({ file, contentType }) => {
      setProgress(0)
      const { uploadUrl } = await createCsvUploadUrl({ filename: file.name, contentType })
      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': contentType },
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions.csvRecent })
      // Lambda processing is async — re-invalidate after a delay so the table
      // picks up the new rows once the bucket-to-db lambda finishes.
      setTimeout(() => {
        void invalidateAfterTransactionCreate(queryClient)
      }, 30_000)
    },
  }))

  const reset = () => {
    setProgress(0)
    mutation.reset()
  }

  return { mutation, progress, reset }
}
