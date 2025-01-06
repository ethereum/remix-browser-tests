import * as packageJson from '../../../../../package.json'
import { ViewPlugin } from '@remixproject/engine-web'
import { Plugin } from '@remixproject/engine';
import { RemixAITab, ChatApi } from '@remix-ui/remix-ai'
import React, { useCallback } from 'react';
import { ICompletions, IModel, RemoteInferencer, IRemoteModel, IParams, GenerationParams, CodeExplainAgent } from '@remix/remix-ai-core';
import { CustomRemixApi } from '@remix-api'
import { PluginViewWrapper } from '@remix-ui/helper'

type chatRequestBufferT<T> = {
  [key in keyof T]: T[key]
}

const profile = {
  name: 'remixAI',
  displayName: 'RemixAI',
  methods: ['code_generation', 'code_completion',
    "solidity_answer", "code_explaining",
    "code_insertion", "error_explaining",
    "initialize", 'chatPipe', 'ProcessChatRequestBuffer',
    'isChatRequestPending'],
  events: [],
  icon: 'assets/img/remix-logo-blue.png',
  description: 'RemixAI provides AI services to Remix IDE.',
  kind: '',
  location: 'popupPanel',
  documentation: 'https://remix-ide.readthedocs.io/en/latest/ai.html',
  version: packageJson.version,
  maintainedBy: 'Remix'
}

// add Plugin<any, CustomRemixApi>
export class RemixAIPlugin extends ViewPlugin {
  isOnDesktop:boolean = false
  aiIsActivated:boolean = false
  readonly remixDesktopPluginName = 'remixAID'
  remoteInferencer:RemoteInferencer = null
  isInferencing: boolean = false
  chatRequestBuffer: chatRequestBufferT<any> = null
  agent: CodeExplainAgent
  useRemoteInferencer:boolean = false
  dispatch: any

  constructor(inDesktop:boolean) {
    super(profile)
    this.isOnDesktop = inDesktop
    this.agent = new CodeExplainAgent(this)
    // user machine dont use resource for remote inferencing
  }

  onActivation(): void {

    if (this.isOnDesktop) {
      console.log('Activating RemixAIPlugin on desktop')
      // this.on(this.remixDesktopPluginName, 'activated', () => {
      this.useRemoteInferencer = true
      this.initialize(null, null, null, this.useRemoteInferencer);
      // })
    } else {
      console.log('Activating RemixAIPlugin on browser')
      this.useRemoteInferencer = true
      this.initialize()
    }
  }

  async initialize(model1?:IModel, model2?:IModel, remoteModel?:IRemoteModel, useRemote?:boolean){
    if (this.isOnDesktop && !this.useRemoteInferencer) {
      // on desktop use remote inferencer -> false
      const res = await this.call(this.remixDesktopPluginName, 'initializeModelBackend', useRemote, model1, model2)
      if (res) {
        this.on(this.remixDesktopPluginName, 'onStreamResult', (value) => {
          this.call('terminal', 'log', { type: 'log', value: value })
        })

        this.on(this.remixDesktopPluginName, 'onInference', () => {
          this.isInferencing = true
        })

        this.on(this.remixDesktopPluginName, 'onInferenceDone', () => {
          this.isInferencing = false
        })
      }

    } else {
      this.remoteInferencer = new RemoteInferencer(remoteModel?.apiUrl, remoteModel?.completionUrl)
      this.remoteInferencer.event.on('onInference', () => {
        this.isInferencing = true
      })
      this.remoteInferencer.event.on('onInferenceDone', () => {
        this.isInferencing = false
      })
    }

    this.aiIsActivated = true
    return true
  }

  async code_generation(prompt: string): Promise<any> {
    if (this.isInferencing) {
      this.call('terminal', 'log', { type: 'aitypewriterwarning', value: "RemixAI is already busy!" })
      return
    }

    if (this.isOnDesktop && !this.useRemoteInferencer) {
      return await this.call(this.remixDesktopPluginName, 'code_generation', prompt)
    } else {
      return await this.remoteInferencer.code_generation(prompt)
    }
  }

  async code_completion(prompt: string, promptAfter: string): Promise<any> {
    if (this.isOnDesktop && !this.useRemoteInferencer) {
      return await this.call(this.remixDesktopPluginName, 'code_completion', prompt, promptAfter)
    } else {
      return await this.remoteInferencer.code_completion(prompt, promptAfter)
    }
  }

