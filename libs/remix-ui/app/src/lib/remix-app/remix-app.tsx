import React, { useEffect, useReducer, useRef, useState } from 'react'
import './style/remix-app.css'
import { RemixUIMainPanel } from '@remix-ui/panel'
import MatomoDialog from './components/modals/matomo'
import EnterDialog from './components/modals/enter'
import OriginWarning from './components/modals/origin-warning'
import DragBar from './components/dragbar/dragbar'
import { AppProvider } from './context/provider'
import AppDialogs from './components/modals/dialogs'
import DialogViewPlugin from './components/modals/dialogViewPlugin'
import { appProviderContextType, onLineContext, platformContext } from './context/context'
import { IntlProvider } from 'react-intl'
import { UsageTypes } from './types'
import { appReducer } from './reducer/app'
import { appInitialState } from './state/app'
import isElectron from 'is-electron'

declare global {
  interface Window {
    _paq: any
  }
}
const _paq = (window._paq = window._paq || [])

interface IRemixAppUi {
  app: any
}
const RemixApp = (props: IRemixAppUi) => {
  const [appReady, setAppReady] = useState<boolean>(false)
  const [showEnterDialog, setShowEnterDialog] = useState<boolean>(false)
  const [hideSidePanel, setHideSidePanel] = useState<boolean>(false)
  const [hidePinnedPanel, setHidePinnedPanel] = useState<boolean>(true)
  const [maximiseLeftTrigger, setMaximiseLeftTrigger] = useState<number>(0)
  const [enhanceLeftTrigger, setEnhanceLeftTrigger] = useState<number>(0)
  const [resetLeftTrigger, setResetLeftTrigger] = useState<number>(0)
  const [maximiseRightTrigger, setMaximiseRightTrigger] = useState<number>(0)
  const [enhanceRightTrigger, setEnhanceRightTrigger] = useState<number>(0)
  const [resetRightTrigger, setResetRightTrigger] = useState<number>(0)
  const [online, setOnline] = useState<boolean>(true)
  const [locale, setLocale] = useState<{ code: string; messages: any }>({
    code: 'en',
    messages: {}
  })
  const sidePanelRef = useRef(null)
  const pinnedPanelRef = useRef(null)

  const [appState, appStateDispatch] = useReducer(appReducer, {
    ...appInitialState,
    showPopupPanel: !window.localStorage.getItem('did_show_popup_panel') && !isElectron()
  })

  useEffect(() => {
    async function activateApp() {
      props.app.themeModule.initTheme(() => {
        setAppReady(true)
        props.app.activate()
        setListeners()
      })
      setLocale(props.app.localeModule.currentLocale())
    }
    if (props.app) {
      activateApp()
    }
    let hadUsageTypeAsked = localStorage.getItem('hadUsageTypeAsked')

    if (props.app.showMatomo) {
      // if matomo dialog is displayed, it will take care of calling "setShowEnterDialog",
      // if the user approves matomo tracking.
      // so "showEnterDialog" stays false
    } else {
      // if matomo dialog isn't displayed, we show the "enter dialog" only if:
      //  - it wasn't already set
      //  - (and) if user has given consent
      if (!hadUsageTypeAsked && props.app.matomoCurrentSetting) {
        setShowEnterDialog(true)
      }
    }
    if (hadUsageTypeAsked) {
      // rewriting the data in user's local storage for consistency
      switch (hadUsageTypeAsked) {
      case '1': {
        hadUsageTypeAsked ='beginner'
        break
      }
      case '2': {
        hadUsageTypeAsked ='prototyper'
        break
      }
      case '3': {
        hadUsageTypeAsked = 'advanced'
        break
      }
      case '4': {
        hadUsageTypeAsked = 'production'
        break
      }
      default: {
        // choosing beginner as default
        hadUsageTypeAsked = 'beginner'
        break
      }
      }
      localStorage.setItem('hadUsageTypeAsked', hadUsageTypeAsked)
      _paq.push(['trackEvent', 'userEntry', 'usageType', hadUsageTypeAsked])
    }
  }, [])

  useEffect(() => {
    if (!appState.showPopupPanel) {
      window.localStorage.setItem('did_show_popup_panel', 'true')
    }
  },[appState.showPopupPanel])

  function setListeners() {
    props.app.sidePanel.events.on('toggle', () => {
      setHideSidePanel((prev) => {
        return !prev
      })
    })
    props.app.sidePanel.events.on('showing', () => {
      setHideSidePanel(false)
    })

    props.app.layout.event.on('minimizesidepanel', () => {
      // the 'showing' event always fires from sidepanel, so delay this a bit
      setTimeout(() => {
        setHideSidePanel(true)
      }, 1000)
    })

    props.app.layout.event.on('maximisesidepanel', () => {
      setMaximiseLeftTrigger((prev) => {
        return prev + 1
      })
    })

    props.app.layout.event.on('enhancesidepanel', () => {
      setEnhanceLeftTrigger((prev) => {
        return prev + 1
      })
    })

    props.app.layout.event.on('resetsidepanel', () => {
      setResetLeftTrigger((prev) => {
        return prev + 1
      })
    })

    props.app.layout.event.on('maximisepinnedpanel', () => {
      setMaximiseRightTrigger((prev) => {
        return prev + 1
      })
    })

    props.app.layout.event.on('enhancepinnedpanel', () => {
      setEnhanceRightTrigger((prev) => {
        return prev + 1
      })
    })

    props.app.layout.event.on('resetpinnedpanel', () => {
      setResetRightTrigger((prev) => {
        return prev + 1
      })
    })

    props.app.localeModule.events.on('localeChanged', (nextLocale) => {
      setLocale(nextLocale)
    })

    props.app.pinnedPanel.events.on('pinnedPlugin', () => {
      setHidePinnedPanel(false)
    })

    props.app.pinnedPanel.events.on('unPinnedPlugin', () => {
      setHidePinnedPanel(true)
    })

    setInterval(() => {
      setOnline(window.navigator.onLine)
    }, 1000)
  }

  const value: appProviderContextType = {
    settings: props.app.settings,
    showMatomo: props.app.showMatomo,
    appManager: props.app.appManager,
    showEnter: props.app.showEnter,
    modal: props.app.notification,
    appState: appState,
    appStateDispatch: appStateDispatch
  }

  const handleUserChosenType = async (type) => {
    setShowEnterDialog(false)
    localStorage.setItem('hadUsageTypeAsked', type)
    // Use the type to setup the UI accordingly
    switch (type) {
    case UsageTypes.Beginner: {
      await props.app.appManager.call('manager', 'activatePlugin', 'LearnEth')
      await props.app.appManager.call('walkthrough', 'start')
      // const wName = 'Playground'
      // const workspaces = await props.app.appManager.call('filePanel', 'getWorkspaces')
      // if (!workspaces.find((workspace) => workspace.name === wName)) {
      //   await props.app.appManager.call('filePanel', 'createWorkspace', wName, 'playground')
      // }
      // await props.app.appManager.call('filePanel', 'switchToWorkspace', { name: wName, isLocalHost: false })
      break
    }
    case UsageTypes.Advance: {
      // Here activate necessary plugins, walkthrough. Filter hometab features slides and plugins.
      break
    }
    case UsageTypes.Prototyper: {
      // Here activate necessary plugins, walkthrough. Filter hometab features slides and plugins.
      break
    }
    case UsageTypes.Production: {
      // Here activate necessary plugins, walkthrough. Filter hometab features slides and plugins.
      break
    }
    default: throw new Error()
    }
    // enterDialog tracks first time users
    // userEntry tracks both first time and returning users
    _paq.push(['trackEvent', 'enterDialog', 'usageType', type])
    _paq.push(['trackEvent', 'userEntry', 'usageType', type])
  }

  return (
    //@ts-ignore
    <IntlProvider locale={locale.code} messages={locale.messages}>
      <platformContext.Provider value={props.app.platform}>
        <onLineContext.Provider value={online}>
          <AppProvider value={value}>
            <OriginWarning></OriginWarning>
            <MatomoDialog hide={!appReady} okFn={() => setShowEnterDialog(true)}></MatomoDialog>
            {showEnterDialog && <EnterDialog handleUserChoice={(type) => handleUserChosenType(type)}></EnterDialog>}
            <div className='d-flex flex-column'>
              <div className={`remixIDE ${appReady ? '' : 'd-none'}`} data-id="remixIDE">
                <div id="icon-panel" data-id="remixIdeIconPanel" className="custom_icon_panel iconpanel bg-light">
                  {props.app.menuicons.render()}
                </div>
                <div
                  ref={sidePanelRef}
                  id="side-panel"
                  data-id="remixIdeSidePanel"
                  className={`sidepanel border-right border-left ${hideSidePanel ? 'd-none' : ''}`}
                >
                  {props.app.sidePanel.render()}
                </div>
                <DragBar
                  enhanceTrigger={enhanceLeftTrigger}
                  resetTrigger={resetLeftTrigger}
                  maximiseTrigger={maximiseLeftTrigger}
                  minWidth={305}
                  refObject={sidePanelRef}
                  hidden={hideSidePanel}
                  setHideStatus={setHideSidePanel}
                  layoutPosition='left'
                ></DragBar>
                <div id="main-panel" data-id="remixIdeMainPanel" className="mainpanel d-flex">
                  <RemixUIMainPanel layout={props.app.layout}></RemixUIMainPanel>
                </div>
                <div id="pinned-panel" ref={pinnedPanelRef} data-id="remixIdePinnedPanel" className={`flex-row-reverse pinnedpanel border-right border-left ${hidePinnedPanel ? 'd-none' : 'd-flex'}`}>
                  {props.app.pinnedPanel.render()}
                </div>
                {
                  !hidePinnedPanel &&
                  <DragBar
                    enhanceTrigger={enhanceRightTrigger}
                    resetTrigger={resetRightTrigger}
                    maximiseTrigger={maximiseRightTrigger}
                    minWidth={331}
                    refObject={pinnedPanelRef}
                    hidden={hidePinnedPanel}
                    setHideStatus={setHidePinnedPanel}
                    layoutPosition='right'
                  ></DragBar>
                }
                <div>{props.app.hiddenPanel.render()}</div>
              </div>
              <div>{props.app.popupPanel.render()}</div>
              <div className="statusBar fixed-bottom">
                {props.app.statusBar.render()}
              </div>
            </div>
            <AppDialogs></AppDialogs>
            <DialogViewPlugin></DialogViewPlugin>
          </AppProvider>
        </onLineContext.Provider>
      </platformContext.Provider>
    </IntlProvider>
  )
}

export default RemixApp
