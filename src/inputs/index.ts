import type {InferType} from 'yup'
import * as core from '@actions/core'
import {inputsSchema} from './schema'

export const getValidatedInputs = (): InferType<typeof inputsSchema> => {
  const _loadInput = (key: string): unknown => {
    if (key === 'artifacts-json') {
      return JSON.parse(core.getMultilineInput(key).join(''))
    }
    return core.getInput(key)
  }

  return inputsSchema.validateSync(
    Object.fromEntries(
      Object.entries(inputsSchema.fields).map(([key]) => [key, _loadInput(key)])
    )
  )
}
