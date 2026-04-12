import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { deleteUser } from '@api/users/deleteUser'
import type { User } from '@types'

export default function mutateDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation(() => ({
    mutationKey: ['delete-user'],
    mutationFn: (userId: User['id']) => deleteUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.user })
    },
  }))
}
