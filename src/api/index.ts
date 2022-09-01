import type {RequestRedirect, Response} from 'node-fetch'
import type {InferType} from 'yup'
import fetch from 'node-fetch'

import {KeygenAPIError, S3APIError} from './errors'

import {
  artifactCreateSchema,
  credentialsSchema,
  releaseCreateSchema,
  releasePublishSchema
} from './schema'

export default class KeygenAPI {
  token: string
  accountID: string

  constructor({token, accountID}: InferType<typeof credentialsSchema>) {
    this.token = token
    this.accountID = accountID
  }

  async _makeAPIRequest({
    method,
    resourcePath = '',
    body = undefined,
    redirect = undefined
  }: {
    method: string
    resourcePath: string
    body?: string
    redirect?: RequestRedirect
  }): Promise<Response> {
    return fetch(
      `https://api.keygen.sh/v1/accounts/${this.accountID}${resourcePath}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/vnd.api+json',
          Accept: 'application/vnd.api+json'
        },
        ...(body !== undefined ? {body} : {}),
        ...(redirect !== undefined ? {redirect} : {})
      }
    )
  }

  async releaseCreate(
    params: InferType<typeof releaseCreateSchema>
  ): Promise<{id: string}> {
    const response = await this._makeAPIRequest({
      resourcePath: '/releases',
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'release',
          attributes: params.attributes,
          relationships: {
            product: {
              data: {
                type: 'product',
                id: params.productID
              }
            },
            constraints: {
              data: []
            }
          }
        }
      })
    })

    if (!response.ok) {
      throw new KeygenAPIError(response)
    }

    const {data = undefined, errors = undefined} = (await response.json()) as {
      data?: {id: string}
      errors?: unknown[]
    }

    if (errors?.length || !data) {
      throw new KeygenAPIError(response)
    }

    return data
  }

  async releasePublish(
    params: InferType<typeof releasePublishSchema>
  ): Promise<void> {
    const response = await this._makeAPIRequest({
      resourcePath: `/releases/${params.releaseID}/actions/publish`,
      method: 'POST'
    })

    if (!response.ok) {
      throw new KeygenAPIError(response)
    }

    const {errors = undefined} = (await response.json()) as {
      errors?: unknown[]
    }

    if (errors?.length) {
      throw new KeygenAPIError(response)
    }

    return
  }

  async artifactCreate(
    params: InferType<typeof artifactCreateSchema>
  ): Promise<{
    id: string
    links: {
      redirect: string
    }
  }> {
    const response = await this._makeAPIRequest({
      resourcePath: '/artifacts',
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'artifact',
          attributes: params.attributes,
          relationships: {
            release: {
              data: {
                type: 'release',
                id: params.releaseID
              }
            }
          }
        }
      }),
      redirect: 'manual' // TODO: explain
    })

    if (response.status !== 307) {
      throw new KeygenAPIError(response)
    }

    const {data = undefined, errors = undefined} = (await response.json()) as {
      data?: {
        id: string
        links: {
          redirect: string
        }
      }
      errors?: unknown[]
    }

    if (errors?.length || !data) {
      throw new KeygenAPIError(response)
    }

    return data
  }

  async artifactFileUpload(
    signedS3UploadUrl: string,
    file: Buffer
  ): Promise<void> {
    // NOTE:
    // This endpoint expects the whole file to be loaded in memory.
    // As a result, the upload operation is at the mercy of available Runner memory.
    //
    // We would've made the upload read the file as a stream (using fs.createReadStream()). However, S3 does not support this.
    // We would've also considered supporting S3's Multipart upload (when a file is detected to be larger than a given threshold). Howeber, Keygen does not provide utilities for getting pre-signed part upload urls.

    const response = await fetch(signedS3UploadUrl, {
      method: 'PUT',
      body: file
    })

    if (response.ok) {
      return
    }

    throw new S3APIError(response)
  }
}
