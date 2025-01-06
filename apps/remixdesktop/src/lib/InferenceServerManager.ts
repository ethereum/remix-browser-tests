import path, { resolve } from 'path';
const { spawn } = require('child_process'); // eslint-disable-line
import fs from 'fs';
import axios from "axios";
import { EventEmitter } from 'events';
import { ICompletions, IModel, IParams, InsertionParams,
  CompletionParams, GenerationParams, ModelType, AIRequestType,
  IStreamResponse, ChatHistory, downloadLatestReleaseExecutable,
  buildSolgptPromt } from "@remix/remix-ai-core"
import { platform } from 'os';

class ServerStatusTimer {
  private intervalId: NodeJS.Timeout | null = null;
  public interval: number;
  private task: () => void;

  constructor(task: () => void, interval: number) {
    this.task = task;
    this.interval = interval;
  }

  start(): void {
    if (this.intervalId === null) {
      this.intervalId = setInterval(() => {
        this.task();
      }, this.interval);
    }
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }
}

export class InferenceManager implements ICompletions {
  isReady: boolean = false
  selectedModels: IModel[] = []
  event: EventEmitter
  modelCacheDir: string = undefined
  serverCacheDir: string = undefined
  private inferenceProcess: any=null
  port = 5501
  inferenceURL = 'http://127.0.0.1:' + this.port
  private static instance=null
  stateTimer: ServerStatusTimer

  private constructor(modelDir:string) {
    this.event = new EventEmitter()
    this.modelCacheDir = path.join(modelDir, 'models')
    this.serverCacheDir = path.join(modelDir, 'inferenceServer')
    this.stateTimer= new ServerStatusTimer(() => { this._processStatus()}, 20000)
  }

  static getInstance(modelDir:string){
    if (!InferenceManager.instance) {
      // check if there is a process already running
      if (!modelDir) {
        console.error('model directory is required to create InferenceManager instance')
        return null
      }
      console.log('Creating new InferenceManager instance')
      InferenceManager.instance = new InferenceManager(modelDir)
    }
    return InferenceManager.instance
  }

  // init the backend with a new model
  async init(model:IModel) {
    try {
      await this._downloadModel(model)

      if (model.downloadPath === undefined) {
        console.log('Model not downloaded or not found')
        return
      }

      console.log('Model downloaded at', model.downloadPath)

      if (this.inferenceProcess === null) await this._startServer()

      // check if resources are met before initializing the models
      this._handleResources(true)

      console.log('Initializing model request', model.modelType)
      switch (model.modelType) {
      case ModelType.CODE_COMPLETION_INSERTION || ModelType.CODE_COMPLETION:{
        console.log('Initializing Completion Model')
        const res = await this._makeRequest('init_completion', { model_path: model.downloadPath })

        console.log('code completion res is', res?.data?.status)
        if (res?.data?.status === "success") {
          this.isReady = true
          console.log('Completion Model initialized successfully')
        } else {
          this.isReady = false
          console.error('Error initializing the model', res.data?.error)
        }
        break;
      }

      case ModelType.GENERAL:{
        const res = await this._makeRequest('init', { model_path: model.downloadPath })

        if (res.data?.status === "success") {
          this.isReady = true
          console.log('General Model initialized successfully')
        } else {
          this.isReady = false
          console.error('Error initializing the model', res.data?.error)
        }
        break;
      }
      }

      this.stateTimer.start() // double call on init completion and general
      this.selectedModels.push(model)
    } catch (error) {
      console.error('Error initializing the model', error)
      this.isReady = false
      InferenceManager.instance = null
    }
  }

