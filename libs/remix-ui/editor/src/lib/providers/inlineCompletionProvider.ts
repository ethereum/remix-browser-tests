/* eslint-disable no-control-regex */
import { EditorUIProps, monacoTypes } from '@remix-ui/editor';
import { CompletionTimer } from './completionTimer';

import axios, { AxiosResponse } from 'axios'
import { slice } from 'lodash';
const _paq = (window._paq = window._paq || [])

const controller = new AbortController();
const { signal } = controller;
const result: string = ''

export class RemixInLineCompletionProvider implements monacoTypes.languages.InlineCompletionsProvider {
  props: EditorUIProps
  monaco: any
  completionEnabled: boolean
  isGeneratingContract: boolean
  constructor(props: any, monaco: any) {
    this.props = props
    this.monaco = monaco
    this.completionEnabled = true
    this.isGeneratingContract = false
  }

  async provideInlineCompletions(model: monacoTypes.editor.ITextModel, position: monacoTypes.Position, context: monacoTypes.languages.InlineCompletionContext, token: monacoTypes.CancellationToken): Promise<monacoTypes.languages.InlineCompletions<monacoTypes.languages.InlineCompletion>> {
    if (context.selectedSuggestionInfo) {
      return;
    }
    const getTextAtLine = (lineNumber) => {
      const lineRange = model.getFullModelRange().setStartPosition(lineNumber, 1).setEndPosition(lineNumber + 1, 1);
      return model.getValueInRange(lineRange);
    }
    // get text before the position of the completion
    const word = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });

    // get text after the position of the completion
    const word_after = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: position.column,
      endLineNumber: model.getLineCount(),
      endColumn: getTextAtLine(model.getLineCount()).length + 1,
    });

    if (this.isSolidityComment(word) &&
        word.includes("sol-gen") &&
        this.isGeneratingContract===false &&
        word.split('\n')[word.split('\n').length-1].trim()===""){

      this.isGeneratingContract = true
      console.log("new contract generation")
      const output = await this.props.plugin.call('solcoder', 'contract_generation', word)
      _paq.push(['trackEvent', 'ai', 'solcoder', 'contract_generation'])
      const handleCompletionTimer = new CompletionTimer(5000, () => { this.isGeneratingContract = false });
      handleCompletionTimer.start()

      const item: monacoTypes.languages.InlineCompletion = {
        insertText: output[0]
      };

      return {
        items: [item],
        enableForwardStability: true
      }
    }

    if (!word.endsWith(' ') &&
      !word.endsWith('.') &&
      !word.endsWith('(')) {
      return;
    }

    try {
      const isActivate = await await this.props.plugin.call('settings', 'get', 'settings/copilot/suggest/activate')
      if (!isActivate) return
    } catch (err) {
      return;
    }

    try {
      const split = word.split('\n')
      if (split.length < 2) return

      const ask = split[split.length - 2].trimStart()
      if (split[split.length - 1].trim() === '' && ask.startsWith('///')) {
        // use the code generation model, only take max 1000 word as context
        this.props.plugin.call('terminal', 'log', { type: 'aitypewriterwarning', value: 'Solcoder - generating code for following comment: ' + ask.replace('///', '') })

        const data = await this.props.plugin.call('solcoder', 'code_generation', word)
        _paq.push(['trackEvent', 'ai', 'solcoder', 'code_generation'])

        const parsedData = data[0].trimStart() //JSON.parse(data).trimStart()
        const item: monacoTypes.languages.InlineCompletion = {
          insertText: parsedData
        };
        return {
          items: [item],
          enableForwardStability: true
        }
      }
    } catch (e) {
      console.error(e)
      return
    }

    if (word.split('\n').at(-1).trimStart().startsWith('//') ||
        word.split('\n').at(-1).trimStart().startsWith('/*') ||
        word.split('\n').at(-1).trimStart().startsWith('*') ||
        word.split('\n').at(-1).trimStart().startsWith('*/') ||
        word.split('\n').at(-1).endsWith(';')
    ){
      return; // do not do completion on single and multiline comment
    }

    // abort if there is a signal
    if (token.isCancellationRequested) {
      return
    }

    // abort if the completion is not enabled
    if (!this.completionEnabled) {
      return
    }

    if (word.replace(/ +$/, '').endsWith('\n')){
      // Code insertion
      try {
        const output = await this.props.plugin.call('solcoder', 'code_insertion', word, word_after)
        _paq.push(['trackEvent', 'ai', 'solcoder', 'code_insertion'])
        const generatedText = output[0] // no need to clean it. should already be

        const item: monacoTypes.languages.InlineCompletion = {
          insertText: generatedText
        };

        this.completionEnabled = false
        const handleCompletionTimer = new CompletionTimer(5000, () => { this.completionEnabled = true });
        handleCompletionTimer.start()

        return {
          items: [item],
          enableForwardStability: true
        }
      }
      catch (err){
        return
      }
    }

    let result
    try {
      // Code completion
      const output = await this.props.plugin.call('solcoder', 'code_completion', word)
      _paq.push(['trackEvent', 'ai', 'solcoder', 'code_completion'])
      const generatedText = output[0]
      let clean = generatedText

      if (generatedText.indexOf('@custom:dev-run-script./') !== -1) {
        clean = generatedText.replace('@custom:dev-run-script', '@custom:dev-run-script ')
      }
      clean = clean.replace(word, '').trimStart()
      clean = this.process_completion(clean)

      const item: monacoTypes.languages.InlineCompletion = {
        insertText: clean
      };

      // handle the completion timer by locking suggestions request for 2 seconds
      this.completionEnabled = false
      const handleCompletionTimer = new CompletionTimer(2000, () => { this.completionEnabled = true });
      handleCompletionTimer.start()

      return {
        items: [item],
        enableForwardStability: true
      }
    } catch (err) {
      return
    }
  }

  isSolidityComment(text: string): boolean {
    const joinedText = text.trim().replace(/\n\s*/g, ' ');

    const singleLineComment = /^\/\/.*$/;
    const multiLineComment = /^\/\*[\s\S]*\*\/$/;
    const singleLineNatSpec = /^\/\/\/.*$/;
    const multiLineNatSpec = /^\/\*\*[\s\S]*\*\/$/;

    return singleLineComment.test(joinedText) ||
           multiLineComment.test(joinedText) ||
           singleLineNatSpec.test(joinedText) ||
           multiLineNatSpec.test(joinedText);
  }

  process_completion(data: any) {
    let clean = data.split('\n')[0].startsWith('\n') ? [data.split('\n')[0], data.split('\n')[1]].join('\n'): data.split('\n')[0]

    // if clean starts with a comment, remove it
    if (clean.startsWith('//') || clean.startsWith('/*') || clean.startsWith('*') || clean.startsWith('*/')){
      return ""
    }
    // remove comment inline
    clean = clean.split('//')[0].trimEnd()
    return clean
  }

  handleItemDidShow?(completions: monacoTypes.languages.InlineCompletions<monacoTypes.languages.InlineCompletion>, item: monacoTypes.languages.InlineCompletion, updatedInsertText: string): void {

  }
  handlePartialAccept?(completions: monacoTypes.languages.InlineCompletions<monacoTypes.languages.InlineCompletion>, item: monacoTypes.languages.InlineCompletion, acceptedCharacters: number): void {

  }
  freeInlineCompletions(completions: monacoTypes.languages.InlineCompletions<monacoTypes.languages.InlineCompletion>): void {

  }
  groupId?: string;
  yieldsToGroupIds?: string[];
  toString?(): string {
    throw new Error('Method not implemented.');
  }
}
