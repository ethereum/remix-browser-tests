/// constants for modelselection

export enum ModelType {
    CODE_COMPLETION = 'code_completion',
    GENERAL = 'general',
    CODE_COMPLETION_INSERTION = 'code_completion_insertion',
  }

export const COMPLETION_SYSTEM_PROMPT = "You are a Solidity AI Assistant that completes user code with provided context. You provide accurate solution and always answer as helpfully as possible, while being safe. You only provide code using this context:\n"
