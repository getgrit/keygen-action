import fs from 'fs'
import path from 'path'
import * as core from '@actions/core'

import KeygenAPI from './api'
import {getValidatedInputs} from './inputs'

async function run(): Promise<void> {
  try {
    core.info('Validating inputs..')
    const inputs = getValidatedInputs()

    core.info('Verifying file..')
    const fileStat = fs.statSync(inputs['artifact-filepath'])

    const keygenAPI = new KeygenAPI({
      token: inputs.token,
      accountID: inputs['account-id']
    })

    core.info('Creating release..')
    const release = await keygenAPI.releaseCreate({
      productID: inputs['product-id'],
      attributes: {
        name: inputs['release-name'],
        version: inputs['release-version'],
        tag: inputs['release-tag'],
        channel: inputs['release-channel']
      }
    })

    core.info('Creating artifact..')
    const artifact = await keygenAPI.artifactCreate({
      releaseID: release.id,
      attributes: {
        filename: path.basename(inputs['artifact-filepath']),
        filetype: path.extname(inputs['artifact-filepath']).replace('.', ''),
        filesize: fileStat.size,
        platform: inputs['artifact-platform'],
        arch: inputs['artifact-arch']
      }
    })

    core.info('Uploading artifact file..')
    await keygenAPI.artifactFileUpload(
      artifact.links.redirect,
      fs.readFileSync(inputs['artifact-filepath'])
    )

    if (inputs['release-publish']) {
      core.info('Publishing release..')
      await keygenAPI.releasePublish({
        releaseID: release.id
      })
    }

    core.info('Success.')
  } catch (error) {
    core.setFailed(error instanceof Error ? error : String(error))
  }
}

run()