  async _processStatus() {

    // check if the server is running
    const options = { headers: { 'Content-Type': 'application/json', } }
    const state = await axios.get(this.inferenceURL+"/state", options)

    if (!state.data?.status) {
      console.log('Inference server not running')
      InferenceManager.instance = null
      this.stateTimer.interval += this.stateTimer.interval

      if (this.stateTimer.interval >= 60000) {
        // attempt to restart the server
        console.log('Attempting to restart the server')
        this.stopInferenceServer()
        this._startServer()
        this.stateTimer.interval = 20000
      }
    } else {
      // Server is running with successful request
      // console.log('Inference server is running')
      // console.log('completion is running', state.data?.completion)
      // console.log('general is running', state.data?.general)
    }
    // this._handleResources()
  }

  async _handleResources(logger:boolean=false) {
    // check resource usage
    const options = { headers: { 'Content-Type': 'application/json', } }
    const res = await axios.get(this.inferenceURL+"/sys", options)

    if (res.data?.status) {
      const max_memory = res.data.memory.total
      const used_memory = res.data.memory.used
      const memory_usage = res.data.memory.percent * 100
      const gpu_available = res.data.gpus

      for (const model of this.selectedModels) {
        if (model.modelReqs.minSysMemory > max_memory) {
          if (logger) console.warn('Insufficient memory for the model')
        }

        if (model.modelReqs.minSysMemory > used_memory) {
          if (logger) console.warn('Insufficient memory for the model')
        }
        if (model.modelReqs.GPURequired) {
          if (gpu_available.length < 1) {
            if (logger)console.warn('GPU required for desktop inference but not available')
          }
        }
      }
    }
  }

  async _downloadModel(model:IModel): Promise<string> {
    if (this.modelCacheDir === undefined) {
      console.log('Model cache directory not provided')
      return
    } else {
      const outputLocationPath = path.join(this.modelCacheDir, model.modelName);
      console.log('output location path is', outputLocationPath)
      if (fs.existsSync(outputLocationPath)) {
        model.downloadPath = outputLocationPath
        console.log('Model already exists in the output location', outputLocationPath);
        return;
      }

      console.log('Downloading model from', model.downloadUrl);
      // Make a HEAD request to get the file size
      const { headers } = await axios.head(model.downloadUrl);
      const totalSize = parseInt(headers['content-length'], 10);

      // Create a write stream to save the file
      const writer = fs.createWriteStream(outputLocationPath);

      // Start the file download
      const response = await axios({
        method: 'get',
        url: model.downloadUrl,
        responseType: 'stream'
      });

      let downloadedSize = 0;

      response.data.on('data', (chunk: Buffer) => {
        downloadedSize += chunk.length;
        const progress = (Number((downloadedSize / totalSize) * 100).toFixed(2));
        console.log(`Downloaded ${progress}%`);
        this.event.emit('download', progress);
      });

      response.data.pipe(writer);

      this.event.emit('ready')
      model.downloadPath = outputLocationPath
      console.log('LLama Download complete');

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    }
  }

  private async _downloadInferenceServer() {
    const execPath = this._getServerPath()
    try {
      if (fs.existsSync(execPath)) {
        console.log('Inference server already downloaded')
        return true
      } else {
        downloadLatestReleaseExecutable(process.platform, this.serverCacheDir)
        if (fs.existsSync(execPath)) {return true } else {return false}
      }
    } catch (error) {
      console.error('Error downloading Inference server:', error)
      return false
    }
  }

  private _getServerPath() {
    // get cpu arch
    const arch = process.arch
    let exec_suffix = ''

    if (arch === 'x64') {
      exec_suffix = 'x64'
    } else if (arch === 'arm' || arch === 'arm64') {
      exec_suffix = 'arm'
    } else {
      throw new Error('Unsupported CPU architecture')
    }

    // get platform name and return the path to the python script
    let exec_name = ''
    if (process.platform === 'win32') {
      exec_name = 'InferenceServer-' + process.platform + '.exe'
    } else if (process.platform === 'linux') {
      exec_name = 'InferenceServer-' + process.platform + '_' + exec_suffix
    } else if (process.platform === 'darwin') {
      exec_name = 'InferenceServer-' + 'mac'
    } else {
      throw new Error('Unsupported platform')
    }
    return path.join(this.serverCacheDir, exec_name);

  }

