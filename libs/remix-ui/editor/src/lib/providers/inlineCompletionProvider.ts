/* eslint-disable no-control-regex */
import { EditorUIProps, monacoTypes } from '@remix-ui/editor';
import { JsonStreamParser } from '@remix/remix-ai-core';
import * as monaco from 'monaco-editor';

const _paq = (window._paq = window._paq || [])

export class RemixInLineCompletionProvider implements monacoTypes.languages.InlineCompletionsProvider {
  props: EditorUIProps
  monaco: any
  completionEnabled: boolean
  task: string
  currentCompletion: any
  private lastRequestTime: number = 0;
  private readonly minRequestInterval: number = 200;

  constructor(props: any, monaco: any) {
    this.props = props
    this.monaco = monaco
    this.completionEnabled = true
    this.currentCompletion = {
      text: '',
      item: [],
      task : this.task,
      displayed: false,
      accepted: false
    }
  }

  async provideInlineCompletions(model: monacoTypes.editor.ITextModel, position: monacoTypes.Position, context: monacoTypes.languages.InlineCompletionContext, token: monacoTypes.CancellationToken): Promise<monacoTypes.languages.InlineCompletions<monacoTypes.languages.InlineCompletion>> {
    const isActivate = await await this.props.plugin.call('settings', 'get', 'settings/copilot/suggest/activate')
    if (!isActivate) return

    const currentTime = Date.now();
    const timeSinceLastRequest = currentTime - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      return { items: []}; // dismiss the request
    }
    this.lastRequestTime = Date.now();

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

    if (!word.endsWith(' ') &&
      !word.endsWith('.') &&
      !word.endsWith('(')) {
      return;
    }

    try {
      const split = word.split('\n')
      if (split.length < 2) return
      const ask = split[split.length - 2].trimStart()
      if (split[split.length - 1].trim() === '' && ask.startsWith('///')) {
        // use the code generation model, only take max 1000 word as context
        this.props.plugin.call('terminal', 'log', { type: 'aitypewriterwarning', value: 'RemixAI - generating code for following comment: ' + ask.replace('///', '') })

        const data = await this.props.plugin.call('remixAI', 'code_insertion', word, word_after)
        this.task = 'code_generation'
        console.log("data: " + this.task, data)

        const parsedData = data.trimStart() //JSON.parse(data).trimStart()
        const item: monacoTypes.languages.InlineCompletion = {
          insertText: parsedData
        };
        this.currentCompletion.text = parsedData
        this.currentCompletion.item = item
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
      return { items: []}; // do not do completion on single and multiline comment
    }

    if (word.replace(/ +$/, '').endsWith('\n')){
      // Code insertion
      try {
        const output = await this.props.plugin.call('remixAI', 'code_insertion', word, word_after)
        const generatedText = output // no need to clean it. should already be

        this.task = 'code_insertion'
        _paq.push(['trackEvent', 'ai', 'remixAI', this.task])
        const item: monacoTypes.languages.InlineCompletion = {
          insertText: generatedText,
          range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
        };
        this.currentCompletion.text = generatedText
        this.currentCompletion.item = item

        return {
          items: [item],
          enableForwardStability: true,
        }
      }
      catch (err){
        console.log("err: " + err)
        return
      }
    }

    try {
      // Code completion
      this.task = 'code_completion'
      const output = await this.props.plugin.call('remixAI', 'code_completion', word, word_after)
      _paq.push(['trackEvent', 'ai', 'remixAI', this.task])
      const generatedText = output
      let clean = generatedText

      if (generatedText.indexOf('@custom:dev-run-script./') !== -1) {
        clean = generatedText.replace('@custom:dev-run-script', '@custom:dev-run-script ')
      }
      clean = clean.replace(word, '')
      clean = this.process_completion(clean)

      const item: monacoTypes.languages.InlineCompletion = {
        insertText: clean,
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
      };
      this.currentCompletion.text = clean
      this.currentCompletion.item = item

      return {
        items: [item],
        enableForwardStability: true,
      }
    } catch (err) {
      return
    }
  }

  process_completion(data: any) {
    let clean = data.split('\n')[0].startsWith('\n') ? [data.split('\n')[0], data.split('\n')[1]].join('\n'): data.split('\n')[0]

    // if clean starts with a comment, remove it
    if (clean.startsWith('//') || clean.startsWith('/*') || clean.startsWith('*') || clean.startsWith('*/')){
      return ""
    }
    // remove comment inline
    clean = clean.split('//')[0]
    return clean
  }

  handleItemDidShow?(completions: monacoTypes.languages.InlineCompletions<monacoTypes.languages.InlineCompletion>, item: monacoTypes.languages.InlineCompletion, updatedInsertText: string): void {
    this.currentCompletion.displayed = true
    this.currentCompletion.task = this.task
    _paq.push(['trackEvent', 'ai', 'remixAI', this.task + '_did_show'])
  }
  handlePartialAccept?(completions: monacoTypes.languages.InlineCompletions<monacoTypes.languages.InlineCompletion>, item: monacoTypes.languages.InlineCompletion, acceptedCharacters: number): void {
    this.currentCompletion.accepted = true
    this.currentCompletion.task = this.task
    _paq.push(['trackEvent', 'ai', 'remixAI', this.task + '_partial_accept'])
  }
  freeInlineCompletions(completions: monacoTypes.languages.InlineCompletions<monacoTypes.languages.InlineCompletion>): void {
  }

  groupId?: string;
  yieldsToGroupIds?: string[];
  toString?(): string {
    throw new Error('Method not implemented.');
  }
}
