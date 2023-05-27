import React, { useEffect, useState, useReducer, useRef } from 'react' // eslint-disable-line
import Button from './Button/StaticAnalyserButton' // eslint-disable-line
import { util } from '@remix-project/remix-lib'
import _ from 'lodash'
import * as semver from 'semver'
import { TreeView, TreeViewItem } from '@remix-ui/tree-view' // eslint-disable-line
import { RemixUiCheckbox } from '@remix-ui/checkbox' // eslint-disable-line
import ErrorRenderer from './ErrorRenderer' // eslint-disable-line
import { compilation } from './actions/staticAnalysisActions'
import { initialState, analysisReducer } from './reducers/staticAnalysisReducer'
import { CodeAnalysis } from '@remix-project/remix-analyzer'
import { CustomTooltip } from '@remix-ui/helper'
import Tab from 'react-bootstrap/Tab'
import Tabs from 'react-bootstrap/Tabs'
import { Fade } from 'react-bootstrap'
import { AnalysisTab } from '../staticanalyser'

declare global {
  interface Window {
    _paq: any
  }
}
const _paq = window._paq = window._paq || []  //eslint-disable-line

/* eslint-disable-next-line */
export interface RemixUiStaticAnalyserProps {
  registry: any,
  event: any,
  analysisModule: AnalysisTab
}

