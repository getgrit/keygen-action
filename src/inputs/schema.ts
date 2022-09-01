import {boolean, object, string} from 'yup'

export const inputsSchema = object({
  token: string().required(),
  'account-id': string().required(),

  'product-id': string().required(),

  'release-publish': boolean().required(),

  'release-name': string().optional(),
  'release-version': string().required(),
  'release-channel': string().required(),
  'release-tag': string().optional(),

  'artifact-filepath': string().required(),
  'artifact-platform': string().optional(),
  'artifact-arch': string().optional()
})
