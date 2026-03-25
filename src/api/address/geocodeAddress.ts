import axios from 'axios'
import { API_GATEWAY_URL } from '@constants'
import type { AddressFields, AddressResponse } from '@types'

export const geocodeAddress = async (address: AddressFields): Promise<AddressResponse[]> => {
  return typeof address === 'undefined'
    ? Promise.reject(new Error('address is undefined'))
    : await axios
        .get(`${API_GATEWAY_URL}/addresses/geocoder`, {
          params: address,
        })
        .then((response) => {
          return response.data
        })
        .catch((error) => {
          // Throw the error or return a rejected promise
          return Promise.reject(error)
        })
}
