import { IParams } from "@remix/remix-ai-core";
import { StatusEvents } from "@remixproject/plugin-utils";

export interface IRemixAID {
  events: {
    activated():void,
    onInference():void,
    onInferenceDone():void,
    onStreamResult(streamText: string):void,

  } & StatusEvents,
  methods: {
    code_completion(context: string): Promise<string> 
    code_insertion(msg_pfx: string, msg_sfx: string): Promise<string>,
    code_generation(prompt: string): Promise<string | null>,
    code_explaining(code: string, context?: string): Promise<string | null>,
    error_explaining(prompt: string): Promise<string | null>,
    solidity_answer(prompt: string): Promise<string | null>,
    initializeModelBackend(local: boolean, generalModel?, completionModel?): Promise<boolean>,
    chatPipe(pipeMessage: string): Promise<void>,
    ProcessChatRequestBuffer(params:IParams): Promise<void>,
  }
}
