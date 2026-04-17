import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { mutationKeys, queryKeys } from '@api/queryKeys'
import { createUser } from '@api/users/createUser'
import type { CreateUserInput } from '@types'

export default function mutateCreateUser() {
  const queryClient = useQueryClient()
  return useMutation(() => ({
    mutationKey: mutationKeys.createUser,
    mutationFn: (user: CreateUserInput) => createUser(user),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.user })
    },
  }))
}
