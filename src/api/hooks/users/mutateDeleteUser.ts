import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { mutationKeys, queryKeys } from '@api/queryKeys'
import { deleteUser } from '@api/users/deleteUser'
import type { User } from '@types'

export default function mutateDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation(() => ({
    mutationKey: mutationKeys.deleteUser,
    mutationFn: (userId: User['id']) => deleteUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.user })
    },
  }))
}