export const RemixUiStaticAnalyser = (props: RemixUiStaticAnalyserProps) => {
  const [runner] = useState(new CodeAnalysis())

  const preProcessModules = (arr: any) => {
    return arr.map((Item, i) => {
      const itemObj = new Item()
      itemObj._index = i
      itemObj.categoryDisplayName = itemObj.category.displayName
      itemObj.categoryId = itemObj.category.id
      return itemObj
    })
  }

  const groupedModules = util.groupBy(
    preProcessModules(runner.modules()),
    'categoryId'
  )

  const getIndex = (modules, array) => {
    Object.values(modules).map((value: {_index}) => {
      if (Array.isArray(value)) {
        value.forEach((x) => {
          array.push(x._index.toString())
        })
      } else {
        array.push(value._index.toString())
      }
    })
  }

  const groupedModuleIndex = (modules) => {
    const indexOfCategory = []
    if (!_.isEmpty(modules)) {
      getIndex(modules, indexOfCategory)
    }
    return indexOfCategory
  }
  const [autoRun, setAutoRun] = useState(true)
  const [slitherEnabled, setSlitherEnabled] = useState(false)
  const [showSlither, setShowSlither] = useState(false)
  const [isSupportedVersion, setIsSupportedVersion] = useState(false)
  let [showLibsWarning, setShowLibsWarning] = useState(false) // eslint-disable-line prefer-const
  const [categoryIndex, setCategoryIndex] = useState(groupedModuleIndex(groupedModules))
  const [warningState, setWarningState] = useState({})
  const [runButtonTitle, setRunButtonTitle] = useState<string>('Run Static Analysis')
  const [hideWarnings, setHideWarnings] = useState(false)

  const warningContainer = useRef(null)
  const allWarnings = useRef({})
  const [state, dispatch] = useReducer(analysisReducer, initialState)

  /**
   * Disable static analysis for contracts whose compiler version is
   * less than 0.4.12
   * @param version {string} - Solidity compiler version
   */
  const setDisableForRun = (version: string) => {
    const truncateVersion = (version: string) => {
      const tmp: RegExpExecArray | null = /^(\d+.\d+.\d+)/.exec(version)
      return tmp ? tmp[1] : version
    }
    if (version && version != '' && !semver.gt(truncateVersion(version), '0.4.12')) {
      setIsSupportedVersion(false)
      setRunButtonTitle('Select Solidity compiler version greater than 0.4.12.')
    } else {
      setIsSupportedVersion(true)
      setRunButtonTitle('Run static analysis')
    }
  }

  useEffect(() => {
    compilation(props.analysisModule, dispatch)
  }, [props])

  useEffect(() => {
    setWarningState({})
    const runAnalysis = async () => {
      await run(state.data, state.source, state.file)
    }
    if (autoRun) {
      if (state.data !== null) {
        runAnalysis().catch(console.error);
      }
    } else {
      props.event.trigger('staticAnaysisWarning', [])
    }
    return () => { }
  }, [state])

  useEffect(() => {
    props.analysisModule.call('solidity', 'getCompilerState').then((compilerState) => setDisableForRun(compilerState.currentVersion))
  }, [])

  useEffect(() => {
    props.analysisModule.on('filePanel', 'setWorkspace', (currentWorkspace) => {
      // Reset warning state
      setWarningState([])
      // Reset badge
      props.event.trigger('staticAnaysisWarning', [])
      // Reset state
      dispatch({ type: '', payload: initialState })
      // Show 'Enable Slither Analysis' checkbox
      if (currentWorkspace && currentWorkspace.isLocalhost === true) setShowSlither(true)
      else {
        setShowSlither(false)
        setSlitherEnabled(false)
      }
    })
    props.analysisModule.on('manager', 'pluginDeactivated', (plugin) => {
      // Hide 'Enable Slither Analysis' checkbox
      if (plugin.name === 'remixd') {
        // Reset warning state
        setWarningState([])
        // Reset badge
        props.event.trigger('staticAnaysisWarning', [])
        // Reset state
        dispatch({ type: '', payload: initialState })
        setShowSlither(false)
        setSlitherEnabled(false)
      }
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    props.analysisModule.on('solidity', 'compilerLoaded', async (version: string, license: string) => {
      setDisableForRun(version)
    })
    return () => { }
  }, [props])

  const message = (name, warning, more, fileName, locationString) : string => {
    return (`
      <span className='d-flex flex-column'>
      <span className='h6 font-weight-bold'>${name}</span>
      ${warning}
      ${more
        ? (<span><a href={more} target='_blank'>more</a></span>)
        : (<span> </span>)
      }
      <span className="" title={Position in ${fileName}}>Pos: ${locationString}</span>
      </span>`
    )
  }

  const filterWarnings = () => {
    let newWarningState = {}
    let newWarningCount = 0
    if (showLibsWarning) {
      for (const category in allWarnings.current)
        newWarningCount = newWarningCount + allWarnings.current[category].length
      newWarningState = allWarnings.current
    }
    else {
      for (const category in allWarnings.current) {
        const warnings = allWarnings.current[category]
        newWarningState[category] = []
        for (const warning of warnings) {
          if (!warning.options.isLibrary) {
            newWarningCount++
            newWarningState[category].push(warning)
          }
        }
      }
    }
    props.event.trigger('staticAnaysisWarning', [newWarningCount])
    setWarningState(newWarningState)
  }

  const showWarnings = (warningMessage, groupByKey) => {
    const resultArray = []
    warningMessage.map(x => {
      resultArray.push(x)
    })
    function groupBy (objectArray, property) {
      return objectArray.reduce((acc, obj) => {
        const key = obj[property]
        if (!acc[key]) {
          acc[key] = []
        }
        // Add object to list for given key's value
        acc[key].push(obj)
        return acc
      }, {})
    }

    const groupedCategory = groupBy(resultArray, groupByKey)
    allWarnings.current = groupedCategory
    filterWarnings()
  }

  const run = async (lastCompilationResult, lastCompilationSource, currentFile) => {
    console.log({ state, lastCompilationResult, lastCompilationSource, currentFile })
    if (!isSupportedVersion) return
    if (state.data !== null) {
      if (lastCompilationResult && (categoryIndex.length > 0 || slitherEnabled)) {
        const warningMessage = []
        const warningErrors = []

        const hints = await props.analysisModule.call('solhint', 'lint', currentFile)
        console.log({ hints })

        // Remix Analysis
        _paq.push(['trackEvent', 'solidityStaticAnalyzer', 'analyze', 'remixAnalyzer'])
        const results = runner.run(lastCompilationResult, categoryIndex)
        for (const result of results) {
          let moduleName
          Object.keys(groupedModules).map(key => {
            groupedModules[key].forEach(el => {
              if (el.name === result.name) {
                moduleName = groupedModules[key][0].categoryDisplayName
              }
            })
          })
          for (const item of result.report) {
            let location: any = {}
            let locationString = 'not available'
            let column = 0
            let row = 0
            let fileName = currentFile
            let isLibrary = false

            if (item.location) {
              const split = item.location.split(':')
              const file = split[2]
              location = {
                start: parseInt(split[0]),
                length: parseInt(split[1])
              }
              location = props.analysisModule._deps.offsetToLineColumnConverter.offsetToLineColumn(
                location,
                parseInt(file),
                lastCompilationSource.sources,
                lastCompilationResult.sources
              )
              row = location.start.line
              column = location.start.column
              locationString = row + 1 + ':' + column + ':'
              fileName = Object.keys(lastCompilationResult.sources)[file]
            }
            if(fileName !== currentFile) {
              const {file, provider} = await props.analysisModule.call('fileManager', 'getPathFromUrl', fileName)
              if (file.startsWith('.deps') || (provider.type === 'localhost' && file.startsWith('localhost/node_modules'))) isLibrary = true
            }
            const msg = message(result.name, item.warning, item.more, fileName, locationString)
            const options = {
              type: 'warning',
              useSpan: true,
              errFile: fileName,
              fileName,
              isLibrary,
              errLine: row,
              errCol: column,
              item: item,
              name: result.name,
              locationString,
              more: item.more,
              location: location
            }
            warningErrors.push(options)
            warningMessage.push({ msg, options, hasWarning: true, warningModuleName: moduleName })
          }
        }
        // Slither Analysis
        if (slitherEnabled) {
          try {
            const compilerState = await props.analysisModule.call('solidity', 'getCompilerState')
            const { currentVersion, optimize, evmVersion } = compilerState
            await props.analysisModule.call('terminal', 'log', { type: 'log', value: '[Slither Analysis]: Running...' })
            _paq.push(['trackEvent', 'solidityStaticAnalyzer', 'analyze', 'slitherAnalyzer'])
            const result = await props.analysisModule.call('slither', 'analyse', state.file, { currentVersion, optimize, evmVersion })
            if (result.status) {
              props.analysisModule.call('terminal', 'log', { type: 'log', value: `[Slither Analysis]: Analysis Completed!! ${result.count} warnings found.` })
              const report = result.data
              for (const item of report) {
                let location: any = {}
                let locationString = 'not available'
                let column = 0
                let row = 0
                let fileName = currentFile
                let isLibrary = false

                if (item.sourceMap && item.sourceMap.length) {
                  let path = item.sourceMap[0].source_mapping.filename_relative
                  let fileIndex = Object.keys(lastCompilationResult.sources).indexOf(path)
                  if (fileIndex === -1) {
                    path = await props.analysisModule.call('fileManager', 'getUrlFromPath', path)
                    fileIndex = Object.keys(lastCompilationResult.sources).indexOf(path.file)
                  }
                  if (fileIndex >= 0) {
                    location = {
                      start: item.sourceMap[0].source_mapping.start,
                      length: item.sourceMap[0].source_mapping.length
                    }
                    location = props.analysisModule._deps.offsetToLineColumnConverter.offsetToLineColumn(
                      location,
                      fileIndex,
                      lastCompilationSource.sources,
                      lastCompilationResult.sources
                    )
                    row = location.start.line
                    column = location.start.column
                    locationString = row + 1 + ':' + column + ':'
                    fileName = Object.keys(lastCompilationResult.sources)[fileIndex]
                  }
                }
                if(fileName !== currentFile) {
                  const {file, provider} = await props.analysisModule.call('fileManager', 'getPathFromUrl', fileName)
                  if (file.startsWith('.deps') || (provider.type === 'localhost' && file.startsWith('localhost/node_modules'))) isLibrary = true
                }
                const msg = message(item.title, item.description, item.more, fileName, locationString)
                const options = {
                  type: 'warning',
                  useSpan: true,
                  errFile: fileName,
                  fileName,
                  isLibrary,
                  errLine: row,
                  errCol: column,
                  item: { warning: item.description },
                  name: item.title,
                  locationString,
                  more: item.more,
                  location: location
                }
                warningErrors.push(options)
                warningMessage.push({ msg, options, hasWarning: true, warningModuleName: 'Slither Analysis' })
              }
              showWarnings(warningMessage, 'warningModuleName')
            }
          } catch(error) {
            props.analysisModule.call('terminal', 'log', { type: 'error', value: '[Slither Analysis]: Error occured! See remixd console for details.' })
            showWarnings(warningMessage, 'warningModuleName')
          }
        } else showWarnings(warningMessage, 'warningModuleName')
      } else {
        if (categoryIndex.length) {
          warningContainer.current.innerText = 'No compiled AST available'
        }
        props.event.trigger('staticAnaysisWarning', [-1])
      }
    }
  }

  const handleCheckAllModules = (groupedModules) => {
    const index = groupedModuleIndex(groupedModules)
    if (index.every(el => categoryIndex.includes(el))) {
      setCategoryIndex(
        categoryIndex.filter((el) => {
          return !index.includes(el)
        })
      )
    } else {
      setCategoryIndex(_.uniq([...categoryIndex, ...index]))
    }
  }

  const handleCheckOrUncheckCategory = (category) => {
    const index = groupedModuleIndex(category)
    if (index.every(el => categoryIndex.includes(el))) {
      setCategoryIndex(
        categoryIndex.filter((el) => {
          return !index.includes(el)
        })
      )
    } else {
      setCategoryIndex(_.uniq([...categoryIndex, ...index]))
    }
  }

  const handleSlitherEnabled = () => {
    if (slitherEnabled) {
      setSlitherEnabled(false)
    } else {
      setSlitherEnabled(true)
    }
  }

  const handleAutoRun = () => {
    if (autoRun) {
      setAutoRun(false)
    } else {
      setAutoRun(true)
    }
  }

  const handleCheckSingle = (event, _index) => {
    _index = _index.toString()
    if (categoryIndex.includes(_index)) {
      setCategoryIndex(categoryIndex.filter(val => val !== _index))
    } else {
      setCategoryIndex(_.uniq([...categoryIndex, _index]))
    }
  }

  const handleShowLibsWarning = () => {
    if (showLibsWarning) {
      showLibsWarning = false
      setShowLibsWarning(false)
    } else {
      showLibsWarning = true
      setShowLibsWarning(true)
    }
    filterWarnings()
  }

  const categoryItem = (categoryId, item, i) => {
    return (
      <div className="form-check" key={i}>
        <RemixUiCheckbox
          categoryId={categoryId}
          id={`staticanalysismodule_${categoryId}_${i}`}
          inputType="checkbox"
          name="checkSingleEntry"
          itemName={item.name}
          label={item.description}
          onClick={event => handleCheckSingle(event, item._index)}
          checked={categoryIndex.includes(item._index.toString())}
          onChange={() => {}}
        />
      </div>
    )
  }

  const categorySection = (category, categoryId, i) => {
    return (
      <div className="" key={i}>
        <div className="block">
          <TreeView>
            <TreeViewItem
              label={
                <label
                  htmlFor={`heading${categoryId}`}
                  style={{ cursor: 'pointer' }}
                  className="pl-3 card-header h6 d-flex justify-content-between font-weight-bold px-1 py-2 w-100"
                  data-bs-toggle="collapse"
                  data-bs-expanded="false"
                  data-bs-controls={`heading${categoryId}`}
                  data-bs-target={`#heading${categoryId}`}
                >
                  {category[0].categoryDisplayName}
                </label>
              }
              expand={false}
            >
              <div>
                <RemixUiCheckbox onClick={() => handleCheckOrUncheckCategory(category)} id={categoryId} inputType="checkbox" label={`Select ${category[0].categoryDisplayName}`} name='checkCategoryEntry' checked={category.map(x => x._index.toString()).every(el => categoryIndex.includes(el))} onChange={() => {}} title={category[0].categoryDisplayName} tooltipPlacement="right"/>
              </div>
              <div className="w-100 d-block px-2 my-1 entries collapse multi-collapse" id={`heading${categoryId}`}>
                {category.map((item, i) => {
                  return (
                    categoryItem(categoryId, item, i)
                  )
                })}
              </div>
            </TreeViewItem>
          </TreeView>
        </div>
      </div>
    )
  }

  useEffect(() => {
    console.log('logging hints from solhint in useEffect')
    props.analysisModule.on('solhint' as any, 'lintOnCompilationFinished',
      (hints: any) => {

        console.log({ hints })
      })
    return () => props.analysisModule.off('solhint' as any, 'lintOnCompilationFinished')
  }, [])

  const handleShowLinterMessages = () => {
    
  }

  const handleHideWarnings = () => {

  }

  const tabKeys = [
    {
      tabKey: 'linter',
      child: <div></div>,
      title: 'Linter'
    },
    {
      tabKey: 'basic',
      title: 'Basic',
      child: <>
      <div id="staticanalysismodules" className="list-group list-group-flush">
      {Object.keys(groupedModules).map((categoryId, i) => {
        const category = groupedModules[categoryId]
        return (
          categorySection(category, categoryId, i)
        )
      })
      }
    </div>
    {Object.entries(warningState).length > 0 &&
        <div id='staticanalysisresult' >
          <div className="mb-4">
            {
              (Object.entries(warningState).map((element, index) => (
                <div key={index}>
                  {element[1]['length'] > 0 ? <span className="text-dark h6">{element[0]}</span> : null}
                  {element[1]['map']((x, i) => ( // eslint-disable-line dot-notation
                    x.hasWarning ? ( // eslint-disable-next-line  dot-notation
                      <div data-id={`staticAnalysisModule${x.warningModuleName}${i}`} id={`staticAnalysisModule${x.warningModuleName}${i}`} key={i}>
                        <ErrorRenderer name={`staticAnalysisModule${x.warningModuleName}${i}`} message={x.msg} opt={x.options} warningErrors={ x.warningErrors} editor={props.analysisModule}/>
                      </div>
                    ) : null
                  ))}
                </div>
              )))
            }
          </div>
        </div>
      }
    </>
    },
    {
      tabKey: 'slither',
      title: 'Slither',
      child: <div></div>,
    }
  ]

  return (
    <div className="analysis_3ECCBV px-3 pb-1">
      <div className="my-2 d-flex flex-column align-items-left">
        <div className="d-flex flex-column mb-3" id="staticanalysisButton">
        <div className="mb-3 d-flex justify-content-between">
          <RemixUiCheckbox
            id="solhintstaticanalysis"
            inputType="checkbox"
            title="Run solhint static analysis on file save"
            onClick={handleShowLinterMessages}
            checked={autoRun}
            label="Linter"
            onChange={() => {}}
            tooltipPlacement={'bottom-start'}
          />
          <RemixUiCheckbox
            id="checkAllEntries"
            inputType="checkbox"
            title="Select all Remix analysis modules"
            checked={Object.values(groupedModules).map((value: any) => {
              return (value.map(x => {
                return x._index.toString()
              }))
            }).flat().every(el => categoryIndex.includes(el))}
            label="Basic"
            onClick={() => handleCheckAllModules(groupedModules)}
            onChange={() => {}}
            tooltipPlacement={'top-start'}
          />
          <RemixUiCheckbox
            id="enableSlither"
            inputType="checkbox"
            onClick={handleSlitherEnabled}
            checked={slitherEnabled}
            label="Slither"
            disabled={showSlither}
            onChange={() => {}}
          />
        </div>
          <Button
              buttonText="Analyse"
              title={runButtonTitle}
              classList="btn btn-sm btn-primary btn-block"
              onClick={async () => await run(state.data, state.source, state.file)}
              disabled={(state.data === null || categoryIndex.length === 0) && !slitherEnabled || !isSupportedVersion }
          />
          <div className="mt-4 p-2 d-flex border-top flex-column">
            <span>Last results for:</span>
            <span
              className="text-break break-word word-break font-weight-bold"
              id="staticAnalysisCurrentFile"
            >
              {state.file}
            </span>
          </div>
          <div className="border-top mt-3 pt-2" id="staticanalysisresult">
            <RemixUiCheckbox
              id="showLibWarnings"
              name="showLibWarnings"
              categoryId="showLibWarnings"
              title="when checked, the results are also displayed for external contract libraries"
              inputType="checkbox"
              checked={showLibsWarning}
              label="Show warnings for external libraries"
              onClick={handleShowLibsWarning}
              onChange={() => {}}
            />
            <RemixUiCheckbox
              id="hideWarnings"
              name="hideWarnings"
              title="when checked, general warnings from analysis are hidden"
              inputType="checkbox"
              checked={hideWarnings}
              label="Hide warnings"
              onClick={handleHideWarnings}
              onChange={() => {}}
            />
          </div>
        </div>
        <Tabs fill defaultActiveKey={tabKeys[0].tabKey}>
          {tabKeys.map(tabKey => (
            <Tab
              key={tabKey.tabKey}
              title={tabKey.title}
              eventKey={tabKey.tabKey}
              tabClassName="text-decoration-none font-weight-bold"
            >
              {tabKey.child}
            </Tab>
            ))}
        </Tabs>
      </div>
    </div>
  )
}

export default RemixUiStaticAnalyser
