import {boolean, array, object, string} from 'yup'

export const inputsSchema = object({
  token: string().required(),
  'account-id': string().required(),

  'product-id': string().required(),

  'release-publish': boolean().required(),

  'release-name': string().optional(),
  'release-version': string().required(),
  'release-channel': string().required(),
  'release-tag': string().optional(),

  'artifacts-json': array(
    object({
      filepath: string().required(),
      platform: string().optional(),
      arch: string().optional()
    }).required()
  )
    .min(1)
    .required()
})
