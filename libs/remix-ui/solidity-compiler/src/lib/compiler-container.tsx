import React, { useEffect, useState, useRef, useReducer } from 'react' // eslint-disable-line
import semver from 'semver'
import { CompilerContainerProps } from './types'
import * as helper from '../../../../../apps/remix-ide/src/lib/helper'
import { canUseWorker, baseURLBin, baseURLWasm, urlFromVersion, pathToURL, promisedMiniXhr } from './logic/compiler-utils' // eslint-disable-line
import { compilerReducer, compilerInitialState } from './reducers/compiler'
import { resetCompilerMode, resetEditorMode, listenToEvents } from './actions/compiler'

import './css/style.css'

export const CompilerContainer = (props: CompilerContainerProps) => {
  const { editor, config, queryParams, compileTabLogic, tooltip, modal, compiledFileName, setHardHatCompilation, updateCurrentVersion, isHardHatProject } = props // eslint-disable-line
  const [state, setState] = useState({
    hideWarnings: false,
    autoCompile: false,
    optimise: false,
    compileTimeout: null,
    timeout: 300,
    allversions: [],
    customVersions: [],
    selectedVersion: null,
    defaultVersion: 'soljson-v0.8.4+commit.c7e474f2.js', // this default version is defined: in makeMockCompiler (for browser test)
    selectedLanguage: '',
    runs: '',
    compiledFileName: '',
    includeNightlies: false,
    language: '',
    evmVersion: ''
  })
  const compileIcon = useRef(null)
  const warningIcon = useRef(null)
  const promptMessageInput = useRef(null)
  const [hhCompilation, sethhCompilation] = useState(false)
  const [compilerContainer, dispatch] = useReducer(compilerReducer, compilerInitialState)

  useEffect(() => {
    fetchAllVersion((allversions, selectedVersion, isURL) => {
      setState(prevState => {
        return { ...prevState, allversions }
      })
      if (isURL) _updateVersionSelector(selectedVersion)
      else {
        setState(prevState => {
          return { ...prevState, selectedVersion }
        })
        updateCurrentVersion(selectedVersion)
        _updateVersionSelector()
      }
    })
    const currentFileName = config.get('currentFile')

    currentFile(currentFileName)
    listenToEvents(editor, compileTabLogic)(dispatch)
  }, [])

  useEffect(() => {
    if (compileTabLogic && compileTabLogic.compiler) {
      setState(prevState => {
        return {
          ...prevState,
          hideWarnings: config.get('hideWarnings') || false,
          autoCompile: config.get('autoCompile') || false,
          optimise: config.get('optimise') || false,
          includeNightlies: config.get('includeNightlies') || false
        }
      })
    }
  }, [compileTabLogic])

  useEffect(() => {
    setState(prevState => {
      return { ...prevState, compiledFileName }
    })
  }, [compiledFileName])

  useEffect(() => {
    if (compilerContainer.compiler.mode) {
      switch (compilerContainer.compiler.mode) {
        case 'startingCompilation':
          startingCompilation()
          resetCompilerMode()(dispatch)
          break
        case 'compilationDuration':
          compilationDuration(compilerContainer.compiler.args)
          resetCompilerMode()(dispatch)
          break
        case 'loadingCompiler':
          loadingCompiler()
          resetCompilerMode()(dispatch)
          break
        case 'compilerLoaded':
          compilerLoaded()
          resetCompilerMode()(dispatch)
          break
        case 'compilationFinished':
          compilationFinished(compilerContainer.compiler.args)
          resetCompilerMode()(dispatch)
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

  // fetching both normal and wasm builds and creating a [version, baseUrl] map
  const fetchAllVersion = async (callback) => {
    let selectedVersion, allVersionsWasm, isURL
    let allVersions = [{ path: 'builtin', longVersion: 'latest local version - 0.7.4' }]
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
      if (queryParams.get().version) selectedVersion = queryParams.get().version
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
    compileTabLogic.fileManager.readFile(filename).then(data => {
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
            state.selectedVersion = compilerPath
            _updateVersionSelector()
          }
        }
      }
    })
  }

  const isSolFileSelected = (currentFile = '') => {
    if (!currentFile) currentFile = config.get('currentFile')
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

  const compilationDuration = ({ speed }) => {
    if (!warningIcon.current) return
    if (speed > 1000) {
      const msg = `Last compilation took ${speed}ms. We suggest to turn off autocompilation.`

      warningIcon.current.setAttribute('title', msg)
      warningIcon.current.style.visibility = 'visible'
    } else {
      warningIcon.current.style.visibility = 'hidden'
    }
  }

  const contentChanged = () => {
    if (!compileIcon.current) return
    scheduleCompilation()
    compileIcon.current.classList.add('remixui_bouncingIcon') // @TODO: compileView tab
  }

  const loadingCompiler = () => {
    if (!compileIcon.current) return
    // _disableCompileBtn(true)
    compileIcon.current.setAttribute('title', 'compiler is loading, please wait a few moments.')
    compileIcon.current.classList.add('remixui_spinningIcon')
    warningIcon.current.style.visibility = 'hidden'
    _updateLanguageSelector()
  }

  const compilerLoaded = () => {
    if (!compileIcon.current) return
    // _disableCompileBtn(false)
    compileIcon.current.setAttribute('title', '')
    compileIcon.current.classList.remove('remixui_spinningIcon')
    if (state.autoCompile) compile()
  }

  const compilationFinished = ({ success, data, source }) => {
      if (!compileIcon.current) return
      compileIcon.current.setAttribute('title', 'idle')
      compileIcon.current.classList.remove('remixui_spinningIcon')
      compileIcon.current.classList.remove('remixui_bouncingIcon')
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
    const currentFile = config.get('currentFile')

    if (!isSolFileSelected()) return

    _setCompilerVersionFromPragma(currentFile)
    compileTabLogic.runCompiler()
  }

  const _retrieveVersion = (version?) => {
    if (!version) version = state.selectedVersion
    if (version === 'builtin') version = state.defaultVersion
    return semver.coerce(version) ? semver.coerce(version).version : ''
  }

  const _updateVersionSelector = (customUrl = '') => {
    // update selectedversion of previous one got filtered out
    let selectedVersion = state.selectedVersion
    if (!selectedVersion || !_shouldBeAdded(selectedVersion)) {
      selectedVersion = state.defaultVersion
      setState(prevState => {
        return { ...prevState, selectedVersion }
      })
      updateCurrentVersion(selectedVersion)
    }
    queryParams.update({ version: selectedVersion })
    let url

    if (customUrl !== '') {
      selectedVersion = customUrl
      setState(prevState => {
        return { ...prevState, selectedVersion, customVersions: [...state.customVersions, selectedVersion] }
      })
      updateCurrentVersion(selectedVersion)
      url = customUrl
      queryParams.update({ version: selectedVersion })
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
    if (selectedVersion !== 'builtin' && canUseWorker(selectedVersion)) {
      compileTabLogic.compiler.loadVersion(true, url)
      // setVersionText('(loading using worker)')
    } else {
      compileTabLogic.compiler.loadVersion(false, url)
      // setVersionText('(loading)')
    }
  }

  const _shouldBeAdded = (version) => {
    return !version.includes('nightly') ||
           (version.includes('nightly') && state.includeNightlies)
  }

  // const setVersionText = (text) => {
  // if (this._view.version) this._view.version.innerText = text
  // }

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
    _updateVersionSelector(url)
  }

  const handleLoadVersion = (value) => {
    setState(prevState => {
      return { ...prevState, selectedVersion: value }
    })
    updateCurrentVersion(value)
    _updateVersionSelector()
    _updateLanguageSelector()
  }

  const _updateLanguageSelector = () => {
    // This is the first version when Yul is available
    if (!semver.valid(_retrieveVersion()) || semver.lt(_retrieveVersion(), 'v0.5.7+commit.6da8b019.js')) {
      // this._view.languageSelector.setAttribute('disabled', '')
      // this._view.languageSelector.value = 'Solidity'
      // this.compileTabLogic.setLanguage('Solidity')
    } else {
      // this._view.languageSelector.removeAttribute('disabled')
    }
  }

  const handleAutoCompile = (e) => {
    const checked = e.target.checked

    config.set('autoCompile', checked)
    setState(prevState => {
      return { ...prevState, autoCompile: checked }
    })
  }

  const handleOptimizeChange = (e) => {
    const checked = !!e.target.checked

    config.set('optimise', checked)
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

  const onChangeRuns = (e) => {
    const runs = e.target.value

    compileTabLogic.setRuns(parseInt(runs))
    state.autoCompile && compile()
    setState(prevState => {
      return { ...prevState, runs }
    })
  }

  const handleHideWarningsChange = (e) => {
    const checked = e.target.checked

    config.set('hideWarnings', checked)
    state.autoCompile && compile()
    setState(prevState => {
      return { ...prevState, hideWarnings: checked }
    })
  }

  const handleNightliesChange = (e) => {
    const checked = e.target.checked

    config.set('includeNightlies', checked)
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
    setHardHatCompilation(checked)
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
              { state.allversions.length <= 0 && <option disabled>{ state.defaultVersion }</option> }
              { state.allversions.length <= 0 && <option disabled>builtin</option> }
              { state.customVersions.map((url, i) => <option key={i} value={url}>custom</option> )}
              { state.allversions.map((build, i) => {
                return _shouldBeAdded(build.longVersion)
                  ? <option key={i} value={build.path}>{build.longVersion}</option>
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
            <select onChange={(e) => handleLanguageChange(e.target.value)} className="custom-select" id="compilierLanguageSelector" title="Available since v0.5.7">
              <option>Solidity</option>
              <option>Yul</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="remixui_compilerLabel form-check-label" htmlFor="evmVersionSelector">EVM Version</label>
            <select onChange={(e) => handleEvmVersionChange(e.target.value)} className="custom-select" id="evmVersionSelector">
              <option value="default">compiler default</option>
              <option value="muirGlacier">muirGlacier</option>
              <option value="istanbul">istanbul</option>
              <option value="petersburg">petersburg</option>
              <option value="constantinople">constantinople</option>
              <option value="byzantium">byzantium</option>
              <option value="spuriousDragon">spuriousDragon</option>
              <option value="tangerineWhistle">tangerineWhistle</option>
              <option value="homestead">homestead</option>
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
                <input onChange={handleOptimizeChange} className="custom-control-input" id="optimize" type="checkbox" checked={state.optimise} />
                <label className="form-check-label custom-control-label" htmlFor="optimize">Enable optimization</label>
                <input
                  min="1"
                  className="custom-select ml-2 remixui_runs"
                  id="runs"
                  placeholder="200"
                  defaultValue="200"
                  type="number"
                  title="Estimated number of times each opcode of the deployed code will be executed across the life-time of the contract."
                  onChange={onChangeRuns}
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
            isHardHatProject && <div className="mt-2 remixui_compilerConfig custom-control custom-checkbox">
              <input className="remixui_autocompile custom-control-input" onChange={updatehhCompilation} id="enableHardhat" type="checkbox" title="Enable Hardhat Compilation" checked={hhCompilation} />
              <label className="form-check-label custom-control-label" htmlFor="enableHardhat">Enable Hardhat Compilation</label>
            </div>
          }
          <button id="compileBtn" data-id="compilerContainerCompileBtn" className="btn btn-primary btn-block remixui_disabled mt-3" title="Compile" onClick={compile} disabled={!state.compiledFileName || (state.compiledFileName && !isSolFileSelected(state.compiledFileName))}>
            <span>
              <i ref={warningIcon} title="Compilation Slow" style={{ visibility: 'hidden' }} className="remixui_warnCompilationSlow fas fa-exclamation-triangle" aria-hidden="true"></i>
              { warningIcon.current && warningIcon.current.style.visibility === 'hidden' && <i ref={compileIcon} className="fas fa-sync remixui_icon" aria-hidden="true"></i> }
              Compile { state.compiledFileName || '<no file selected>' }
            </span>
          </button>
        </header>
      </article>
    </section>
  )
}

export default CompilerContainer
