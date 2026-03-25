import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { createUser } from '@api/users/createUser'
import type { User } from '@types'

export default function mutateCreateUser() {
  const queryClient = useQueryClient()
  return useMutation(() => ({
    mutationKey: ['create-user'],
    mutationFn: (user: User) => createUser(user),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  }))
}
