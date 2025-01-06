import { fileDecoration, FileDecorationIcons } from '@remix-ui/file-decorators'
import { CustomTooltip } from '@remix-ui/helper'
import { Plugin } from '@remixproject/engine'
import React, { useState, useRef, useEffect, useReducer } from 'react' // eslint-disable-line
import { FormattedMessage } from 'react-intl'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import './remix-ui-tabs.css'
import { values } from 'lodash'
const _paq = (window._paq = window._paq || [])

/* eslint-disable-next-line */
export interface TabsUIProps {
  tabs: Array<Tab>
  plugin: Plugin
  onSelect: (index: number) => void
  onClose: (index: number) => void
  onZoomOut: () => void
  onZoomIn: () => void
  onReady: (api: any) => void
  themeQuality: string
}

export interface Tab {
  id: string
  icon: string
  iconClass: string
  name: string
  title: string
  tooltip: string
}
export interface TabsUIApi {
  activateTab: (name: string) => void
  active: () => string
}
interface ITabsState {
  selectedIndex: number
  fileDecorations: fileDecoration[]
  currentExt: string
}
interface ITabsAction {
  type: string
  payload: any
  ext?: string
}

const initialTabsState: ITabsState = {
  selectedIndex: -1,
  fileDecorations: [],
  currentExt: ''
}

const tabsReducer = (state: ITabsState, action: ITabsAction) => {
  switch (action.type) {
  case 'SELECT_INDEX':
    return {
      ...state,
      currentExt: action.ext,
      selectedIndex: action.payload
    }
  case 'SET_FILE_DECORATIONS':
    return {
      ...state,
      fileDecorations: action.payload as fileDecoration[]
    }
  default:
    return state
  }
}

