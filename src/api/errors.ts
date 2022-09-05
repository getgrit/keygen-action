import type {Response} from 'node-fetch'

export class KeygenAPIError extends Error {
  response: Response

  constructor(response: Response) {
    super('KeygenAPIError')
    this.name = 'KeygenAPIError'
    this.response = response
  }
}

export class S3APIError extends Error {
  response: Response

  constructor(response: Response) {
    super('S3APIError')
    this.name = 'S3APIError'
    this.response = response
  }
}
