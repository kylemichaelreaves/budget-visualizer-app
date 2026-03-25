import { useMutation } from '@tanstack/solid-query'
import { geocodeAddress } from '@api/address/geocodeAddress'
import type { AddressFields, AddressResponse } from '@types'

export default function mutateGeocodeAddress() {
  return useMutation(() => ({
    mutationKey: ['geocode-address'],
    mutationFn: (address: AddressFields): Promise<AddressResponse[]> => geocodeAddress(address),
  }))
}