export const TabsUI = (props: TabsUIProps) => {
  const [tabsState, dispatch] = useReducer(tabsReducer, initialTabsState)
  const currentIndexRef = useRef(-1)
  const [explaining, setExplaining] = useState<boolean>(false)
  const tabsRef = useRef({})
  const tabsElement = useRef(null)
  const [ai_switch, setAI_switch] = useState<boolean>(true)
  const tabs = useRef(props.tabs)
  tabs.current = props.tabs // we do this to pass the tabs list to the onReady callbacks

  useEffect(() => {
    if (props.tabs[tabsState.selectedIndex]) {
      tabsRef.current[tabsState.selectedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, [tabsState.selectedIndex])

  const getAI = async () => {
    try {
      return await props.plugin.call('settings', 'getCopilotSetting')
    } catch (e) {
      return false
    }
  }

  const getFileDecorationClasses = (tab: any) => {
    const fileDecoration = tabsState.fileDecorations.find((fileDecoration: fileDecoration) => {
      if (`${fileDecoration.workspace.name}/${fileDecoration.path}` === tab.name) return true
    })
    return fileDecoration && fileDecoration.fileStateLabelClass
  }

  const getFileDecorationIcons = (tab: any) => {
    return <FileDecorationIcons file={{ path: tab.name }} fileDecorations={tabsState.fileDecorations} />
  }

  const renderTab = (tab: Tab, index) => {
    const classNameImg = 'my-1 mr-1 text-dark ' + tab.iconClass
    const classNameTab = 'nav-item nav-link d-flex justify-content-center align-items-center px-2 py-1 tab' + (index === currentIndexRef.current ? ' active' : '')
    const invert = props.themeQuality === 'dark' ? 'invert(1)' : 'invert(0)'
    return (
      <CustomTooltip tooltipId="tabsActive" tooltipText={tab.tooltip} placement="bottom-start">
        <div
          ref={(el) => {
            tabsRef.current[index] = el
          }}
          className={classNameTab}
          data-id={index === currentIndexRef.current ? 'tab-active' : ''}
          data-path={tab.name}
        >
          {tab.icon ? <img className="my-1 mr-1 iconImage" style={{ filter: invert }} src={tab.icon} /> : <i className={classNameImg}></i>}
          <span className={`title-tabs ${getFileDecorationClasses(tab)}`}>{tab.title}</span>
          {getFileDecorationIcons(tab)}
          <span
            className="close-tabs"
            data-id={`close_${tab.name}`}
            onClick={(event) => {
              props.onClose(index)
              event.stopPropagation()
            }}
          >
            <i className="text-dark fas fa-times"></i>
          </span>
        </div>
      </CustomTooltip>
    )
  }

  const active = () => {
    if (currentIndexRef.current < 0) return ''
    return tabs.current[currentIndexRef.current].name
  }

  const activateTab = (name: string) => {
    const index = tabs.current.findIndex((tab) => tab.name === name)
    currentIndexRef.current = index
    dispatch({ type: 'SELECT_INDEX', payload: index, ext: getExt(name) })
  }

  const setFileDecorations = (fileStates: fileDecoration[]) => {
    getAI().then(value => setAI_switch(value)).catch(error => console.log(error))
    dispatch({ type: 'SET_FILE_DECORATIONS', payload: fileStates })
  }

  const transformScroll = (event) => {
    if (!event.deltaY) {
      return
    }

    event.currentTarget.scrollLeft += event.deltaY + event.deltaX
    event.preventDefault()
  }

  useEffect(() => {
    props.onReady({
      activateTab,
      active,
      setFileDecorations
    })

    return () => {
      tabsElement.current.removeEventListener('wheel', transformScroll)
    }
  }, [])

  const getExt = (path) => {
    const root = path.split('#')[0].split('?')[0]
    const ext = root.indexOf('.') !== -1 ? /[^.]+$/.exec(root) : null
    if (ext) return ext[0].toLowerCase()
    else return ''
  }

  return (
    <div className="remix-ui-tabs d-flex justify-content-between border-0 header nav-tabs" data-id="tabs-component">
      <div className="d-flex flex-row" style={{ maxWidth: 'fit-content', width: '99%' }}>
        <div className="d-flex flex-row justify-content-center align-items-center m-1 mt-1">
          <CustomTooltip
            placement="bottom"
            tooltipId="overlay-tooltip-run-script"
            tooltipText={
              <span>
                {tabsState.currentExt === 'js' || tabsState.currentExt === 'ts' ? (
                  <FormattedMessage id="remixUiTabs.tooltipText1" />
                ) : tabsState.currentExt === 'sol' || tabsState.currentExt === 'yul' || tabsState.currentExt === 'circom' || tabsState.currentExt === 'vy' ? (
                  <FormattedMessage id="remixUiTabs.tooltipText2" />
                ) : (
                  <FormattedMessage id="remixUiTabs.tooltipText3" />
                )}
              </span>
            }
          >
            <button
              data-id="play-editor"
              className="btn text-success pr-0 py-0 d-flex"
              disabled={!(tabsState.currentExt === 'js' || tabsState.currentExt === 'ts' || tabsState.currentExt === 'sol' || tabsState.currentExt === 'circom' || tabsState.currentExt === 'vy')}
              onClick={async () => {
                const path = active().substr(active().indexOf('/') + 1, active().length)
                const content = await props.plugin.call('fileManager', 'readFile', path)
                if (tabsState.currentExt === 'js' || tabsState.currentExt === 'ts') {
                  await props.plugin.call('scriptRunnerBridge', 'execute', content, path)
                  _paq.push(['trackEvent', 'editor', 'clickRunFromEditor', tabsState.currentExt])
                } else if (tabsState.currentExt === 'sol' || tabsState.currentExt === 'yul') {
                  await props.plugin.call('solidity', 'compile', path)
                  _paq.push(['trackEvent', 'editor', 'clickRunFromEditor', tabsState.currentExt])
                } else if (tabsState.currentExt === 'circom') {
                  await props.plugin.call('circuit-compiler', 'compile', path)
                  _paq.push(['trackEvent', 'editor', 'clickRunFromEditor', tabsState.currentExt])
                } else if (tabsState.currentExt === 'vy') {
                  await props.plugin.call('vyper', 'vyperCompileCustomAction')
                  _paq.push(['trackEvent', 'editor', 'clickRunFromEditor', tabsState.currentExt])
                }
              }}
            >
              <i className="fas fa-play"></i>
            </button>
          </CustomTooltip>
          {(tabsState.currentExt === 'ts' || tabsState.currentExt === 'js')

            && <CustomTooltip
              placement="bottom"
              tooltipId="overlay-tooltip-run-script-config"
              tooltipText={
                <span>
                  <FormattedMessage id="remixUiTabs.tooltipText9" />
                </span>
              }><button
                data-id="script-config"
                className="btn text-dark border-left ml-2 pr-0 py-0 d-flex"
                onClick={async () => {
                  props.plugin.call('menuicons', 'select', 'scriptRunnerBridge')
                }}
              >
                <i className="fa-kit fa-solid-gear-circle-play"></i>
              </button></CustomTooltip>
          }
          <div className="d-flex border-left ml-2 align-items-center" style={{ height: "3em" }}>
            <CustomTooltip
              placement="bottom"
              tooltipId="overlay-tooltip-explanation"
              tooltipText={
                <span>
                  {((tabsState.currentExt === 'sol') || (tabsState.currentExt === 'vy') || (tabsState.currentExt === 'circom')) ? (
                    <FormattedMessage id="remixUiTabs.tooltipText5" />
                  ) : (
                    <FormattedMessage id="remixUiTabs.tooltipText4" />
                  )}
                </span>
              }
            >
              <button
                data-id="explain-editor"
                id='explain_btn'
                className='btn text-ai pl-2 pr-0 py-0'
                disabled={!((tabsState.currentExt === 'sol') || (tabsState.currentExt === 'vy') || (tabsState.currentExt === 'circom')) || explaining}
                onClick={async () => {
                  const path = active().substr(active().indexOf('/') + 1, active().length)
                  const content = await props.plugin.call('fileManager', 'readFile', path)
                  if ((tabsState.currentExt === 'sol') || (tabsState.currentExt === 'vy') || (tabsState.currentExt === 'circom')) {
                    setExplaining(true)
                    // if plugin is pinned,
                    await props.plugin.call('popupPanel', 'showPopupPanel', true)
                    setTimeout(async () => {
                      await props.plugin.call('remixAI', 'chatPipe', 'code_explaining', content)
                    }, 500)
                    setExplaining(false)
                    _paq.push(['trackEvent', 'ai', 'remixAI', 'explain_file'])
                  }
                }}
              >
                <i className={`fas fa-user-robot ${explaining ? 'loadingExplanation' : ''}`}></i>
              </button>
            </CustomTooltip>
            <CustomTooltip
              placement="bottom"
              tooltipId="overlay-tooltip-copilot"
              tooltipText={
                <span>
                  {tabsState.currentExt === 'sol' ? (
                    !ai_switch ? (
                      <FormattedMessage id="remixUiTabs.tooltipText6" />
                    ) : (<FormattedMessage id="remixUiTabs.tooltipText7" />)
                  ) : (
                    <FormattedMessage id="remixUiTabs.tooltipTextDisabledCopilot" />
                  )}
                </span>
              }
            >
              <button
                data-id="remix_ai_switch"
                id='remix_ai_switch'
                className="btn ai-switch text-ai pl-2 pr-0 py-0"
                disabled={!(tabsState.currentExt === 'sol')}
                onClick={async () => {
                  await props.plugin.call('settings', 'updateCopilotChoice', !ai_switch)
                  setAI_switch(!ai_switch)
                  ai_switch ? _paq.push(['trackEvent', 'ai', 'remixAI', 'copilot_enabled']) : _paq.push(['trackEvent', 'ai', 'remixAI', 'copilot_disabled'])
                }}
              >
                <i className={ai_switch ? "fas fa-toggle-on fa-lg" : "fas fa-toggle-off fa-lg"}></i>
              </button>
            </CustomTooltip>
          </div>

          <div className="d-flex border-left ml-2 align-items-center" style={{ height: "3em" }}>
            <CustomTooltip placement="bottom" tooltipId="overlay-tooltip-zoom-out" tooltipText={<FormattedMessage id="remixUiTabs.zoomOut" />}>
              <span data-id="tabProxyZoomOut" className="btn fas fa-search-minus text-dark pl-2 pr-0 py-0 d-flex" onClick={() => props.onZoomOut()}></span>
            </CustomTooltip>
            <CustomTooltip placement="bottom" tooltipId="overlay-tooltip-run-zoom-in" tooltipText={<FormattedMessage id="remixUiTabs.zoomIn" />}>
              <span data-id="tabProxyZoomIn" className="btn fas fa-search-plus text-dark pl-2 pr-0 py-0 d-flex" onClick={() => props.onZoomIn()}></span>
            </CustomTooltip>
          </div>
        </div>
        <Tabs
          className="tab-scroll"
          selectedIndex={tabsState.selectedIndex}
          domRef={(domEl) => {
            if (tabsElement.current) return
            tabsElement.current = domEl
            tabsElement.current.addEventListener('wheel', transformScroll)
          }}
          onSelect={(index) => {
            props.onSelect(index)
            currentIndexRef.current = index
            dispatch({
              type: 'SELECT_INDEX',
              payload: index,
              ext: getExt(props.tabs[currentIndexRef.current].name)
            })
          }}
        >
          <TabList className="d-flex flex-row align-items-center">
            {props.tabs.map((tab, i) => (
              <Tab className="" key={tab.name} data-id={tab.id}>
                {renderTab(tab, i)}
              </Tab>
            ))}
            <div style={{ minWidth: '4rem', height: '1rem' }} id="dummyElForLastXVisibility"></div>
          </TabList>
          {props.tabs.map((tab) => (
            <TabPanel key={tab.name}></TabPanel>
          ))}
        </Tabs>
      </div>
    </div>
  )
}

export default TabsUI
