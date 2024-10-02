import React, { useContext, useEffect, useState } from 'react'
import '../remix-ai.css'
import { DefaultModels, GenerationParams, ChatHistory, HandleStreamResponse } from '@remix/remix-ai-core';
import { StreamSend, StreamingAdapterObserver } from '@nlux/react';
import axios from 'axios';
import { AiChat, useAsStreamAdapter, ChatItem} from '@nlux/react';
import '@nlux/themes/nova.css';
import { JsonStreamParser } from '@remix/remix-ai-core';
import { user, assistantAvatar } from './personas';

const demoProxyServerUrl = 'https://solcoder.remixproject.org';
let chatobserver: StreamingAdapterObserver = null


export const Default = (props) => {
  const send: StreamSend = async (
    prompt: string,
    observer: StreamingAdapterObserver,
  ) => {
    chatobserver = observer
    GenerationParams.stream_result = true
    GenerationParams.return_stream_response = true

    const response = await props.plugin.call('remixAI', 'solidity_answer', prompt, GenerationParams);
    HandleStreamResponse(response, 
      (text) => {observer.next(text)},
      (result) => { 
        ChatHistory.pushHistory(prompt, result)
        observer.complete() }
    )

  };

  // Define initial messages
  const initialMessages: ChatItem[] = [
    {
      role: 'assistant',
      message: 'Welcome to Remix AI! How can I assist you today?'
    }
  ];
  const adapter = useAsStreamAdapter(send, []);

  return (
    <AiChat
      adapter={ adapter }
      personaOptions={{
        assistant: {
          name: "Remix AI",
          tagline: "Your Web3 AI Assistant",
          avatar: assistantAvatar
        },
        user
        
      }}
      //initialConversation={initialMessages}
      conversationOptions={{ layout: 'bubbles' }}
      displayOptions={{ colorScheme: "auto" }}
      composerOptions={{ placeholder: "Type your query",
        submitShortcut: 'Enter',
        hideStopButton: false,
      }}
      messageOptions={{ showCodeBlockCopyButton: true,
        streamingAnimationSpeed: 2,
        waitTimeBeforeStreamCompletion: 1000,
      }}
    />
  );
};

// export const Default = (props) => {
//   const [searchText, setSearchText] = useState('');
//   const [resultText, setResultText] = useState('');
//   const pluginName = 'remixAI'
//   const appendText = (newText) => {
//     setResultText(resultText => resultText + newText);
//   }

//   useEffect(() => {
//     const handleResultReady = async (e) => {
//       appendText(e);
//     };
//     if (props.plugin.isOnDesktop ) {
//       props.plugin.on(props.plugin.remixDesktopPluginName, 'onStreamResult', (value) => {
//         handleResultReady(value);
//       })
//     }
//   }, [])

//   return (
//     <div>
//       <div className="remix_ai_plugin_search_container">
//         <input
//           type="text"
//           className="remix_ai_plugin_search-input"
//           placeholder="Search..."
//           value={searchText}
//           onChange={() => console.log('searchText not implememted')}
//         ></input>
//         <button
//           className="remix_ai_plugin_search_button text-ai pl-2 pr-0 py-0 d-flex"
//           onClick={() => console.log('searchText not implememted')}
//         >
//           <i
//             className="fa-solid fa-arrow-right"
//             style={{ color: 'black' }}
//           ></i>
//           <span className="position-relative text-ai text-sm pl-1"
//             style={{ fontSize: "x-small", alignSelf: "end" }}>Search</span>
//         </button>

//         <button className="remix_ai_plugin_download_button text-ai pl-2 pr-0 py-0 d-flex"

//           onClick={async () => {
//             if (props.plugin.isOnDesktop ) {
//               await props.plugin.call(pluginName, 'downloadModel', DefaultModels()[3]);
//             }
//           }}
//         > Download Model </button>

//       </div>

//       <div className="remix_ai_plugin_find_container_internal">
//         <textarea
//           className="remix_ai_plugin_search_result_textbox"
//           rows={10}
//           cols={50}
//           placeholder="Results..."
//           onChange={(e) => {
//             console.log('resultText changed', e.target.value)
//             setResultText(e.target.value)}
//           }
//           value={resultText}
//           readOnly
//         />
//         <button className="remix_ai_plugin_download_button text-ai pl-2 pr-0 py-0 d-flex"

//           onClick={async () => {
//             props.plugin.call("remixAI", 'initialize', DefaultModels()[1], DefaultModels()[3]);
//           }}
//         > Init Model </button>
//       </div>
//       <div className="remix_ai_plugin_find-part">
//         <a href="#" className="remix_ai_plugin_search_result_item_title">/fix the problems in my code</a>
//         <a href="#" className="remix_ai_plugin_search_result_item_title">/tests add unit tests for my code</a>
//         <a href="#" className="remix_ai_plugin_search_result_item_title">/explain how the selected code works</a>
//       </div>
//     </div>
//   );
// }