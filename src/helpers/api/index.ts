import Axios, { type Method } from 'axios'
import { createHMAC, createSHA256, sha256 } from 'hash-wasm'
import { Configs } from '@configs'
import { isEmpty, toUpper } from 'lodash-es'

const configs = Configs.getInstance()

export interface IGenerateAccessTokenProps {
  method: Uppercase<Method>
  uri: string
  payload?: Record<string, any>
  secret: string
}

export const generateAccessToken = async ({
  method,
  uri,
  payload = {},
  secret
}: IGenerateAccessTokenProps): Promise<string> => {
  const hmacSHA256 = await createHMAC(createSHA256(), secret)
  hmacSHA256.init()

  const payloadSignature = await sha256(
    isEmpty(payload) ? '<BLANK>' : JSON.stringify(payload)
  )
  const message = `${method}|${uri}|${toUpper(payloadSignature)}`
  hmacSHA256.update(message)

  const signature = hmacSHA256.digest()
  return toUpper(signature)
}

const AxiosRequest = (authToken?: string, authKey?: string | number) => {
  const baseURL = `${configs.BASE_URL}`
  const abortController = new AbortController()
  const axios = Axios.create({
    baseURL,
    signal: abortController.signal,
    timeout: 180000
  })
  if (authToken && authKey) {
    axios.defaults.headers.common['X-AUTH-HEADER'] = `${authToken}`
    axios.defaults.headers.common['X-ACCESS-KEY'] = `${authKey}`
  }
  return { axios, abortController }
}

export default AxiosRequest
export { default as routes } from './routes'
