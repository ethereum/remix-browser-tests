import React, { useState, useRef, useEffect, useReducer } from 'react' // eslint-disable-line
import { FormattedMessage, useIntl } from 'react-intl'
import { isArray } from 'lodash'
import Editor, { loader, Monaco } from '@monaco-editor/react'
import { AlertModal } from '@remix-ui/app'
import { ConsoleLogs, QueryParams } from '@remix-project/remix-lib'
import { reducerActions, reducerListener, initialState } from './actions/editor'
import { solidityTokensProvider, solidityLanguageConfig } from './syntaxes/solidity'
import { cairoTokensProvider, cairoLanguageConfig } from './syntaxes/cairo'
import { zokratesTokensProvider, zokratesLanguageConfig } from './syntaxes/zokrates'
import { moveTokenProvider, moveLanguageConfig } from './syntaxes/move'
import { monacoTypes } from '@remix-ui/editor'
import { loadTypes } from './web-types'
import { retrieveNodesAtPosition } from './helpers/retrieveNodesAtPosition'
import { RemixHoverProvider } from './providers/hoverProvider'
import { RemixReferenceProvider } from './providers/referenceProvider'
import { RemixCompletionProvider } from './providers/completionProvider'
import { RemixHighLightProvider } from './providers/highlightProvider'
import { RemixDefinitionProvider } from './providers/definitionProvider'
import { RemixCodeActionProvider } from './providers/codeActionProvider'
import './remix-ui-editor.css'
import { circomLanguageConfig, circomTokensProvider } from './syntaxes/circom'
import { IPosition } from 'monaco-editor'
import { RemixInLineCompletionProvider } from './providers/inlineCompletionProvider'
const _paq = (window._paq = window._paq || [])

enum MarkerSeverity {
  Hint = 1,
  Info = 2,
  Warning = 4,
  Error = 8,
}

type sourceAnnotation = {
  row: number
  column: number
  text: string
  type: 'error' | 'warning' | 'info'
  hide: boolean
  from: string // plugin name
}

type sourceMarker = {
  position: {
    start: {
      line: number
      column: number
    }
    end: {
      line: number
      column: number
    }
  }
  from: string // plugin name
  hide: boolean
}

export type lineText = {
  position: {
    start: {
      line: number
      column: number
    }
    end: {
      line: number
      column: number
    }
  }
  from?: string // plugin name
  content: string
  className: string
  afterContentClassName: string
  hide: boolean
  hoverMessage: monacoTypes.IMarkdownString | monacoTypes.IMarkdownString[]
}

type errorMarker = {
  message: string
  severity: monacoTypes.MarkerSeverity | 'warning' | 'info' | 'error' | 'hint'
  position: {
    start: {
      line: number
      column: number
    }
    end: {
      line: number
      column: number
    }
  }
  file: string
}

loader.config({ paths: { vs: 'assets/js/monaco-editor/min/vs' } })

const queryParams = new QueryParams()
// @ts-ignore
const queryLocale = queryParams.get().lang
const locales = {
  zh: 'zh-cn',
  en: '',
  fr: 'fr',
  it: 'it',
  es: 'es'
}
loader.config({ "vs/nls": { availableLanguages: { "*": locales[queryLocale] || '' } } })

export type DecorationsReturn = {
  currentDecorations: Array<string>
  registeredDecorations?: Array<any>
}

export type PluginType = {
  on: (plugin: string, event: string, listener: any) => void
  call: (plugin: string, method: string, arg1?: any, arg2?: any, arg3?: any, arg4?: any) => any
}

export type EditorAPIType = {
  findMatches: (uri: string, value: string) => any
  getFontSize: () => number
  getValue: (uri: string) => string
  getCursorPosition: (offset?: boolean) => number | monacoTypes.IPosition
  getHoverPosition: (position: monacoTypes.IPosition) => number
  addDecoration: (marker: sourceMarker, filePath: string, typeOfDecoration: string) => DecorationsReturn
  clearDecorationsByPlugin: (filePath: string, plugin: string, typeOfDecoration: string, registeredDecorations: any, currentDecorations: any) => DecorationsReturn
  keepDecorationsFor: (filePath: string, plugin: string, typeOfDecoration: string, registeredDecorations: any, currentDecorations: any) => DecorationsReturn
  addErrorMarker: (errors: errorMarker[], from: string) => void
  clearErrorMarkers: (sources: string[] | { [fileName: string]: any }, from: string) => void
  getPositionAt: (offset: number) => monacoTypes.IPosition
}

