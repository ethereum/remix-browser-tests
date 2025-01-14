import React, { useState, useEffect } from 'react'
import '../remix-ai.css'
import { DefaultModels, GenerationParams, ChatHistory, HandleStreamResponse } from '@remix/remix-ai-core';
import { ConversationStarter, StreamSend, StreamingAdapterObserver, useAiChatApi } from '@nlux/react';
import { AiChat, useAsStreamAdapter, ChatItem } from '@nlux/react';
import { user, assistantAvatar } from './personas';
import { highlighter } from '@nlux/highlighter'
import './color.css'
import '@nlux/themes/unstyled.css';
import copy from 'copy-to-clipboard'

export let ChatApi = null

export const Default = (props) => {
  const [is_streaming, setIS_streaming] = useState<boolean>(false)

  const HandleCopyToClipboard = () => {
    const markdown = document.getElementsByClassName('nlux-chatSegments-container')
    if (markdown.length < 1) return

    const codeBlocks = markdown[0].getElementsByClassName('code-block')
    Array.from(codeBlocks).forEach((block) => {
      const copyButtons = block.getElementsByClassName('nlux-comp-copyButton')
      Array.from(copyButtons).forEach((cp_btn) => {
        const hdlr = async () => {
          copy(block.textContent)
        }
        cp_btn.removeEventListener('click', async() => { hdlr() })
        cp_btn.addEventListener('click', async () => { hdlr() })
      })
    })
  }

  useEffect(() => {
    HandleCopyToClipboard();
  }, [is_streaming]);

  const send: StreamSend = async (
    prompt: string,
    observer: StreamingAdapterObserver,
  ) => {
    GenerationParams.stream_result = true
    setIS_streaming(true)
    GenerationParams.return_stream_response = GenerationParams.stream_result

    let response = null
    if (await props.plugin.call('remixAI', 'isChatRequestPending')){
      response = await props.plugin.call('remixAI', 'ProcessChatRequestBuffer', GenerationParams);
    } else {
      response = await props.plugin.call('remixAI', 'solidity_answer', prompt, GenerationParams);
    }

    if (GenerationParams.return_stream_response) HandleStreamResponse(response,
      (text) => {observer.next(text)},
      (result) => {
        observer.next(' ') // Add a space to flush the last message
        ChatHistory.pushHistory(prompt, result)
        observer.complete()
        setTimeout(() => { setIS_streaming(false) }, 1000)
      }
    )
    else {
      observer.next(response)
      observer.complete()

      setTimeout(() => { setIS_streaming(false) }, 1000)
    }
  };
  ChatApi = useAiChatApi();
  const conversationStarters: ConversationStarter[] = [
    { prompt: 'Explain what is a solidity contract!' },
    { prompt: 'Explain briefly the current file in Editor' }]

  // Define initial messages
  const initialMessages: ChatItem[] = [
    {
      role: 'assistant',
      message: 'Welcome to RemixAI! How can I assist you today?'
    }
  ];
  const adapter = useAsStreamAdapter(send, []);

  return (
    <AiChat
      api={ChatApi}
      adapter={ adapter }
      personaOptions={{
        assistant: {
          name: "RemixAI",
          tagline: "Your Web3 AI Assistant",
          avatar: assistantAvatar
        },
        user
      }}
      //initialConversation={initialMessages}
      conversationOptions={{ layout: 'bubbles', conversationStarters }}
      displayOptions={{ colorScheme: "auto", themeId: "remix_ai_theme" }}
      composerOptions={{ placeholder: "Type your query",
        submitShortcut: 'Enter',
        hideStopButton: false,
      }}
      messageOptions={{ showCodeBlockCopyButton: true,
        editableUserMessages: true,
        streamingAnimationSpeed: 1,
        waitTimeBeforeStreamCompletion: 1000,
        syntaxHighlighter: highlighter
      }}
    />
  );
};