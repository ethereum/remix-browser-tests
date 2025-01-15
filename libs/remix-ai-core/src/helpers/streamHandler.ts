import { ChatHistory } from '../prompts/chat';
import { JsonStreamParser } from '../types/types'

export const HandleSimpleResponse = async (response,
  cb?: (streamText: string) => void) => {
  let resultText = ''
  const parser = new JsonStreamParser();

  const chunk = parser.safeJsonParse<{ generatedText: string; isGenerating: boolean }>(response);
  for (const parsedData of chunk) {
    if (parsedData.isGenerating) {
      resultText += parsedData.generatedText
      cb(parsedData.generatedText)
    } else {
      resultText += parsedData.generatedText
      cb(parsedData.generatedText)
    }
  }
}

export const HandleStreamResponse = async (streamResponse,
  cb: (streamText: string) => void,
  done_cb?: (result: string) => void) => {
  try {
    let resultText = ''
    const parser = new JsonStreamParser();
    const reader = streamResponse.body?.getReader();
    const decoder = new TextDecoder();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      try {
        const chunk = parser.safeJsonParse<{ generatedText: string; isGenerating: boolean }>(decoder.decode(value, { stream: true }));
        for (const parsedData of chunk) {
          if (parsedData.isGenerating) {
            resultText += parsedData.generatedText
            cb(parsedData.generatedText)
          } else {
            resultText += parsedData.generatedText
            cb(parsedData.generatedText)
          }
        }
      }
      catch (error) {
        console.error('Error parsing JSON:', error);
        return { 'generateText': 'Try again!', 'isGenerating': false }
      }
    }
    if (done_cb) {
      done_cb(resultText)
    }
  }
  catch (error) {
    console.error('Error parsing JSON:', error);
    return { 'generateText': 'Try again!', 'isGenerating': false }
  }
}

export const UpdateChatHistory = (userPrompt: string, AIAnswer: string) => {
  ChatHistory.pushHistory(userPrompt, AIAnswer)
}