/* eslint-disable-next-line */
export interface EditorUIProps {
  contextualListener: any
  activated: boolean
  themeType: string
  currentFile: string
  events: {
    onBreakPointAdded: (file: string, line: number) => void
    onBreakPointCleared: (file: string, line: number) => void
    onDidChangeContent: (file: string) => void
    onEditorMounted: () => void
  }
  plugin: PluginType
  editorAPI: EditorAPIType
}
export const EditorUI = (props: EditorUIProps) => {
  const intl = useIntl()
  const [, setCurrentBreakpoints] = useState({})
  const defaultEditorValue = `
  \t\t\t\t\t\t\t ____    _____   __  __   ___  __  __   ___   ____    _____ 
  \t\t\t\t\t\t\t|  _ \\  | ____| |  \\/  | |_ _| \\ \\/ /  |_ _| |  _ \\  | ____|
  \t\t\t\t\t\t\t| |_) | |  _|   | |\\/| |  | |   \\  /    | |  | | | | |  _|  
  \t\t\t\t\t\t\t|  _ <  | |___  | |  | |  | |   /  \\    | |  | |_| | | |___ 
  \t\t\t\t\t\t\t|_| \\_\\ |_____| |_|  |_| |___| /_/\\_\\  |___| |____/  |_____|\n\n
  \t\t\t\t\t\t\t${intl.formatMessage({id: 'editor.keyboardShortcuts'})}:\n
  \t\t\t\t\t\t\t\tCTRL + S: ${intl.formatMessage({id: 'editor.keyboardShortcuts.text1'})}\n
  \t\t\t\t\t\t\t\tCTRL + Shift + F : ${intl.formatMessage({id: 'editor.keyboardShortcuts.text2'})}\n
  \t\t\t\t\t\t\t\tCTRL + Shift + A : ${intl.formatMessage({id: 'editor.keyboardShortcuts.text3'})}\n
  \t\t\t\t\t\t\t\tCTRL + SHIFT + S: ${intl.formatMessage({id: 'editor.keyboardShortcuts.text4'})}\n
  \t\t\t\t\t\t\t${intl.formatMessage({id: 'editor.editorKeyboardShortcuts'})}:\n
  \t\t\t\t\t\t\t\tCTRL + Alt + F : ${intl.formatMessage({id: 'editor.editorKeyboardShortcuts.text1'})}\n
  \t\t\t\t\t\t\t${intl.formatMessage({id: 'editor.importantLinks'})}:\n
  \t\t\t\t\t\t\t\t${intl.formatMessage({id: 'editor.importantLinks.text1'})}: https://remix-project.org/\n
  \t\t\t\t\t\t\t\t${intl.formatMessage({id: 'editor.importantLinks.text2'})}: https://remix-ide.readthedocs.io/en/latest/\n
  \t\t\t\t\t\t\t\tGithub: https://github.com/ethereum/remix-project\n
  \t\t\t\t\t\t\t\tGitter: https://gitter.im/ethereum/remix\n
  \t\t\t\t\t\t\t\tMedium: https://medium.com/remix-ide\n
  \t\t\t\t\t\t\t\tTwitter: https://twitter.com/ethereumremix\n
  `
  const pasteCodeRef = useRef(false)
  const editorRef = useRef(null)
  const monacoRef = useRef<Monaco>(null)
  const currentFunction = useRef('')
  const currentFileRef = useRef('')
  const currentUrlRef = useRef('')
  // const currentDecorations = useRef({ sourceAnnotationsPerFile: {}, markerPerFile: {} }) // decorations that are currently in use by the editor
  // const registeredDecorations = useRef({}) // registered decorations

  const [editorModelsState, dispatch] = useReducer(reducerActions, initialState)

  const formatColor = (name) => {
    let color = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    if (color.length === 4) {
      color = color.concat(color.substr(1))
    }
    return color
  }
  const defineAndSetTheme = (monaco) => {
    const themeType = props.themeType === 'dark' ? 'vs-dark' : 'vs'
    const themeName = props.themeType === 'dark' ? 'remix-dark' : 'remix-light'
    // see https://microsoft.github.io/monaco-editor/playground.html#customizing-the-appearence-exposed-colors
    const lightColor = formatColor('--light')
    const infoColor = formatColor('--info')
    const darkColor = formatColor('--dark')
    const secondaryColor = formatColor('--secondary')
    const primaryColor = formatColor('--primary')
    const textColor = formatColor('--text') || darkColor
    const textbackground = formatColor('--text-background') || lightColor

    const blueColor = formatColor('--blue')
    const successColor = formatColor('--success')
    const warningColor = formatColor('--warning')
    const yellowColor = formatColor('--yellow')
    const pinkColor = formatColor('--pink')
    const locationColor = '#9e7e08'
    // const purpleColor = formatColor('--purple')
    const dangerColor = formatColor('--danger')
    const greenColor = formatColor('--green')
    const orangeColor = formatColor('--orange')
    const grayColor = formatColor('--gray')

    monaco.editor.defineTheme(themeName, {
      base: themeType,
      inherit: true, // can also be false to completely replace the builtin rules
      rules: [
        { background: darkColor.replace('#', '') },
        { foreground: textColor.replace('#', '') },

        // global variables
        { token: 'keyword.abi', foreground: blueColor },
        { token: 'keyword.block', foreground: blueColor },
        { token: 'keyword.bytes', foreground: blueColor },
        { token: 'keyword.msg', foreground: blueColor },
        { token: 'keyword.tx', foreground: blueColor },

        // global functions
        { token: 'keyword.assert', foreground: blueColor },
        { token: 'keyword.require', foreground: blueColor },
        { token: 'keyword.revert', foreground: blueColor },
        { token: 'keyword.blockhash', foreground: blueColor },
        { token: 'keyword.keccak256', foreground: blueColor },
        { token: 'keyword.sha256', foreground: blueColor },
        { token: 'keyword.ripemd160', foreground: blueColor },
        { token: 'keyword.ecrecover', foreground: blueColor },
        { token: 'keyword.addmod', foreground: blueColor },
        { token: 'keyword.mulmod', foreground: blueColor },
        { token: 'keyword.selfdestruct', foreground: blueColor },
        { token: 'keyword.type ', foreground: blueColor },
        { token: 'keyword.gasleft', foreground: blueColor },

        // specials
        { token: 'keyword.super', foreground: infoColor },
        { token: 'keyword.this', foreground: infoColor },
        { token: 'keyword.virtual', foreground: infoColor },

        // for state variables
        { token: 'keyword.constants', foreground: grayColor },
        { token: 'keyword.override', foreground: grayColor },
        { token: 'keyword.immutable', foreground: grayColor },

        // data location
        { token: 'keyword.memory', foreground: locationColor },
        { token: 'keyword.storage', foreground: locationColor },
        { token: 'keyword.calldata', foreground: locationColor },

        // for Events
        { token: 'keyword.indexed', foreground: yellowColor },
        { token: 'keyword.anonymous', foreground: yellowColor },

        // for functions
        { token: 'keyword.external', foreground: successColor },
        { token: 'keyword.internal', foreground: successColor },
        { token: 'keyword.private', foreground: successColor },
        { token: 'keyword.public', foreground: successColor },
        { token: 'keyword.view', foreground: successColor },
        { token: 'keyword.pure', foreground: successColor },
        { token: 'keyword.payable', foreground: successColor },
        { token: 'keyword.nonpayable', foreground: successColor },

        // Errors
        { token: 'keyword.Error', foreground: dangerColor },
        { token: 'keyword.Panic', foreground: dangerColor },

        // special functions
        { token: 'keyword.fallback', foreground: pinkColor },
        { token: 'keyword.receive', foreground: pinkColor },
        { token: 'keyword.constructor', foreground: pinkColor },

        // identifiers
        { token: 'keyword.identifier', foreground: warningColor },
        { token: 'keyword.for', foreground: warningColor },
        { token: 'keyword.break', foreground: warningColor },
        { token: 'keyword.continue', foreground: warningColor },
        { token: 'keyword.while', foreground: warningColor },
        { token: 'keyword.do', foreground: warningColor },
        { token: 'keyword.delete', foreground: warningColor },

        { token: 'keyword.if', foreground: yellowColor },
        { token: 'keyword.else', foreground: yellowColor },

        { token: 'keyword.throw', foreground: orangeColor },
        { token: 'keyword.catch', foreground: orangeColor },
        { token: 'keyword.try', foreground: orangeColor },

        // returns
        { token: 'keyword.returns', foreground: greenColor },
        { token: 'keyword.return', foreground: greenColor },
      ],
      colors: {
        // see https://code.visualstudio.com/api/references/theme-color for more settings
        'editor.background': textbackground,
        'editorSuggestWidget.background': lightColor,
        'editorSuggestWidget.selectedBackground': secondaryColor,
        'editorSuggestWidget.selectedForeground': textColor,
        'editorSuggestWidget.highlightForeground': primaryColor,
        'editorSuggestWidget.focusHighlightForeground': infoColor,
        'editor.lineHighlightBorder': textbackground,
        'editor.lineHighlightBackground': textbackground === darkColor ? lightColor : secondaryColor,
        'editorGutter.background': lightColor,
        //'editor.selectionHighlightBackground': secondaryColor,
        'minimap.background': lightColor,
        'menu.foreground': textColor,
        'menu.background': textbackground,
        'menu.selectionBackground': secondaryColor,
        'menu.selectionForeground': textColor,
        'menu.selectionBorder': secondaryColor,
      },
    })
    monacoRef.current.editor.setTheme(themeName)
  }

  useEffect(() => {
    if (!monacoRef.current) return
    defineAndSetTheme(monacoRef.current)
  })

  useEffect(() => {
    if (!editorRef.current || !props.currentFile) return
    currentFileRef.current = props.currentFile
    props.plugin.call('fileManager', 'getUrlFromPath', currentFileRef.current).then((url) => (currentUrlRef.current = url.file))

    const file = editorModelsState[props.currentFile]
    editorRef.current.setModel(file.model)
    editorRef.current.updateOptions({
      readOnly: editorModelsState[props.currentFile].readOnly,
    })
    if (file.language === 'sol') {
      monacoRef.current.editor.setModelLanguage(file.model, 'remix-solidity')
    } else if (file.language === 'cairo') {
      monacoRef.current.editor.setModelLanguage(file.model, 'remix-cairo')
    } else if (file.language === 'zokrates') {
      monacoRef.current.editor.setModelLanguage(file.model, 'remix-zokrates')
    } else if (file.language === 'move') {
      monacoRef.current.editor.setModelLanguage(file.model, 'remix-move')
    } else if (file.language === 'circom') {
      monacoRef.current.editor.setModelLanguage(file.model, 'remix-circom')
    }
  }, [props.currentFile])

  const convertToMonacoDecoration = (decoration: lineText | sourceAnnotation | sourceMarker, typeOfDecoration: string) => {
    if (typeOfDecoration === 'sourceAnnotationsPerFile') {
      decoration = decoration as sourceAnnotation
      return {
        type: typeOfDecoration,
        range: new monacoRef.current.Range(decoration.row + 1, 1, decoration.row + 1, 1),
        options: {
          isWholeLine: false,
          glyphMarginHoverMessage: {
            value: (decoration.from ? `from ${decoration.from}:\n` : '') + decoration.text,
          },
          glyphMarginClassName: `fal fa-exclamation-square text-${decoration.type === 'error' ? 'danger' : decoration.type === 'warning' ? 'warning' : 'info'}`,
        },
      }
    }
    if (typeOfDecoration === 'markerPerFile') {
      decoration = decoration as sourceMarker
      let isWholeLine = false
      if (
        (decoration.position.start.line === decoration.position.end.line && decoration.position.end.column - decoration.position.start.column < 2) ||
        decoration.position.start.line !== decoration.position.end.line
      ) {
        // in this case we force highlighting the whole line (doesn't make sense to highlight 2 chars)
        isWholeLine = true
      }
      return {
        type: typeOfDecoration,
        range: new monacoRef.current.Range(
          decoration.position.start.line + 1,
          decoration.position.start.column + 1,
          decoration.position.end.line + 1,
          decoration.position.end.column + 1
        ),
        options: {
          isWholeLine,
          inlineClassName: `${isWholeLine ? 'alert-info' : 'inline-class'}  border-0 highlightLine${decoration.position.start.line + 1}`,
        },
      }
    }
    if (typeOfDecoration === 'lineTextPerFile') {
      const lineTextDecoration = decoration as lineText
      return {
        type: typeOfDecoration,
        range: new monacoRef.current.Range(
          lineTextDecoration.position.start.line + 1,
          lineTextDecoration.position.start.column + 1,
          lineTextDecoration.position.start.line + 1,
          1024
        ),
        options: {
          after: {
            content: ` ${lineTextDecoration.content}`,
            inlineClassName: `${lineTextDecoration.className}`,
          },
          afterContentClassName: `${lineTextDecoration.afterContentClassName}`,
          hoverMessage: lineTextDecoration.hoverMessage,
        },
      }
    }
    if (typeOfDecoration === 'lineTextPerFile') {
      const lineTextDecoration = decoration as lineText
      return {
        type: typeOfDecoration,
        range: new monacoRef.current.Range(
          lineTextDecoration.position.start.line + 1,
          lineTextDecoration.position.start.column + 1,
          lineTextDecoration.position.start.line + 1,
          1024
        ),
        options: {
          after: {
            content: ` ${lineTextDecoration.content}`,
            inlineClassName: `${lineTextDecoration.className}`,
          },
          afterContentClassName: `${lineTextDecoration.afterContentClassName}`,
          hoverMessage: lineTextDecoration.hoverMessage,
        },
      }
    }
  }

  props.editorAPI.clearDecorationsByPlugin = (filePath: string, plugin: string, typeOfDecoration: string, registeredDecorations: any, currentDecorations: any) => {
    const model = editorModelsState[filePath]?.model
    if (!model)
      return {
        currentDecorations: [],
        registeredDecorations: [],
      }
    const decorations = []
    const newRegisteredDecorations = []
    if (registeredDecorations) {
      for (const decoration of registeredDecorations) {
        if (decoration.type === typeOfDecoration && decoration.value.from !== plugin) {
          decorations.push(convertToMonacoDecoration(decoration.value, typeOfDecoration))
          newRegisteredDecorations.push(decoration)
        }
      }
    }
    return {
      currentDecorations: model.deltaDecorations(currentDecorations, decorations),
      registeredDecorations: newRegisteredDecorations,
    }
  }

  props.editorAPI.keepDecorationsFor = (filePath: string, plugin: string, typeOfDecoration: string, registeredDecorations: any, currentDecorations: any) => {
    const model = editorModelsState[filePath]?.model
    if (!model)
      return {
        currentDecorations: [],
      }
    const decorations = []
    if (registeredDecorations) {
      for (const decoration of registeredDecorations) {
        if (decoration.value.from === plugin) {
          decorations.push(convertToMonacoDecoration(decoration.value, typeOfDecoration))
        }
      }
    }
    return {
      currentDecorations: model.deltaDecorations(currentDecorations, decorations),
    }
  }

  const addDecoration = (decoration: sourceAnnotation | sourceMarker, filePath: string, typeOfDecoration: string) => {
    const model = editorModelsState[filePath]?.model
    if (!model) return { currentDecorations: [] }
    const monacoDecoration = convertToMonacoDecoration(decoration, typeOfDecoration)
    return {
      currentDecorations: model.deltaDecorations([], [monacoDecoration]),
      registeredDecorations: [{ value: decoration, type: typeOfDecoration }],
    }
  }

  props.editorAPI.addDecoration = (marker: sourceMarker, filePath: string, typeOfDecoration: string) => {
    return addDecoration(marker, filePath, typeOfDecoration)
  }

  props.editorAPI.addErrorMarker = async (errors: errorMarker[], from: string) => {
    const allMarkersPerfile: Record<string, Array<monacoTypes.editor.IMarkerData>> = {}

    for (const error of errors) {
      let filePath = error.file

      if (!filePath) return
      const fileFromUrl = await props.plugin.call('fileManager', 'getPathFromUrl', filePath)
      filePath = fileFromUrl.file
      const model = editorModelsState[filePath]?.model
      const errorServerityMap = {
        error: MarkerSeverity.Error,
        warning: MarkerSeverity.Warning,
        info: MarkerSeverity.Info,
      }
      if (model) {
        const markerData: monacoTypes.editor.IMarkerData = {
          severity: typeof error.severity === 'string' ? errorServerityMap[error.severity] : error.severity,
          startLineNumber: (error.position.start && error.position.start.line) || 0,
          startColumn: (error.position.start && error.position.start.column) || 0,
          endLineNumber: (error.position.end && error.position.end.line) || 0,
          endColumn: (error.position.end && error.position.end.column) || 0,
          message: error.message,
        }
        if (!allMarkersPerfile[filePath]) {
          allMarkersPerfile[filePath] = []
        }
        allMarkersPerfile[filePath].push(markerData)
      }
    }
    for (const filePath in allMarkersPerfile) {
      const model = editorModelsState[filePath]?.model
      if (model) {
        monacoRef.current.editor.setModelMarkers(model, from, allMarkersPerfile[filePath])
      }
    }
  }

  props.editorAPI.clearErrorMarkers = async (sources: string[] | { [fileName: string]: any }, from: string) => {
    if (sources) {
      for (const source of Array.isArray(sources) ? sources : Object.keys(sources)) {
        const filePath = source
        const model = editorModelsState[filePath]?.model
        if (model) {
          monacoRef.current.editor.setModelMarkers(model, from, [])
        }
      }
    }
  }

  props.editorAPI.findMatches = (uri: string, value: string) => {
    if (!editorRef.current) return
    const model = editorModelsState[uri]?.model
    if (model) return model.findMatches(value)
  }

  props.editorAPI.getValue = (uri: string) => {
    if (!editorRef.current) return
    const model = editorModelsState[uri]?.model
    if (model) {
      return model.getValue()
    }
  }

  props.editorAPI.getCursorPosition = (offset: boolean = true) => {
    if (!monacoRef.current) return
    const model = editorModelsState[currentFileRef.current]?.model
    if (model) {
      return offset ? model.getOffsetAt(editorRef.current.getPosition()) : editorRef.current.getPosition()
    }
  }

  props.editorAPI.getPositionAt = (offset: number) => {
    if (!monacoRef.current) return
    const model = editorModelsState[currentFileRef.current]?.model
    if (model) {
      return model.getPositionAt(offset)
    }
  }

  props.editorAPI.getHoverPosition = (position: monacoTypes.Position) => {
    if (!monacoRef.current) return
    const model = editorModelsState[currentFileRef.current]?.model
    if (model) {
      return model.getOffsetAt(position)
    } else {
      return 0
    }
  }

  props.editorAPI.getFontSize = () => {
    if (!editorRef.current) return
    return editorRef.current.getOption(51)
  }
  ;(window as any).addRemixBreakpoint = (position) => {
    // make it available from e2e testing...
    const model = editorRef.current.getModel()
    if (model) {
      setCurrentBreakpoints((prevState) => {
        const currentFile = currentUrlRef.current
        if (!prevState[currentFile]) prevState[currentFile] = {}
        const decoration = Object.keys(prevState[currentFile]).filter((line) => parseInt(line) === position.lineNumber)
        if (decoration.length) {
          props.events.onBreakPointCleared(currentFile, position.lineNumber)
          model.deltaDecorations([prevState[currentFile][position.lineNumber]], [])
          delete prevState[currentFile][position.lineNumber]
        } else {
          props.events.onBreakPointAdded(currentFile, position.lineNumber)
          const decorationIds = model.deltaDecorations(
            [],
            [
              {
                range: new monacoRef.current.Range(position.lineNumber, 1, position.lineNumber, 1),
                options: {
                  isWholeLine: false,
                  glyphMarginClassName: 'fas fa-circle text-info',
                },
              },
            ]
          )
          prevState[currentFile][position.lineNumber] = decorationIds[0]
        }
        return prevState
      })
    }
  }

  function handleEditorDidMount(editor) {
    editorRef.current = editor
    defineAndSetTheme(monacoRef.current)
    reducerListener(props.plugin, dispatch, monacoRef.current, editorRef.current, props.events)
    props.events.onEditorMounted()
    editor.onMouseUp((e) => {
      // see https://microsoft.github.io/monaco-editor/typedoc/enums/editor.MouseTargetType.html
      // 2 is GUTTER_GLYPH_MARGIN
      // 3 is GUTTER_LINE_NUMBERS
      if (e && e.target && (e.target.type === 2 || e.target.type === 3)) {
        ;(window as any).addRemixBreakpoint(e.target.position)
      }
    })

    editor.onDidPaste((e) => {
      if (!pasteCodeRef.current && e && e.range && e.range.startLineNumber >= 0 && e.range.endLineNumber >= 0 && e.range.endLineNumber - e.range.startLineNumber > 10) {
        const modalContent: AlertModal = {
          id: 'newCodePasted',
          title: intl.formatMessage({id: 'editor.title1'}),
          message: (
            <div>
              {' '}
              <i className="fas fa-exclamation-triangle text-danger mr-1"></i>
              <FormattedMessage id="editor.title1.message1" />
              <div>
                <FormattedMessage id="editor.title1.message2" />
                <div className="mt-2">
                  <FormattedMessage id="editor.title1.message3" values={{span: (chunks) => <span className="text-warning">{chunks}</span>}} />
                </div>
                <div className="text-warning  mt-2">
                  <FormattedMessage id="editor.title1.message4" />
                </div>
                <div className="mt-2">
                  <FormattedMessage id="editor.title1.message5" />
                </div>
                <div className="mt-2">
                  <FormattedMessage
                    id="editor.title1.message6"
                    values={{
                      a: (chunks) => (
                        <a target="_blank" href="https://remix-ide.readthedocs.io/en/latest/security.html">
                          {chunks}
                        </a>
                      ),
                    }}
                  />
                </div>
              </div>
            </div>
          ),
        }
        props.plugin.call('notification', 'alert', modalContent)
        pasteCodeRef.current = true
      }
    })

    // add context menu items
    const zoominAction = {
      id: 'zoomIn',
      label: intl.formatMessage({id: 'editor.zoomIn'}),
      contextMenuOrder: 0, // choose the order
      contextMenuGroupId: 'zooming', // create a new grouping
      keybindings: [
        // eslint-disable-next-line no-bitwise
        monacoRef.current.KeyMod.CtrlCmd | monacoRef.current.KeyCode.Equal,
      ],
      run: () => {
        editor.trigger('keyboard', 'editor.action.fontZoomIn', {});
      }
    }
    const zoomOutAction = {
      id: 'zoomOut',
      label: intl.formatMessage({id: 'editor.zoomOut'}),
      contextMenuOrder: 0, // choose the order
      contextMenuGroupId: 'zooming', // create a new grouping
      keybindings: [
        // eslint-disable-next-line no-bitwise
        monacoRef.current.KeyMod.CtrlCmd | monacoRef.current.KeyCode.Minus,
      ],
      run: () => {
        editor.trigger('keyboard', 'editor.action.fontZoomOut', {});
      }
    }
    const formatAction = {
      id: 'autoFormat',
      label: intl.formatMessage({id: 'editor.formatCode'}),
      contextMenuOrder: 0, // choose the order
      contextMenuGroupId: 'formatting', // create a new grouping
      keybindings: [
        // eslint-disable-next-line no-bitwise
        monacoRef.current.KeyMod.Shift | monacoRef.current.KeyMod.Alt | monacoRef.current.KeyCode.KeyF,
      ],
      run: async () => {
        const file = await props.plugin.call('fileManager', 'getCurrentFile')
        await props.plugin.call('codeFormatter', 'format', file)
      },
    }

    let gptGenerateDocumentationAction
    const executeGptGenerateDocumentationAction = {
      id: 'generateDocumentation',
      label: intl.formatMessage({id: 'editor.generateDocumentation'}),
      contextMenuOrder: 0, // choose the order
      contextMenuGroupId: 'gtp', // create a new grouping
      keybindings: [],
      run: async () => {
        const file = await props.plugin.call('fileManager', 'getCurrentFile')
        const content = await props.plugin.call('fileManager', 'readFile', file)
        const message = intl.formatMessage({id: 'editor.generateDocumentationByAI'}, {content, currentFunction: currentFunction.current})
        await props.plugin.call('openaigpt', 'message', message)
        _paq.push(['trackEvent', 'ai', 'openai', 'generateDocumentation'])
      },
    }

    let gptExplainFunctionAction
    const executegptExplainFunctionAction = {
      id: 'explainFunction',
      label: intl.formatMessage({id: 'editor.explainFunction'}),
      contextMenuOrder: 1, // choose the order
      contextMenuGroupId: 'gtp', // create a new grouping
      keybindings: [],
      run: async () => {
        const file = await props.plugin.call('fileManager', 'getCurrentFile')
        const content = await props.plugin.call('fileManager', 'readFile', file)
        const message = intl.formatMessage({id: 'editor.explainFunctionByAI'}, {content, currentFunction: currentFunction.current})
        await props.plugin.call('openaigpt', 'message', message)
        _paq.push(['trackEvent', 'ai', 'openai', 'explainFunction'])
      },
    }

    let solgptExplainFunctionAction
    const executeSolgptExplainFunctionAction = {
      id: 'solExplainFunction',
      label: intl.formatMessage({id: 'editor.explainFunctionSol'}),
      contextMenuOrder: 1, // choose the order
      contextMenuGroupId: 'sol-gtp', // create a new grouping
      keybindings: [
        // eslint-disable-next-line no-bitwise
        monacoRef.current.KeyMod.Shift | monacoRef.current.KeyMod.Alt | monacoRef.current.KeyCode.KeyE,
      ],
      run: async () => {
        const file = await props.plugin.call('fileManager', 'getCurrentFile')
        const content = await props.plugin.call('fileManager', 'readFile', file)
        const selectedCode = editor.getModel().getValueInRange(editor.getSelection())
        await props.plugin.call('solcoder', 'code_explaining', selectedCode)
        _paq.push(['trackEvent', 'ai', 'solcoder', 'explainFunction'])
      },
    }


    const freeFunctionCondition = editor.createContextKey('freeFunctionCondition', false)
    let freeFunctionAction
    const executeFreeFunctionAction = {
      id: 'executeFreeFunction',
      label: intl.formatMessage({id: 'editor.executeFreeFunction'}),
      contextMenuOrder: 0, // choose the order
      contextMenuGroupId: 'execute', // create a new grouping
      precondition: 'freeFunctionCondition',
      keybindings: [
        // eslint-disable-next-line no-bitwise
        monacoRef.current.KeyMod.Shift | monacoRef.current.KeyMod.Alt | monacoRef.current.KeyCode.KeyR,
      ],
      run: async () => {
        const { nodesAtPosition } = await retrieveNodesAtPosition(props.editorAPI, props.plugin)
        // find the contract and get the nodes of the contract and the base contracts and imports
        if (nodesAtPosition && isArray(nodesAtPosition) && nodesAtPosition.length) {
          const freeFunctionNode = nodesAtPosition.find((node) => node.kind === 'freeFunction')
          if (freeFunctionNode) {
            const file = await props.plugin.call('fileManager', 'getCurrentFile')
            props.plugin.call('solidity-script', 'execute', file, freeFunctionNode.name)
          } else {
            props.plugin.call('notification', 'toast', intl.formatMessage({id: 'editor.toastText1'}))
          }
        } else {
          props.plugin.call('notification', 'toast', intl.formatMessage({id: 'editor.toastText2'}))
        }
      },
    }
    editor.addAction(formatAction)
    editor.addAction(zoomOutAction)
    editor.addAction(zoominAction)
    freeFunctionAction = editor.addAction(executeFreeFunctionAction)
    gptGenerateDocumentationAction = editor.addAction(executeGptGenerateDocumentationAction)
    gptExplainFunctionAction = editor.addAction(executegptExplainFunctionAction)
    solgptExplainFunctionAction = editor.addAction(executeSolgptExplainFunctionAction)

    // we have to add the command because the menu action isn't always available (see onContextMenuHandlerForFreeFunction)
    editor.addCommand(monacoRef.current.KeyMod.Shift | monacoRef.current.KeyMod.Alt | monacoRef.current.KeyCode.KeyR, () => executeFreeFunctionAction.run())

    const contextmenu = editor.getContribution('editor.contrib.contextmenu')
    const orgContextMenuMethod = contextmenu._onContextMenu
    const onContextMenuHandlerForFreeFunction = async () => {
      if (freeFunctionAction) {
        freeFunctionAction.dispose()
        freeFunctionAction = null
      }
      if (gptGenerateDocumentationAction) {
        gptGenerateDocumentationAction.dispose()
        gptGenerateDocumentationAction = null
      }
      if (gptExplainFunctionAction) {
        gptExplainFunctionAction.dispose()
        gptExplainFunctionAction = null
      }
      if (solgptExplainFunctionAction) {
        solgptExplainFunctionAction.dispose()
        solgptExplainFunctionAction = null
      }

      const file = await props.plugin.call('fileManager', 'getCurrentFile')
      if (!file.endsWith('.sol')) {
        freeFunctionCondition.set(false)
        return
      }
      const { nodesAtPosition } = await retrieveNodesAtPosition(props.editorAPI, props.plugin)
      const freeFunctionNode = nodesAtPosition.find((node) => node.kind === 'freeFunction')
      if (freeFunctionNode) {
        executeFreeFunctionAction.label = intl.formatMessage({id: 'editor.executeFreeFunction2'}, {name: freeFunctionNode.name})
        freeFunctionAction = editor.addAction(executeFreeFunctionAction)
      }
      const functionImpl = nodesAtPosition.find((node) => node.kind === 'function')
      if (functionImpl) {
        currentFunction.current = functionImpl.name
        executeGptGenerateDocumentationAction.label = intl.formatMessage({id: 'editor.generateDocumentation2'}, {name: functionImpl.name})
        gptGenerateDocumentationAction = editor.addAction(executeGptGenerateDocumentationAction)
        executegptExplainFunctionAction.label = intl.formatMessage({id: 'editor.explainFunction2'}, {name: functionImpl.name})
        gptExplainFunctionAction = editor.addAction(executegptExplainFunctionAction)
        executeSolgptExplainFunctionAction.label = intl.formatMessage({id: 'editor.explainFunctionSol'})
        solgptExplainFunctionAction = editor.addAction(executeSolgptExplainFunctionAction)
      }else{
        executeSolgptExplainFunctionAction.label = intl.formatMessage({id: 'editor.explainFunctionSol'})
        solgptExplainFunctionAction = editor.addAction(executeSolgptExplainFunctionAction)
      }
      freeFunctionCondition.set(!!freeFunctionNode)
    }
    contextmenu._onContextMenu = (...args) => {
      if (args[0]) args[0].event?.preventDefault()
      onContextMenuHandlerForFreeFunction()
        .then(() => orgContextMenuMethod.apply(contextmenu, args))
        .catch(() => orgContextMenuMethod.apply(contextmenu, args))
    }

    const editorService = editor._codeEditorService
    const openEditorBase = editorService.openCodeEditor.bind(editorService)
    editorService.openCodeEditor = async (input, source) => {
      const result = await openEditorBase(input, source)
      if (input && input.resource && input.resource.path) {
        try {
          await props.plugin.call('fileManager', 'open', input.resource.path)
          if (input.options && input.options.selection) {
            editor.revealRange(input.options.selection)
            editor.setPosition({
              column: input.options.selection.startColumn,
              lineNumber: input.options.selection.startLineNumber,
            })
          }
        } catch (e) {
          console.log(e)
        }
      }
      return result
    }
    // just for e2e testing
    const loadedElement = document.createElement('span')
    loadedElement.setAttribute('data-id', 'editorloaded')
    document.body.appendChild(loadedElement)
  }

  function handleEditorWillMount(monaco) {
    monacoRef.current = monaco
    // Register a new language
    monacoRef.current.languages.register({ id: 'remix-solidity' })
    monacoRef.current.languages.register({ id: 'remix-cairo' })
    monacoRef.current.languages.register({ id: 'remix-zokrates' })
    monacoRef.current.languages.register({ id: 'remix-move' })
    monacoRef.current.languages.register({ id: 'remix-circom' })

    // Allow JSON schema requests
    monacoRef.current.languages.json.jsonDefaults.setDiagnosticsOptions({enableSchemaRequest: true})

    // Register a tokens provider for the language
    monacoRef.current.languages.setMonarchTokensProvider('remix-solidity', solidityTokensProvider as any)
    monacoRef.current.languages.setLanguageConfiguration('remix-solidity', solidityLanguageConfig as any)

    monacoRef.current.languages.setMonarchTokensProvider('remix-cairo', cairoTokensProvider as any)
    monacoRef.current.languages.setLanguageConfiguration('remix-cairo', cairoLanguageConfig as any)

    monacoRef.current.languages.setMonarchTokensProvider('remix-zokrates', zokratesTokensProvider as any)
    monacoRef.current.languages.setLanguageConfiguration('remix-zokrates', zokratesLanguageConfig as any)

    monacoRef.current.languages.setMonarchTokensProvider('remix-move', moveTokenProvider as any)
    monacoRef.current.languages.setLanguageConfiguration('remix-move', moveLanguageConfig as any)

    monacoRef.current.languages.setMonarchTokensProvider('remix-circom', circomTokensProvider as any)
    monacoRef.current.languages.setLanguageConfiguration('remix-circom', circomLanguageConfig(monacoRef.current) as any)

    monacoRef.current.languages.registerDefinitionProvider('remix-solidity', new RemixDefinitionProvider(props, monaco))
    monacoRef.current.languages.registerDocumentHighlightProvider('remix-solidity', new RemixHighLightProvider(props, monaco))
    monacoRef.current.languages.registerReferenceProvider('remix-solidity', new RemixReferenceProvider(props, monaco))
    monacoRef.current.languages.registerHoverProvider('remix-solidity', new RemixHoverProvider(props, monaco))
    monacoRef.current.languages.registerCompletionItemProvider('remix-solidity', new RemixCompletionProvider(props, monaco))
    monacoRef.current.languages.registerInlineCompletionsProvider('remix-solidity', new RemixInLineCompletionProvider(props, monaco))
    monaco.languages.registerCodeActionProvider('remix-solidity', new RemixCodeActionProvider(props, monaco))

    loadTypes(monacoRef.current)
  }

  return (
    <div className="w-100 h-100 d-flex flex-column-reverse">
      <Editor
        width="100%"
        path={props.currentFile}
        language={editorModelsState[props.currentFile] ? editorModelsState[props.currentFile].language : 'text'}
        onMount={handleEditorDidMount}
        beforeMount={handleEditorWillMount}
        options={{
          glyphMargin: true,
          readOnly: (!editorRef.current || !props.currentFile) && editorModelsState[props.currentFile]?.readOnly,
          inlineSuggest: {
            enabled: true,
          }
        }}
        defaultValue={defaultEditorValue}
      />
      {editorModelsState[props.currentFile]?.readOnly && (
        <span className="pl-4 h6 mb-0 w-100 alert-info position-absolute bottom-0 end-0">
          <i className="fas fa-lock-alt p-2"></i>
          <FormattedMessage
            id="editor.text"
            values={{
              b: (chunks) => <b>{chunks}</b>,
            }}
          />
        </span>
      )}
    </div>
  )
}

export default EditorUI
