
import { EventEmitter } from 'events';
// import { ICompletions, IParams } from '../../../../libs/remix-ai-core/src/index'
// import { getInsertionPrompt } from '../../../../libs/remix-ai-core/src/index'

const insertionParams = {
  temperature: 0.9,
  max_new_tokens: 150,
  repetition_penalty: 1.5,
  num_beams: 1,
  num_return_sequences: 1,
}

const completionParams = {
  temperature: 0.3,
  repetition_penalty: 1.1,
  max_new_tokens: 150,
}

class InlineCompletionTransformer {
  static task = null 
  static model = null 
  static instance = null;  
  static defaultModels = null

  // getting the instance of the model for the first time will download the model to the cache
  static async getInstance(progress_callback = null) {
    if (InlineCompletionTransformer.instance === null) {
      const TransformersApi = Function('return import("@xenova/transformers")')();
      const { pipeline, env} = await TransformersApi;

      InlineCompletionTransformer.model =  InlineCompletionTransformer.defaultModels.find(model => model.name === 'DeepSeekTransformer')
      console.log('loading model', InlineCompletionTransformer.model)
      InlineCompletionTransformer.instance = pipeline(InlineCompletionTransformer.task, InlineCompletionTransformer.model.modelName, { progress_callback, quantized: true});
    }
    return this.instance;
  }
}

class DownloadManager {
  // eslint-disable-next-line @typescript-eslint/ban-types
  responses: { [key: number]: Function }
  events: EventEmitter
  current: number
  constructor() {
    this.events = new EventEmitter()
    this.responses = {}
    this.current
  }

  onMessageReceived = (e) => {
    switch (e.status) {
    case 'initiate':
      this.events.emit(e.status, e)
      // Model file start load: add a new progress item to the list.
      break;

    case 'progress':
      this.events.emit(e.status, e)
      // Model file progress: update one of the progress items.
      break;

    case 'done':
      this.events.emit(e.status, e)
      // Model file loaded: remove the progress item from the list.
      break;

    case 'ready':
      this.events.emit(e.status, e)
      // Pipeline ready: the worker is ready to accept messages.
      break;

    case 'update':
      this.events.emit(e.status, e)
      // Generation update: update the output text.
      break;

    case 'complete':
      if (this.responses[e.id]) {
        if (this.current === e.id) {
          this.responses[e.id](null, e)
        } else {
          this.responses[e.id]('aborted')
        }
        delete this.responses[e.id]
        this.current = null
      }

      // Generation complete: re-enable the "Generate" button
      break;
    }
  }

}

export class InlineCompletionServiceTransformer{
  dMng = new DownloadManager()
  isReady = false
  event = new EventEmitter()

  constructor(defaultModels) { 

    InlineCompletionTransformer.defaultModels = defaultModels
    InlineCompletionTransformer.model = defaultModels.find(model => model.name === 'DeepSeekTransformer')
    InlineCompletionTransformer.task = InlineCompletionTransformer.model.task
    InlineCompletionTransformer.getInstance(this.dMng.onMessageReceived);

    this.dMng.events.on('progress', (data) => {
      // log progress percentage 
      const loaded = ((Number(data.loaded * 100 / data.total)).toFixed(2)).toString()
      console.log('download progress:', loaded + '%')

      if (loaded === '100.00') {
        this.dMng.events.emit('done', data)
        this.isReady = true
      } 
    })
    this.dMng.events.on('done', (data) => {
      console.log('download complete')
      this.isReady = true
    })
    this.dMng.events.on('ready', (data) => {
      console.log('model ready')
      this.isReady = true
    })

  }

  async code_completion(context: any, params=completionParams): Promise<any> {
    // as of now no prompt required
    this.event.emit('onInference')
    const instance = await InlineCompletionTransformer.getInstance()
    const result =  await instance(context, completionParams)
    this.event.emit('onInferenceDone')
    return result
  }

  async code_insertion(msg_pfx: string, msg_sfx: string, params=insertionParams): Promise<any> {
    if (!this.isReady) {
      console.log('model not ready')
      return
    }
    
    this.event.emit('onInference')
    // const prompt = getInsertionPrompt(InlineCompletionTransformer.model, msg_pfx, msg_sfx)
    // const instance = await InlineCompletionTransformer.getInstance()
    // const result = instance(prompt, insertionParams)
    // this.event.emit('onInferenceDone')
    // return result
  }
}

module.exports = {
  InlineCompletionServiceTransformer
}