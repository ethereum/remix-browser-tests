'use strict'

import { IModel, IModelResponse, IModelRequest, InferenceModel, ICompletions,
  IParams, ChatEntry, AIRequestType, IRemoteModel,
  RemoteBackendOPModel, IStreamResponse } from './types/types'
import { ModelType } from './types/constants'
import { DefaultModels, InsertionParams, CompletionParams, GenerationParams } from './types/models'
import { getCompletionPrompt, getInsertionPrompt } from './prompts/completionPrompts'
import { buildSolgptPromt, PromptBuilder } from './prompts/promptBuilder'
import { RemoteInferencer } from './inferencers/remote/remoteInference'
import { ChatHistory } from './prompts/chat'
import { downloadLatestReleaseExecutable } from './helpers/inferenceServerReleases'

export {
  IModel, IModelResponse, IModelRequest, InferenceModel,
  ModelType, DefaultModels, ICompletions, IParams, IRemoteModel,
  getCompletionPrompt, getInsertionPrompt, IStreamResponse, buildSolgptPromt,
  RemoteInferencer, InsertionParams, CompletionParams, GenerationParams,
  ChatEntry, AIRequestType, RemoteBackendOPModel, ChatHistory, downloadLatestReleaseExecutable
}

export * from './types/types'
export * from './helpers/streamHandler'
export * from './agents/codeExplainAgent'
export * from './agents/securityAgent'