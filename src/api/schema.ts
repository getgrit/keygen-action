import {number, object, string} from 'yup'

export const credentialsSchema = object({
  accountID: string().required(),
  token: string().required()
})

export const releaseCreateSchema = object({
  productID: string()
    .required()
    .test(
      'empty-check',
      'Must not be empty',
      value => (value as string).length > 0
    ),
  attributes: object({
    name: string().optional(),
    version: string()
      .required()
      .test(
        'empty-check',
        'Must not be empty',
        value => (value as string).length > 0
      ),
    tag: string().optional(),
    channel: string().required()
  }).required()
})

export const releasePublishSchema = object({
  releaseID: string()
    .required()
    .test(
      'empty-check',
      'Must not be empty',
      value => (value as string).length > 0
    )
})

export const artifactCreateSchema = object({
  releaseID: string()
    .required()
    .test(
      'empty-check',
      'Must not be empty',
      value => (value as string).length > 0
    ),
  attributes: object({
    filename: string()
      .required()
      .test(
        'empty-check',
        'Must not be empty',
        value => (value as string).length > 0
      ),
    filetype: string().optional(),
    filesize: number().optional(),
    platform: string().optional(),
    arch: string().optional()
  }).required()
})
