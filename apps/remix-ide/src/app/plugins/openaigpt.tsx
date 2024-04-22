import { Plugin } from '@remixproject/engine'
import { CreateChatCompletionResponse } from 'openai'
import axios, { AxiosInstance } from 'axios'
import https from 'https'

const _paq = (window._paq = window._paq || [])

const profile = {
  name: 'openaigpt',
  displayName: 'openaigpt',
  description: 'openaigpt',
  methods: ['message'],
  events: [],
  maintainedBy: 'Remix',
}

export class OpenAIGpt extends Plugin {
  constructor() {
    super(profile)
  }

  async message(prompt): Promise<CreateChatCompletionResponse> {
    this.call('layout', 'maximizeTerminal')
    this.call('terminal', 'log', { type: 'aitypewriterwarning', value: 'Waiting for GPT answer...' })
    let result
    try {

      const axiosInstance: AxiosInstance = axios.create({
        httpsAgent: new https.Agent({
          rejectUnauthorized: process && process.env && process.env['NX_API_URL']? false : true // This will ignore SSL certificate errors in CIRCLECI
        })
      }); 

      const response = await axiosInstance.post( process && process.env && process.env['NX_API_URL']? `${process.env['NX_API_URL']}openai-gpt/` : `https://openai-gpt.remixproject.org`,
        { prompt }, 
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      result = response.data; // Axios automatically parses the JSON response

    } catch (e) {
      this.call('terminal', 'log', { type: 'typewritererror', value: `Unable to get a response ${e.message}` })
      return
    }

    if (result && result.choices && result.choices.length) {
      this.call('terminal', 'log', { type: 'aitypewriterwarning', value: result.choices[0].message.content })
    } else if (result.error) {
      this.call('terminal', 'log', { type: 'aitypewriterwarning', value: result.error })
    } else {
      this.call('terminal', 'log', { type: 'aitypewriterwarning', value: 'No response...' })
    }
    return result.data
  }
}
