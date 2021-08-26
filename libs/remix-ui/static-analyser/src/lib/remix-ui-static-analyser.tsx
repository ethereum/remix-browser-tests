import React, { useEffect, useState, useReducer } from 'react'
import Button from './Button/StaticAnalyserButton' // eslint-disable-line
import remixLib from '@remix-project/remix-lib'
import _ from 'lodash'
import { TreeView, TreeViewItem } from '@remix-ui/tree-view' // eslint-disable-line
import { RemixUiCheckbox } from '@remix-ui/checkbox' // eslint-disable-line
import ErrorRenderer from './ErrorRenderer' // eslint-disable-line
import { compilation } from './actions/staticAnalysisActions'
import { initialState, analysisReducer } from './reducers/staticAnalysisReducer'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'// eslint-disable-line
const StaticAnalysisRunner = require('@remix-project/remix-analyzer').CodeAnalysis
const utils = remixLib.util

/* eslint-disable-next-line */
export interface RemixUiStaticAnalyserProps {
  registry: any,
  event: any,
  analysisModule: any
}

export const RemixUiStaticAnalyser = (props: RemixUiStaticAnalyserProps) => {
  const [runner] = useState(new StaticAnalysisRunner())

  const preProcessModules = (arr: any) => {
    return arr.map((Item, i) => {
      const itemObj = new Item()
      itemObj._index = i
      itemObj.categoryDisplayName = itemObj.category.displayName
      itemObj.categoryId = itemObj.category.id
      return itemObj
    })
  }

  const groupedModules = utils.groupBy(
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
  const [categoryIndex, setCategoryIndex] = useState(groupedModuleIndex(groupedModules))

  const warningContainer = React.useRef(null)
  const [warningState, setWarningState] = useState({})
  const [state, dispatch] = useReducer(analysisReducer, initialState)

  useEffect(() => {
    compilation(props.analysisModule, dispatch)
  }, [props])

  useEffect(() => {
    setWarningState({})
    if (autoRun) {
      if (state.data !== null) {
        run(state.data, state.source, state.file)
      }
    } else {
      props.event.trigger('staticAnaysisWarning', [])
    }
    return () => { }
  }, [state])

  useEffect(() => {
    props.analysisModule.on('filePanel', 'setWorkspace', (currentWorkspace) => {
      // Reset warning state
      setWarningState([])
      // Reset badge
      props.event.trigger('staticAnaysisWarning', [])
      // Reset state
      dispatch({ type: '', payload: {} })
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
        dispatch({ type: '', payload: {} })
        setShowSlither(false)
        setSlitherEnabled(false)
      }
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
    setWarningState(groupedCategory)
  }

  const run = (lastCompilationResult, lastCompilationSource, currentFile) => {
    if (state.data !== null) {
      if (lastCompilationResult && (categoryIndex.length > 0 || slitherEnabled)) {
        let warningCount = 0
        const warningMessage = []
        const warningErrors = []

        // Remix Analysis
        runner.run(lastCompilationResult, categoryIndex, results => {
          results.map((result) => {
            let moduleName
            Object.keys(groupedModules).map(key => {
              groupedModules[key].forEach(el => {
                if (el.name === result.name) {
                  moduleName = groupedModules[key][0].categoryDisplayName
                }
              })
            })
            result.report.map((item) => {
              let location: any = {}
              let locationString = 'not available'
              let column = 0
              let row = 0
              let fileName = currentFile
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
              warningCount++
              const msg = message(item.name, item.warning, item.more, fileName, locationString)
              const options = {
                type: 'warning',
                useSpan: true,
                errFile: fileName,
                fileName,
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
            })
          })
          // Slither Analysis
          if (slitherEnabled) {
            props.analysisModule.call('solidity-logic', 'getCompilerState').then(async (compilerState) => {
              const { currentVersion, optimize, evmVersion } = compilerState
              props.analysisModule.call('terminal', 'log', { type: 'info', value: '[Slither Analysis]: Running...' })
              props.analysisModule.call('slither', 'analyse', state.file, { currentVersion, optimize, evmVersion }).then(async (result) => {
                if (result.status) {
                  props.analysisModule.call('terminal', 'log', { type: 'info', value: `[Slither Analysis]: Analysis Completed!! ${result.count} warnings found.` })
                  const report = result.data
                  for (const item of report) {
                    let location: any = {}
                    let locationString = 'not available'
                    let column = 0
                    let row = 0
                    let fileName = currentFile

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
                    warningCount++
                    const msg = message(item.title, item.description, item.more, fileName, locationString)
                    const options = {
                      type: 'warning',
                      useSpan: true,
                      errFile: fileName,
                      fileName,
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
                  props.event.trigger('staticAnaysisWarning', [warningCount])
                }
              }).catch(() => {
                props.analysisModule.call('terminal', 'log', { type: 'error', value: '[Slither Analysis]: Error occured! See remixd console for details.' })
                showWarnings(warningMessage, 'warningModuleName')
              })
            })
          } else {
            showWarnings(warningMessage, 'warningModuleName')
            props.event.trigger('staticAnaysisWarning', [warningCount])
          }
        })
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
                <RemixUiCheckbox onClick={() => handleCheckOrUncheckCategory(category)} id={categoryId} inputType="checkbox" label={`Select ${category[0].categoryDisplayName}`} name='checkCategoryEntry' checked={category.map(x => x._index.toString()).every(el => categoryIndex.includes(el))} onChange={() => {}}/>
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

  return (
    <div className="analysis_3ECCBV px-3 pb-1">
      <div className="my-2 d-flex flex-column align-items-left">
        <div className="d-flex justify-content-between" id="staticanalysisButton">
          <RemixUiCheckbox
            id="checkAllEntries"
            inputType="checkbox"
            checked={Object.values(groupedModules).map((value: any) => {
              return (value.map(x => {
                return x._index.toString()
              }))
            }).flat().every(el => categoryIndex.includes(el))}
            label="Select all"
            onClick={() => handleCheckAllModules(groupedModules)}
            onChange={() => {}}
          />
          <RemixUiCheckbox
            id="autorunstaticanalysis"
            inputType="checkbox"
            onClick={handleAutoRun}
            checked={autoRun}
            label="Autorun"
            onChange={() => {}}
          />
          <Button buttonText="Run" onClick={() => run(state.data, state.source, state.file)} disabled={(state.data === null || categoryIndex.length === 0) && !slitherEnabled }/>
        </div>
        { showSlither &&
          <div className="d-flex mt-2" id="enableSlitherAnalysis">
            <RemixUiCheckbox
              id="enableSlither"
              inputType="checkbox"
              onClick={handleSlitherEnabled}
              checked={slitherEnabled}
              label="Enable Slither Analysis"
              onChange={() => {}}
            />

            <a className="mt-1 text-nowrap" href='https://remix-ide.readthedocs.io/en/latest/slither.html#enable-slither-analysis' target={'_blank'}>
              <OverlayTrigger placement={'right'} overlay={
                <Tooltip className="text-nowrap" id="overlay-tooltip">
                  <span className="p-1 pr-3" style={{ backgroundColor: 'black', minWidth: '230px' }}>Learn how to use Slither Analysis</span>
                </Tooltip>
              }>
                <i style={{ fontSize: 'medium' }} className={'fal fa-info-circle ml-3'} aria-hidden="true"></i>
              </OverlayTrigger>
            </a>
          </div>
        }
      </div>
      <div id="staticanalysismodules" className="list-group list-group-flush">
        {Object.keys(groupedModules).map((categoryId, i) => {
          const category = groupedModules[categoryId]
          return (
            categorySection(category, categoryId, i)
          )
        })
        }
      </div>
      <div className="mt-2 p-2 d-flex border-top flex-column">
        <span>Last results for:</span>
        <span
          className="text-break break-word word-break font-weight-bold"
          id="staticAnalysisCurrentFile"
        >
          {state.file}
        </span>
      </div>
      <br/>
      {Object.entries(warningState).length > 0 &&
        <div id='staticanalysisresult' >
          <div className="mb-4">
            {
              (Object.entries(warningState).map((element, index) => (
                <div key={index}>
                  <span className="text-dark h6">{element[0]}</span>
                  {element[1]['map']((x, i) => ( // eslint-disable-line dot-notation
                    x.hasWarning ? ( // eslint-disable-next-line  dot-notation
                      <div data-id={`staticAnalysisModule${x.warningModuleName}${i}`} id={`staticAnalysisModule${x.warningModuleName}${i}`} key={i}>
                        <ErrorRenderer message={x.msg} opt={x.options} warningErrors={ x.warningErrors} editor={props.analysisModule}/>
                      </div>

                    ) : null
                  ))}
                </div>
              )))
            }
          </div>
        </div>
      }
    </div>
  )
}

export default RemixUiStaticAnalyser
