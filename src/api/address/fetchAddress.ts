import axios from 'axios'
import { isValidURL } from '@api/helpers/isValidURL'
import { devConsole } from '@utils/devConsole'

export async function fetchAddress(id: string, fetchURL?: string) {
  if (!fetchURL) {
    if (!import.meta.env.VITE_APIGATEWAY_URL) {
      throw Error('VITE_APIGATEWAY_URL is not defined')
    } else {
      fetchURL = import.meta.env.VITE_APIGATEWAY_URL
    }
  }

  if (!isValidURL(fetchURL)) {
    throw Error('url is not valid')
  }

  return await axios
    .get(`/address-geocoder/${id}`)
    .then((res) => res.data)
    .catch((err: Error) => {
      devConsole('error', 'err:', err)
    })
}