  private async _handleExistingServer() {
    // check if the server is already running, kill it
    try {
      const options = { headers: { 'Content-Type': 'application/json', } }
      const state = await axios.get(this.inferenceURL+"/state", options)

      if (state.data?.status) {
        console.log('Found existing Inference server running')
        this.stopInferenceServer()
        await axios.post(this.inferenceURL+"/kill", options)
      }
    } catch (error) {
      // catch connection refused
      console.log('No existing Inference server running')
    }
  }

  private async _startServer() {
    const serverAvailable = await this._downloadInferenceServer()
    if (!serverAvailable) {
      console.error('Inference server not available for this platform')
      return
    }

    // kill existing server if running
    this._handleExistingServer()

    return new Promise<void>((resolve, reject) => {
      let serverPath = ""
      try {
        serverPath = this._getServerPath();
        fs.chmodSync(serverPath, '755')
      } catch (error) {
        console.error('Error script path:', error);
        return reject(error)
      }

      // Check if the file exists
      if (!fs.existsSync(serverPath)) {
        return reject(new Error(`Inference server not found at ${serverPath}`));
      }

      // Check file permissions
      try {
        fs.accessSync(serverPath, fs.constants.X_OK);
      } catch (err) {
        reject(new Error(`No execute permission on ${serverPath}`));
      }

      const spawnArgs = [this.port];

      // console.log(`Spawning process: ${serverPath} ${spawnArgs.join(' ')}`);
      this.inferenceProcess = spawn(serverPath, spawnArgs);

      this.inferenceProcess.stdout.on('data', (data) => {
        console.log(`Inference server output: ${data}`);
        if (data.includes('Running on http://')) {
          console.log('Inference server started successfully');
          resolve();
        }
      });

      this.inferenceProcess.stderr.on('data', (data) => {
        console.error(`Inference log: ${data}`);
        if (data.includes('Address already in use')) {
          console.error(`Port ${this.port} is already in use. Please stop the existing server and try again`);
          reject(new Error(`Port ${this.port}  is already in use`));
        }
        resolve();
      });

      this.inferenceProcess.on('error', (err) => {
        console.error('Failed to start Inference server:', err);
        reject(err);
      });

      this.inferenceProcess.on('close', (code) => {
        console.log(`Inference server process exited with code ${code}`);
        if (code !== 0) {
          reject(new Error(`Inference server exited with code ${code}`));
        }
      });
    });
  }

  stopInferenceServer() {
    if (this.inferenceProcess) {
      this.inferenceProcess.kill();
      this.inferenceProcess = null;
    }
  }

  private async _makeInferenceRequest(endpoint, payload, rType:AIRequestType){
    try {
      this.event.emit('onInference')
      const options = { headers: { 'Content-Type': 'application/json', } }
      const response = await axios.post(`${this.inferenceURL}/${endpoint}`, payload, options)

      const userPrompt = payload[Object.keys(payload)[0]]
      this.event.emit('onInferenceDone')

      if (response.data?.generatedText) {
        if (rType === AIRequestType.GENERAL) {
          ChatHistory.pushHistory(userPrompt, response.data.generatedText)
        }
        return response.data.generatedText
      } else { return "" }
    } catch (error) {
      ChatHistory.clearHistory()
      console.error('Error making request to Inference server:', error.message);
    }
  }

