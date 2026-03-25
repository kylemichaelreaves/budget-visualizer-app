import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { updateUser } from '@api/users/updateUser'
import type { User } from '@types'

export default function mutateUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation(() => ({
    mutationKey: ['update-user'],
    mutationFn: (user: Partial<User>) => updateUser(user),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  }))
}