  async solidity_answer(prompt: string, params: IParams=GenerationParams): Promise<any> {
    if (this.isInferencing) {
      this.call('terminal', 'log', { type: 'aitypewriterwarning', value: "RemixAI is already busy!" })
      return
    }
    if (prompt.trimStart().startsWith('gpt') || prompt.trimStart().startsWith('sol-gpt')) {
      params.terminal_output = true
      params.stream_result = false
      params.return_stream_response = false
    }

    const newPrompt = await this.agent.chatCommand(prompt)
    let result
    if (this.isOnDesktop && !this.useRemoteInferencer) {
      result = await this.call(this.remixDesktopPluginName, 'solidity_answer', newPrompt)
    } else {
      result = await this.remoteInferencer.solidity_answer(newPrompt)
    }
    if (result && params.terminal_output) this.call('terminal', 'log', { type: 'aitypewriterwarning', value: result })

    if (prompt.trimStart().startsWith('gpt') || prompt.trimStart().startsWith('sol-gpt')) params.terminal_output = false
    return result
  }

  async code_explaining(prompt: string, context: string, params: IParams=GenerationParams): Promise<any> {
    if (this.isInferencing) {
      this.call('terminal', 'log', { type: 'aitypewriterwarning', value: "RemixAI is already busy!" })
      return
    }

    let result
    if (this.isOnDesktop && !this.useRemoteInferencer) {
      result = await this.call(this.remixDesktopPluginName, 'code_explaining', prompt, context, params)

    } else {
      result = await this.remoteInferencer.code_explaining(prompt, context, params)
    }
    if (result && params.terminal_output) this.call('terminal', 'log', { type: 'aitypewriterwarning', value: result })
    return result
  }

  async error_explaining(prompt: string, context: string="", params: IParams=GenerationParams): Promise<any> {
    if (this.isInferencing) {
      this.call('terminal', 'log', { type: 'aitypewriterwarning', value: "RemixAI is already busy!" })
      return
    }

    let result
    if (this.isOnDesktop && !this.useRemoteInferencer) {
      result = await this.call(this.remixDesktopPluginName, 'error_explaining', prompt)
    } else {
      result = await this.remoteInferencer.error_explaining(prompt, params)
    }
    if (result && params.terminal_output) this.call('terminal', 'log', { type: 'aitypewriterwarning', value: result })
    return result
  }

  async code_insertion(msg_pfx: string, msg_sfx: string): Promise<any> {
    if (this.isOnDesktop && !this.useRemoteInferencer) {
      return await this.call(this.remixDesktopPluginName, 'code_insertion', msg_pfx, msg_sfx)
    } else {
      return await this.remoteInferencer.code_insertion(msg_pfx, msg_sfx)
    }
  }

  chatPipe(fn, prompt: string, context?: string, pipeMessage?: string){
    if (this.chatRequestBuffer == null){
      this.chatRequestBuffer = {
        fn_name: fn,
        prompt: prompt,
        context: context
      }
      if (pipeMessage) ChatApi.composer.send(pipeMessage)
      else {
        if (fn === "code_explaining") ChatApi.composer.send("Explain the current code")
        else if (fn === "error_explaining") ChatApi.composer.send("Explain the error")
        else if (fn === "solidity_answer") ChatApi.composer.send("Answer the following question")
        else console.log("chatRequestBuffer is not empty. First process the last request.")
      }
    }
    else {
      console.log("chatRequestBuffer is not empty. First process the last request.")
    }
  }

  async ProcessChatRequestBuffer(params:IParams=GenerationParams){
    if (this.chatRequestBuffer != null){
      const result = this[this.chatRequestBuffer.fn_name](this.chatRequestBuffer.prompt, this.chatRequestBuffer.context, params)
      this.chatRequestBuffer = null
      return result
    }
    else {
      console.log("chatRequestBuffer is empty.")
      return ""
    }
  }

  isChatRequestPending(){
    return this.chatRequestBuffer != null
  }

  setDispatch(dispatch) {
    this.dispatch = dispatch
    this.renderComponent()
  }

  renderComponent () {
    this.dispatch({
      plugin: this,
    })
  }

  render() {
    return <div
      id='ai-view'
      className='h-100 d-flex'
      data-id='aichat-view'
      style={{
        minHeight: 'max-content',
      }}
    >
      <PluginViewWrapper plugin={this} />
    </div>
  }

  updateComponent(state) {
    return (
      <RemixAITab plugin={state.plugin}></RemixAITab>
    )
  }
}
