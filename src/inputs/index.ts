import type {InferType} from 'yup'
import * as core from '@actions/core'
import {inputsSchema} from './schema'

export const getValidatedInputs = (): InferType<typeof inputsSchema> => {
  return inputsSchema.validateSync(
    Object.fromEntries(
      Object.entries(inputsSchema.fields).map(([key]) => [
        key,
        core.getInput(key)
      ])
    )
  )
}
