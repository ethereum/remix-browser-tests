import { RemoteBackendOPModel } from "../types/types"
import { ChatHistory } from "./chat"

export const PromptBuilder = (inst, answr, modelop) => {
  if (modelop === RemoteBackendOPModel.CODELLAMA) return `<|eot_id|>\n<|start_header_id|>user<|end_header_id|>${inst}<|eot_id|>\n<|start_header_id|>assistant<|end_header_id|> ${answr}\n`
  if (modelop === RemoteBackendOPModel.DEEPSEEK) return "\n### INSTRUCTION:\n" + inst + "\n### RESPONSE:\n" + answr
  if (modelop === RemoteBackendOPModel.MISTRAL) return ""
}

export const buildSolgptPrompt = (userPrompt:string, modelOP:RemoteBackendOPModel) => {
  if (modelOP === undefined) {
    console.log('WARNING: modelOP is undefined. Provide a valid model OP for chat history')
    return userPrompt
  }
  if (ChatHistory.getHistory().length === 0){
    return userPrompt
  } else {
    let newPrompt = ""
    for (const [question, answer] of ChatHistory.getHistory()) {
      if (question.startsWith('sol-gpt')) newPrompt += PromptBuilder(question.split('sol-gpt')[1], answer, modelOP)
      else if (question.startsWith('gpt')) newPrompt += PromptBuilder(question.split('gpt')[1], answer, modelOP)
      else newPrompt += PromptBuilder(question, answer, modelOP)
    }

    // remove sol-gpt or gpt from the start of the prompt
    const parsedPrompt = userPrompt.replace(/^sol-gpt|^gpt/gm, '')
    newPrompt = "sol-gpt " + newPrompt + PromptBuilder(parsedPrompt, "", modelOP)
    return newPrompt
  }
}
