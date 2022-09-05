import fs from 'fs'
import path from 'path'
import * as core from '@actions/core'

import KeygenAPI from './api'
import {getValidatedInputs} from './inputs'

export default async function run(): Promise<void> {
  try {
    core.info('Validating inputs..')
    const inputs = getValidatedInputs()

    core.info('Verifying files..')
    const filesStat = inputs['artifacts-json']?.map(inputArtifact =>
      fs.statSync(inputArtifact['filepath'])
    )

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

    for (let i = 0; i < inputs['artifacts-json'].length; i++) {
      core.info(
        `Creating artifact (${i + 1}/${inputs['artifacts-json'].length})..`
      )
      const artifact = await keygenAPI.artifactCreate({
        releaseID: release.id,
        attributes: {
          filename: path.basename(inputs['artifacts-json'][i].filepath),
          filetype: path
            .extname(inputs['artifacts-json'][i].filepath)
            .replace('.', ''),
          filesize: filesStat[i].size,
          platform: inputs['artifacts-json'][i].platform,
          arch: inputs['artifacts-json'][i].arch
        }
      })

      core.info(
        `Uploading artifact file (${i + 1}/${
          inputs['artifacts-json'].length
        })..`
      )
      await keygenAPI.artifactFileUpload(
        artifact.links.redirect,
        fs.createReadStream(inputs['artifacts-json'][i].filepath),
        filesStat[i].size
      )
    }

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
