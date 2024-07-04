import React, { useContext, useEffect, useState } from 'react'
import '../remix-ai.css'
import { DefaultModels } from '@remix/remix-ai-core';

export const Default = (props) => {
  const [searchText, setSearchText] = useState('');
  const [resultText, setResultText] = useState('');
  const pluginName = props.plugin.isOnDesktop ? 'remixAID' : 'remixAI'

  return (
    <div>
      <div className="remix_ai_plugin_search_container">
        <input
          type="text"
          className="remix_ai_plugin_search-input"
          placeholder="Search..."
          value={searchText}
          onChange={() => console.log('searchText not implememted')}
        ></input>
        <button
          className="remix_ai_plugin_search_button text-ai pl-2 pr-0 py-0 d-flex"
          onClick={() => console.log('searchText not implememted')}
        >
          <i
            className="fa-solid fa-arrow-right"
            style={{ color: 'black' }}
          ></i>
          <span className="position-relative text-ai text-sm pl-1"
            style={{fontSize: "x-small", alignSelf: "end"}}>Search</span>
        </button>

        <button className="remix_ai_plugin_download_button text-ai pl-2 pr-0 py-0 d-flex"

          onClick={async () => {
            if (props.plugin.isOnDesktop ) {
              await props.plugin.call(pluginName, 'downloadModel', DefaultModels()[0]);
            }
          }}
        > Download Model </button>

      </div>
      
      <div className="remix_ai_plugin_find_container_internal">
        <textarea
          className="remix_ai_plugin_search_result_textbox"
          rows={10}
          cols={50}
          placeholder="Results..."
          value={resultText}
          readOnly
        />
        <button className="remix_ai_plugin_download_button text-ai pl-2 pr-0 py-0 d-flex"

          onClick={async () => {
            if (props.plugin.isOnDesktop ) {
              // const completer = new InlineCompletionServiceTransformer();
              // if (!completer.ready) {
              //   await completer.init();
              // }
              await props.plugin.call(pluginName, 'loadTransformerModel', DefaultModels());

              // // const code = completer.code_completion("pragma solidity ^0.8.0;\n")
              console.log("Got transformer model completion ");
              const result = await props.plugin.call(pluginName, 'code_completion', "pragma solidity ^0.8.0;\n contract Storage");
              console.log("Got code completion\n",result);
              // const inferenceModel = await props.plugin.call(pluginName, 'getInferenceModel');
              // console.log("Got inference model ",inferenceModel);

              // const result = await inferenceModel.prompt("What is the meaning of life?");
              // console.log("Got result ",result);

            }
          }}
        > Test inference </button>
      </div>
      <div className="remix_ai_plugin_find-part">
        <a href="#" className="remix_ai_plugin_search_result_item_title">/fix the problems in my code</a>
        <a href="#" className="remix_ai_plugin_search_result_item_title">/tests add unit tests for my code</a>
        <a href="#" className="remix_ai_plugin_search_result_item_title">/explain how the selected code works</a>
      </div>
    </div>
  );
}