  private async _streamInferenceRequest(endpoint, payload){
    try {
      this.event.emit('onInference')
      const options = { headers: { 'Content-Type': 'application/json', } }
      const response = await axios({
        method: 'post',
        url: `${this.inferenceURL}/${endpoint}`,
        data: payload,
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
        }
        , responseType: 'stream' });

      const userPrompt = payload.prompt
      let resultText = ""
      if (payload.return_stream_response) {
        return response
      }
      
      response.data.on('data', (chunk: Buffer) => {
        try {
          const parsedData = JSON.parse(chunk.toString());
          if (parsedData.isGenerating) {
            this.event.emit('onStreamResult', parsedData.generatedText);
            resultText = resultText + parsedData.generatedText
          } else {
            resultText = resultText + parsedData.generatedText

            // no additional check for streamed results
            ChatHistory.pushHistory(userPrompt, resultText)
            return parsedData.generatedText
          }

        } catch (error) {
          ChatHistory.clearHistory()
          console.error('Error parsing JSON:', error);
        }
      });

      return "" // return empty string for now as payload is/will be handled in event
    } catch (error) {
      ChatHistory.clearHistory()
      console.error('Error making stream request to Inference server:', error.message);
    }
    finally {
      this.event.emit('onInferenceDone')
    }
  }

  private async _makeRequest(endpoint, payload){
    // makes a simple request to the inference server
    try {
      const options = { headers: { 'Content-Type': 'application/json', } }
      const response = await axios.post(`${this.inferenceURL}/${endpoint}`, payload, options)
      this.event.emit('onInferenceDone')

      return response
    } catch (error) {
      console.error('Error making request to Inference server:', error.message);
    }
  }

  async code_completion(prompt, promptAfter, params:IParams=CompletionParams): Promise<any> {
    if (!this.isReady) {
      console.log('model not ready yet')
      return
    }

    // as of now no prompt required
    const payload = { prompt, 'context':promptAfter, ...params }
    return this._makeInferenceRequest('code_completion', payload, AIRequestType.COMPLETION)
  }

  async code_insertion(msg_pfx: string, msg_sfx: string, params:IParams=InsertionParams): Promise<any> {
    if (!this.isReady) {
      console.log('model not ready yet')
      return
    }
    const payload = { code_pfx:msg_pfx, code_sfx:msg_sfx, ...params }
    return this._makeInferenceRequest('code_insertion', payload, AIRequestType.COMPLETION)

  }

  async code_generation(prompt: string, params:IParams=GenerationParams): Promise<any> {
    if (!this.isReady) {
      console.log('model not ready yet')
      return
    }
    return this._makeInferenceRequest('code_generation', { prompt, ...params }, AIRequestType.GENERAL)
  }

  async code_explaining(code:string, context:string, params:IParams=GenerationParams): Promise<any> {
    if (!this.isReady) {
      console.log('model not ready yet')
      return
    }
    if (params.stream_result) {
      return this._streamInferenceRequest('code_explaining', { prompt: code, context, ...params })
    } else {
      return this._makeInferenceRequest('code_explaining', { prompt: code, context, ...params }, AIRequestType.GENERAL)
    }
  }

  async error_explaining(prompt: string, params:IParams=GenerationParams): Promise<any>{
    if (!this.isReady) {
      console.log('model not ready yet')
      return ""
    }
    if (params.stream_result) {
      return this._streamInferenceRequest('error_explaining', { prompt, ...params })
    } else {
      return this._makeInferenceRequest('error_explaining', { prompt, ...params }, AIRequestType.GENERAL)
    }
  }

  async solidity_answer(userPrompt: string, params:IParams=GenerationParams): Promise<any> {
    if (!this.isReady) {
      console.log('model not ready yet')
      return
    }
    let modelOP = undefined
    for (const model of this.selectedModels) {
      if (model.modelType === ModelType.GENERAL) {
        modelOP = model.modelOP
      }
    }
    const prompt = buildSolgptPromt(userPrompt, modelOP)

    if (params.stream_result) {
      return this._streamInferenceRequest('solidity_answer', { prompt, ...params })
    } else {
      return this._makeInferenceRequest('solidity_answer', { prompt, ...params }, AIRequestType.GENERAL)
    }
  }

}
