import * as process from 'process'
import {ReadStream} from 'fs'
import * as core from '@actions/core'
import {expect, describe, it, jest} from '@jest/globals'
import type { Response } from 'node-fetch'
import fetch from 'node-fetch'

import run from '../src/run'

jest.mock('node-fetch', () => jest.fn())
const fetchMock = fetch as jest.MockedFunction<typeof fetch>;

describe("run()", () => { 

  it("resolves correctly on a happy path", async () => {
    // 1. Spy on core.setFailed().
    // It, being called or not is the discriminator between successful and failed runs
    jest.spyOn(core, 'setFailed')
    
    // 2. Prepare input env vars, in the same format expected from the Github Actions runner
    process.env['INPUT_TOKEN'] = 'SOME_TOKEN'
    process.env['INPUT_ACCOUNT-ID'] = 'SOME_ACCOUNT_ID'
  
    process.env['INPUT_PRODUCT-ID'] = 'SOME_PRODUCT_ID'
    process.env['INPUT_RELEASE-PUBLISH'] = 'true'
  
    process.env['INPUT_RELEASE-NAME'] = 'SOME_NAME'
    process.env['INPUT_RELEASE-VERSION'] = 'SOME_VERSION'
    process.env['INPUT_RELEASE-CHANNEL'] = 'SOME_CHANNEL'
    process.env['INPUT_RELEASE-TAG'] = 'SOME_TAG'
  
    process.env['INPUT_ARTIFACTS-JSON'] = JSON.stringify([
      {filepath: './__tests__/dummy_artifact.txt', platform: 'darwin', arch: 'amd64'}
    ])

    // 3. Mock the exact sequence of Keygen API responses expected
    // We further check each call was correctly parameterized in step 6 below
    fetchMock
    .mockResolvedValueOnce({ok: true, status: 201, json: async () => ({data: {id: 'SOME_SERVER_GENERATED_RELEASE_ID'}})} as Response)
    .mockResolvedValueOnce({ok: true, status: 307, json: async () => ({data: {
      id: 'SOME_ARTIFACT_ID',
      links: {
        redirect: 'SOME_PRESIGNED_S3_UPLOAD_URL'
      }
    }})} as Response)
    .mockResolvedValueOnce({ok: true, status: 200} as Response)
    .mockResolvedValueOnce({ok: true, status: 200, json: async () => ({})} as Response)
  
    // 4. Run
    await run()

    // 5. Assert run was successful
    expect(core.setFailed).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(4)
  
    // 6. Assert API calls were correctly parameterized
    // 6.1. Release create
    expect(fetchMock.mock.calls[0][0]).toEqual(`https://api.keygen.sh/v1/accounts/${process.env['INPUT_ACCOUNT-ID']}/releases`)
    expect(fetchMock.mock.calls[0][1]?.method).toEqual('POST')
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string ?? '{}')).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'release',
          relationships: expect.objectContaining({
            product: {
              data: {
                type: 'product',
                id: process.env['INPUT_PRODUCT-ID']
              }
            }
          })
        })
      })
    )

    // 6.2. Artifact create
    expect(fetchMock.mock.calls[1][0]).toEqual(`https://api.keygen.sh/v1/accounts/${process.env['INPUT_ACCOUNT-ID']}/artifacts`)
    expect(fetchMock.mock.calls[1][1]?.method).toEqual('POST')
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string ?? '{}')).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'artifact',
          relationships: expect.objectContaining({
            release: {
              data: {
                type: 'release',
                id: 'SOME_SERVER_GENERATED_RELEASE_ID'
              }
            }
          })
        })
      })
    )

    // 6.3. Artifact upload
    expect(fetchMock.mock.calls[2][0]).toEqual('SOME_PRESIGNED_S3_UPLOAD_URL')
    expect(fetchMock.mock.calls[2][1]?.method).toEqual('PUT')
    expect(fetchMock.mock.calls[2][1]?.headers).toEqual(
      expect.objectContaining({
        'Content-Length': '21'
      })
    )
    expect(fetchMock.mock.calls[2][1]?.body).toBeInstanceOf(ReadStream)
    expect((fetchMock.mock.calls[2][1]?.body as ReadStream).path).toEqual('./__tests__/dummy_artifact.txt')

    // 6.4. Release publish
    expect(fetchMock.mock.calls[3][0]).toEqual(`https://api.keygen.sh/v1/accounts/${process.env['INPUT_ACCOUNT-ID']}/releases/SOME_SERVER_GENERATED_RELEASE_ID/actions/publish`)
    expect(fetchMock.mock.calls[3][1]?.method).toEqual('POST')
  });
});



