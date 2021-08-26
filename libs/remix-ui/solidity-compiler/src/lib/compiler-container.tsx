import React, { useEffect, useState, useRef, useReducer } from 'react' // eslint-disable-line
import semver from 'semver'
import { CompilerContainerProps, ConfigurationSettings } from './types'
import * as helper from '../../../../../apps/remix-ide/src/lib/helper'
import { canUseWorker, baseURLBin, baseURLWasm, urlFromVersion, pathToURL, promisedMiniXhr } from '@remix-project/remix-solidity'
import { compilerReducer, compilerInitialState } from './reducers/compiler'
import { resetEditorMode, listenToEvents } from './actions/compiler'
import { OverlayTrigger, Tooltip } from 'react-bootstrap' // eslint-disable-line

import './css/style.css'

declare global {
  interface Window {
    _paq: any
  }
}

const _paq = window._paq = window._paq || [] //eslint-disable-line

export const CompilerContainer = (props: CompilerContainerProps) => {
  const { api, compileTabLogic, tooltip, modal, compiledFileName, updateCurrentVersion, configurationSettings  } = props // eslint-disable-line
  const [state, setState] = useState({
    hideWarnings: false,
    autoCompile: false,
    optimise: false,
    compileTimeout: null,
    timeout: 300,
    allversions: [],
    customVersions: [],
    selectedVersion: null,
    defaultVersion: 'soljson-v0.8.7+commit.e28d00a7.js', // this default version is defined: in makeMockCompiler (for browser test)
    selectedLanguage: '',
    runs: '',
    compiledFileName: '',
    includeNightlies: false,
    language: '',
    evmVersion: ''
  })
  const [disableCompileButton, setDisableCompileButton] = useState<boolean>(false)
  const compileIcon = useRef(null)
  const promptMessageInput = useRef(null)
  const [hhCompilation, sethhCompilation] = useState(false)
  const [compilerContainer, dispatch] = useReducer(compilerReducer, compilerInitialState)

  useEffect(() => {
    fetchAllVersion((allversions, selectedVersion, isURL) => {
      setState(prevState => {
        return { ...prevState, allversions }
      })
      if (isURL) _updateVersionSelector(state.defaultVersion, selectedVersion)
      else {
        setState(prevState => {
          return { ...prevState, selectedVersion }
        })
        updateCurrentVersion(selectedVersion)
        _updateVersionSelector(selectedVersion)
      }
    })
    const currentFileName = api.getConfiguration('currentFile')

    currentFile(currentFileName)
    listenToEvents(compileTabLogic, api)(dispatch)
  }, [])

  useEffect(() => {
    if (compileTabLogic && compileTabLogic.compiler) {
      setState(prevState => {
        const params = api.getParameters()
        const optimize = params.optimize === 'false' ? false : params.optimize === 'true' ? true : null
        const runs = params.runs
        const evmVersion = params.evmVersion
        const language = params.language
        const autoCompile = params.autoCompile === 'false' ? false : params.autoCompile === 'true' ? true : null

        return {
          ...prevState,
          hideWarnings: api.getConfiguration('hideWarnings') || false,
          autoCompile: typeof autoCompile === 'boolean' ? autoCompile : api.getConfiguration('autoCompile') || false,
          includeNightlies: api.getConfiguration('includeNightlies') || false,
          optimise: typeof optimize === 'boolean' ? optimize : api.getConfiguration('optimise') || false,
          runs: (runs !== null) && (runs !== 'null') && (runs !== undefined) && (runs !== 'undefined') ? runs : 200,
          evmVersion: (evmVersion !== null) && (evmVersion !== 'null') && (evmVersion !== undefined) && (evmVersion !== 'undefined') ? evmVersion : 'default',
          language: (language !== null) && (language !== 'null') && (language !== undefined) && (language !== 'undefined') ? language : 'Solidity'
        }
      })
    }
  }, [compileTabLogic])

  useEffect(() => {
    const isDisabled = !compiledFileName || (compiledFileName && !isSolFileSelected(compiledFileName))

    setDisableCompileButton(isDisabled)
    setState(prevState => {
      return { ...prevState, compiledFileName }
    })
  }, [compiledFileName])

  useEffect(() => {
    if (compilerContainer.compiler.mode) {
      switch (compilerContainer.compiler.mode) {
        case 'startingCompilation':
          startingCompilation()
          break
        case 'compilationDuration':
          compilationDuration(compilerContainer.compiler.args[0])
          break
        case 'loadingCompiler':
          loadingCompiler()
          break
        case 'compilerLoaded':
          compilerLoaded()
          break
        case 'compilationFinished':
          compilationFinished()
          break
      }
    }
  }, [compilerContainer.compiler.mode])

  useEffect(() => {
    if (compilerContainer.editor.mode) {
      switch (compilerContainer.editor.mode) {
        case 'sessionSwitched':
          sessionSwitched()
          resetEditorMode()(dispatch)
          break
        case 'contentChanged':
          contentChanged()
          resetEditorMode()(dispatch)
          break
      }
    }
  }, [compilerContainer.editor.mode])

  useEffect(() => {
    if (configurationSettings) {
      setConfiguration(configurationSettings)
    }
  }, [configurationSettings])

  // fetching both normal and wasm builds and creating a [version, baseUrl] map
  const fetchAllVersion = async (callback) => {
    let selectedVersion, allVersionsWasm, isURL
    let allVersions = [{ path: 'builtin', longVersion: 'latest local version - ' + state.defaultVersion }]
    // fetch normal builds
    const binRes: any = await promisedMiniXhr(`${baseURLBin}/list.json`)
    // fetch wasm builds
    const wasmRes: any = await promisedMiniXhr(`${baseURLWasm}/list.json`)
    if (binRes.event.type === 'error' && wasmRes.event.type === 'error') {
      selectedVersion = 'builtin'
      return callback(allVersions, selectedVersion)
    }
    try {
      const versions = JSON.parse(binRes.json).builds.slice().reverse()

      allVersions = [...allVersions, ...versions]
      selectedVersion = state.defaultVersion
      if (api.getParameters().version) selectedVersion = api.getParameters().version
      // Check if version is a URL and corresponding filename starts with 'soljson'
      if (selectedVersion.startsWith('https://')) {
        const urlArr = selectedVersion.split('/')

        if (urlArr[urlArr.length - 1].startsWith('soljson')) isURL = true
      }
      if (wasmRes.event.type !== 'error') {
        allVersionsWasm = JSON.parse(wasmRes.json).builds.slice().reverse()
      }
    } catch (e) {
      tooltip('Cannot load compiler version list. It might have been blocked by an advertisement blocker. Please try deactivating any of them from this page and reload. Error: ' + e)
    }
    // replace in allVersions those compiler builds which exist in allVersionsWasm with new once
    if (allVersionsWasm && allVersions) {
      allVersions.forEach((compiler, index) => {
        const wasmIndex = allVersionsWasm.findIndex(wasmCompiler => { return wasmCompiler.longVersion === compiler.longVersion })
        if (wasmIndex !== -1) {
          allVersions[index] = allVersionsWasm[wasmIndex]
          pathToURL[compiler.path] = baseURLWasm
        } else {
          pathToURL[compiler.path] = baseURLBin
        }
      })
    }
    callback(allVersions, selectedVersion, isURL)
  }

  /**
   * Update the compilation button with the name of the current file
   */
  const currentFile = (name = '') => {
    if (name && name !== '') {
      _setCompilerVersionFromPragma(name)
    }
    const compiledFileName = name.split('/').pop()

    setState(prevState => {
      return { ...prevState, compiledFileName }
    })
  }

  // Load solc compiler version according to pragma in contract file
  const _setCompilerVersionFromPragma = (filename: string) => {
    if (!state.allversions) return
    api.readFile(filename).then(data => {
      const pragmaArr = data.match(/(pragma solidity (.+?);)/g)
      if (pragmaArr && pragmaArr.length === 1) {
        const pragmaStr = pragmaArr[0].replace('pragma solidity', '').trim()
        const pragma = pragmaStr.substring(0, pragmaStr.length - 1)
        const releasedVersions = state.allversions.filter(obj => !obj.prerelease).map(obj => obj.version)
        const allVersions = state.allversions.map(obj => _retrieveVersion(obj.version))
        const currentCompilerName = _retrieveVersion(state.selectedVersion)
        // contains only numbers part, for example '0.4.22'
        const pureVersion = _retrieveVersion()
        // is nightly build newer than the last release
        const isNewestNightly = currentCompilerName.includes('nightly') && semver.gt(pureVersion, releasedVersions[0])
        // checking if the selected version is in the pragma range
        const isInRange = semver.satisfies(pureVersion, pragma)
        // checking if the selected version is from official compilers list(excluding custom versions) and in range or greater
        const isOfficial = allVersions.includes(currentCompilerName)
        if (isOfficial && (!isInRange && !isNewestNightly)) {
          const compilerToLoad = semver.maxSatisfying(releasedVersions, pragma)
          const compilerPath = state.allversions.filter(obj => !obj.prerelease && obj.version === compilerToLoad)[0].path
          if (state.selectedVersion !== compilerPath) {
            setState((prevState) => {
              return { ...prevState, selectedVersion: compilerPath }
            })
            _updateVersionSelector(compilerPath)
          }
        }
      }
    })
  }

  const isSolFileSelected = (currentFile = '') => {
    if (!currentFile) currentFile = api.getConfiguration('currentFile')
    if (!currentFile) return false
    const extention = currentFile.substr(currentFile.length - 3, currentFile.length)
    return extention.toLowerCase() === 'sol' || extention.toLowerCase() === 'yul'
  }

  const sessionSwitched = () => {
    if (!compileIcon.current) return
    scheduleCompilation()
  }

  const startingCompilation = () => {
    if (!compileIcon.current) return
    compileIcon.current.setAttribute('title', 'compiling...')
    compileIcon.current.classList.remove('remixui_bouncingIcon')
    compileIcon.current.classList.add('remixui_spinningIcon')
  }

  const compilationDuration = (speed: number) => {
    if (speed > 1000) {
      console.log(`Last compilation took ${speed}ms. We suggest to turn off autocompilation.`)
    }
  }

  const contentChanged = () => {
    if (!compileIcon.current) return
    scheduleCompilation()
    compileIcon.current.classList.add('remixui_bouncingIcon') // @TODO: compileView tab
  }

  const loadingCompiler = () => {
    if (!compileIcon.current) return
    compileIcon.current.setAttribute('title', 'compiler is loading, please wait a few moments.')
    compileIcon.current.classList.add('remixui_spinningIcon')
    _updateLanguageSelector()
    setDisableCompileButton(true)
  }

  const compilerLoaded = () => {
    if (!compileIcon.current) return
    compileIcon.current.setAttribute('title', '')
    compileIcon.current.classList.remove('remixui_spinningIcon')
    if (state.autoCompile) compile()
    const isDisabled = !compiledFileName || (compiledFileName && !isSolFileSelected(compiledFileName))

    setDisableCompileButton(isDisabled)
  }

  const compilationFinished = () => {
    if (!compileIcon.current) return
    compileIcon.current.setAttribute('title', 'idle')
    compileIcon.current.classList.remove('remixui_spinningIcon')
    compileIcon.current.classList.remove('remixui_bouncingIcon')
    _paq.push(['trackEvent', 'compiler', 'compiled_with_version', _retrieveVersion()])
  }

  const scheduleCompilation = () => {
    if (!state.autoCompile) return
    if (state.compileTimeout) window.clearTimeout(state.compileTimeout)
    const compileTimeout = window.setTimeout(() => {
      state.autoCompile && compile()
    }, state.timeout)

    setState(prevState => {
      return { ...prevState, compileTimeout }
    })
  }

  const compile = () => {
    const currentFile = api.getConfiguration('currentFile')

    if (!isSolFileSelected()) return

    _setCompilerVersionFromPragma(currentFile)
    compileTabLogic.runCompiler(hhCompilation)
  }

  const _retrieveVersion = (version?) => {
    if (!version) version = state.selectedVersion
    if (version === 'builtin') version = state.defaultVersion
    return semver.coerce(version) ? semver.coerce(version).version : ''
  }

  const _updateVersionSelector = (version, customUrl = '') => {
    // update selectedversion of previous one got filtered out
    let selectedVersion = version
    if (!selectedVersion || !_shouldBeAdded(selectedVersion)) {
      selectedVersion = state.defaultVersion
      setState(prevState => {
        return { ...prevState, selectedVersion }
      })
    }
    updateCurrentVersion(selectedVersion)
    api.setParameters({ version: selectedVersion })
    let url

    if (customUrl !== '') {
      selectedVersion = customUrl
      setState(prevState => {
        return { ...prevState, selectedVersion, customVersions: [...state.customVersions, selectedVersion] }
      })
      updateCurrentVersion(selectedVersion)
      url = customUrl
      api.setParameters({ version: selectedVersion })
    } else if (selectedVersion === 'builtin') {
      let location: string | Location = window.document.location
      let path = location.pathname
      if (!path.startsWith('/')) path = '/' + path
      location = `${location.protocol}//${location.host}${path}assets/js`
      if (location.endsWith('index.html')) location = location.substring(0, location.length - 10)
      if (!location.endsWith('/')) location += '/'
      url = location + 'soljson.js'
    } else {
      if (selectedVersion.indexOf('soljson') !== 0 || helper.checkSpecialChars(selectedVersion)) {
        return console.log('loading ' + selectedVersion + ' not allowed')
      }
      url = `${urlFromVersion(selectedVersion)}`
    }

    // Workers cannot load js on "file:"-URLs and we get a
    // "Uncaught RangeError: Maximum call stack size exceeded" error on Chromium,
    // resort to non-worker version in that case.
    if (selectedVersion === 'builtin') selectedVersion = state.defaultVersion
    if (selectedVersion !== 'builtin' && canUseWorker(selectedVersion)) {
      compileTabLogic.compiler.loadVersion(true, url)
    } else {
      compileTabLogic.compiler.loadVersion(false, url)
    }
  }

  const _shouldBeAdded = (version) => {
    return !version.includes('nightly') ||
           (version.includes('nightly') && state.includeNightlies)
  }

  const promptCompiler = () => {
    // custom url https://solidity-blog.s3.eu-central-1.amazonaws.com/data/08preview/soljson.js
    modal('Add a custom compiler', promptMessage('URL'), 'OK', addCustomCompiler, 'Cancel', () => {})
  }

  const promptMessage = (message) => {
    return (
      <>
        <span>{ message }</span>
        <input type="text" data-id="modalDialogCustomPromptCompiler" className="form-control" ref={promptMessageInput} />
      </>
    )
  }

  const addCustomCompiler = () => {
    const url = promptMessageInput.current.value

    setState(prevState => {
      return { ...prevState, selectedVersion: url }
    })
    _updateVersionSelector(state.defaultVersion, url)
  }

  const handleLoadVersion = (value) => {
    setState(prevState => {
      return { ...prevState, selectedVersion: value }
    })
    updateCurrentVersion(value)
    _updateVersionSelector(value)
    _updateLanguageSelector()
  }

  const _updateLanguageSelector = () => {
    // This is the first version when Yul is available
    if (!semver.valid(_retrieveVersion()) || semver.lt(_retrieveVersion(), 'v0.5.7+commit.6da8b019.js')) {
      handleLanguageChange('Solidity')
      compileTabLogic.setLanguage('Solidity')
    }
  }

  const handleAutoCompile = (e) => {
    const checked = e.target.checked

    api.setConfiguration('autoCompile', checked)
    checked && compile()
    setState(prevState => {
      return { ...prevState, autoCompile: checked }
    })
  }

  const handleOptimizeChange = (value) => {
    const checked = !!value

    api.setConfiguration('optimise', checked)
    compileTabLogic.setOptimize(checked)
    if (compileTabLogic.optimize) {
      compileTabLogic.setRuns(parseInt(state.runs))
    } else {
      compileTabLogic.setRuns(200)
    }
    state.autoCompile && compile()
    setState(prevState => {
      return { ...prevState, optimise: checked }
    })
  }

  const onChangeRuns = (value) => {
    const runs = value

    compileTabLogic.setRuns(parseInt(runs))
    state.autoCompile && compile()
    setState(prevState => {
      return { ...prevState, runs }
    })
  }

  const handleHideWarningsChange = (e) => {
    const checked = e.target.checked

    api.setConfiguration('hideWarnings', checked)
    state.autoCompile && compile()
    setState(prevState => {
      return { ...prevState, hideWarnings: checked }
    })
  }

  const handleNightliesChange = (e) => {
    const checked = e.target.checked

    if (!checked) handleLoadVersion(state.defaultVersion)
    api.setConfiguration('includeNightlies', checked)
    setState(prevState => {
      return { ...prevState, includeNightlies: checked }
    })
  }

  const handleLanguageChange = (value) => {
    compileTabLogic.setLanguage(value)
    state.autoCompile && compile()
    setState(prevState => {
      return { ...prevState, language: value }
    })
  }

  const handleEvmVersionChange = (value) => {
    if (!value) return
    let v = value
    if (v === 'default') {
      v = null
    }
    compileTabLogic.setEvmVersion(v)
    state.autoCompile && compile()
    setState(prevState => {
      return { ...prevState, evmVersion: value }
    })
  }

  const updatehhCompilation = (event) => {
    const checked = event.target.checked

    sethhCompilation(checked)
    api.setHardHatCompilation(checked)
  }

  /*
    The following functions map with the above event handlers.
    They are an external API for modifying the compiler configuration.
  */
  const setConfiguration = (settings: ConfigurationSettings) => {
    handleLoadVersion(`soljson-v${settings.version}.js`)
    handleEvmVersionChange(settings.evmVersion)
    handleLanguageChange(settings.language)
    handleOptimizeChange(settings.optimize)
    onChangeRuns(settings.runs)
  }

  return (
    <section>
      <article>
        <header className='remixui_compilerSection border-bottom'>
          <div className="mb-2">
            <label className="remixui_compilerLabel form-check-label" htmlFor="versionSelector">
              Compiler
              <button className="far fa-plus-square border-0 p-0 mx-2 btn-sm" onClick={promptCompiler} title="Add a custom compiler with URL"></button>
            </label>
            <select value={ state.selectedVersion || state.defaultVersion } onChange={(e) => handleLoadVersion(e.target.value) } className="custom-select" id="versionSelector" disabled={state.allversions.length <= 0}>
              { state.allversions.length <= 0 && <option disabled data-id={state.selectedVersion === state.defaultVersion ? 'selected' : ''}>{ state.defaultVersion }</option> }
              { state.allversions.length <= 0 && <option disabled data-id={state.selectedVersion === 'builtin' ? 'selected' : ''}>builtin</option> }
              { state.customVersions.map((url, i) => <option key={i} data-id={state.selectedVersion === url ? 'selected' : ''} value={url}>custom</option>)}
              { state.allversions.map((build, i) => {
                return _shouldBeAdded(build.longVersion)
                  ? <option key={i} value={build.path} data-id={state.selectedVersion === build.path ? 'selected' : ''}>{build.longVersion}</option>
                  : null
              })
              }
            </select>
          </div>
          <div className="mb-2 remixui_nightlyBuilds custom-control custom-checkbox">
            <input className="mr-2 custom-control-input" id="nightlies" type="checkbox" onChange={handleNightliesChange} checked={state.includeNightlies} />
            <label htmlFor="nightlies" data-id="compilerNightliesBuild" className="form-check-label custom-control-label">Include nightly builds</label>
          </div>
          <div className="mb-2">
            <label className="remixui_compilerLabel form-check-label" htmlFor="compilierLanguageSelector">Language</label>
            <select onChange={(e) => handleLanguageChange(e.target.value)} value={state.language} className="custom-select" id="compilierLanguageSelector" title="Available since v0.5.7">
              <option data-id={state.language === 'Solidity' ? 'selected' : ''} value='Solidity'>Solidity</option>
              <option data-id={state.language === 'Yul' ? 'selected' : ''} value='Yul'>Yul</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="remixui_compilerLabel form-check-label" htmlFor="evmVersionSelector">EVM Version</label>
            <select value={state.evmVersion} onChange={(e) => handleEvmVersionChange(e.target.value)} className="custom-select" id="evmVersionSelector">
              <option data-id={state.evmVersion === 'default' ? 'selected' : ''} value="default">compiler default</option>
              <option data-id={state.evmVersion === 'london' ? 'selected' : ''} value="london">london</option>
              <option data-id={state.evmVersion === 'berlin' ? 'selected' : ''} value="berlin">berlin</option>
              <option data-id={state.evmVersion === 'muirGlacier' ? 'selected' : ''} value="muirGlacier">muirGlacier</option>
              <option data-id={state.evmVersion === 'istanbul' ? 'selected' : ''} value="istanbul">istanbul</option>
              <option data-id={state.evmVersion === 'petersburg' ? 'selected' : ''} value="petersburg">petersburg</option>
              <option data-id={state.evmVersion === 'constantinople' ? 'selected' : ''} value="constantinople">constantinople</option>
              <option data-id={state.evmVersion === 'byzantium' ? 'selected' : ''} value="byzantium">byzantium</option>
              <option data-id={state.evmVersion === 'spuriousDragon' ? 'selected' : ''} value="spuriousDragon">spuriousDragon</option>
              <option data-id={state.evmVersion === 'tangerineWhistle' ? 'selected' : ''} value="tangerineWhistle">tangerineWhistle</option>
              <option data-id={state.evmVersion === 'homestead' ? 'selected' : ''} value="homestead">homestead</option>
            </select>
          </div>
          <div className="mt-3">
            <p className="mt-2 remixui_compilerLabel">Compiler Configuration</p>
            <div className="mt-2 remixui_compilerConfig custom-control custom-checkbox">
              <input className="remixui_autocompile custom-control-input" type="checkbox" onChange={handleAutoCompile} data-id="compilerContainerAutoCompile" id="autoCompile" title="Auto compile" checked={state.autoCompile} />
              <label className="form-check-label custom-control-label" htmlFor="autoCompile">Auto compile</label>
            </div>
            <div className="mt-2 remixui_compilerConfig custom-control custom-checkbox">
              <div className="justify-content-between align-items-center d-flex">
                <input onChange={(e) => { handleOptimizeChange(e.target.checked) }} className="custom-control-input" id="optimize" type="checkbox" checked={state.optimise} />
                <label className="form-check-label custom-control-label" htmlFor="optimize">Enable optimization</label>
                <input
                  min="1"
                  className="custom-select ml-2 remixui_runs"
                  id="runs"
                  placeholder="200"
                  value={state.runs}
                  type="number"
                  title="Estimated number of times each opcode of the deployed code will be executed across the life-time of the contract."
                  onChange={(e) => onChangeRuns(e.target.value)}
                  disabled={!state.optimise}
                />
              </div>
            </div>
            <div className="mt-2 remixui_compilerConfig custom-control custom-checkbox">
              <input className="remixui_autocompile custom-control-input" onChange={handleHideWarningsChange} id="hideWarningsBox" type="checkbox" title="Hide warnings" checked={state.hideWarnings} />
              <label className="form-check-label custom-control-label" htmlFor="hideWarningsBox">Hide warnings</label>
            </div>
          </div>
          {
            api.isHardHatProject &&
            <div className="mt-3 remixui_compilerConfig custom-control custom-checkbox">
              <input className="remixui_autocompile custom-control-input" onChange={updatehhCompilation} id="enableHardhat" type="checkbox" title="Enable Hardhat Compilation" checked={hhCompilation} />
              <label className="form-check-label custom-control-label" htmlFor="enableHardhat">Enable Hardhat Compilation</label>
              <a className="mt-1 text-nowrap" href='https://remix-ide.readthedocs.io/en/latest/hardhat.html#enable-hardhat-compilation' target={'_blank'}>
                <OverlayTrigger placement={'right'} overlay={
                  <Tooltip className="text-nowrap" id="overlay-tooltip">
                    <span className="p-1 pr-3" style={{ backgroundColor: 'black', minWidth: '230px' }}>Learn how to use Hardhat Compilation</span>
                  </Tooltip>
                }>
                  <i style={{ fontSize: 'medium' }} className={'ml-2 fal fa-info-circle'} aria-hidden="true"></i>
                </OverlayTrigger>
              </a>
            </div>
          }
          <button id="compileBtn" data-id="compilerContainerCompileBtn" className="btn btn-primary btn-block remixui_disabled mt-3" title="Compile" onClick={compile} disabled={disableCompileButton}>
            <span>
              { <i ref={compileIcon} className="fas fa-sync remixui_icon" aria-hidden="true"></i> }
              Compile { typeof state.compiledFileName === 'string' ? helper.extractNameFromKey(state.compiledFileName) || '<no file selected>' : '<no file selected>' }
            </span>
          </button>
        </header>
      </article>
    </section>
  )
}

export default CompilerContainer
