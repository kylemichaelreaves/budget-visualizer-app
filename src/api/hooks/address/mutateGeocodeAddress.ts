import { useMutation } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { geocodeAddress } from '@api/address/geocodeAddress'
import type { AddressFields, AddressResponse } from '@types'

export default function mutateGeocodeAddress() {
  return useMutation(() => ({
    mutationKey: mutationKeys.geocodeAddress,
    mutationFn: (address: AddressFields): Promise<AddressResponse[]> => geocodeAddress(address),
  }))
}
