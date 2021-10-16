/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  Fragment,
  useEffect,
  useReducer,
  useRef,
  useState
} from 'react'

import './remix-ui-vertical-icons-panel.css'
import OtherIcons from './components/OtherIcons'
import { VerticalIcons } from '../../types/vertical-icons-panel'
import Home from './components/Home'
import Icon from './components/Icon'
import Settings from './components/Settings'
export interface RemixUiVerticalIconsPanelProps {
  verticalIconsPlugin: VerticalIcons
}

let scrollHeight: any

export function RemixUiVerticalIconsPanel ({
  verticalIconsPlugin
}: RemixUiVerticalIconsPanelProps) {
  const scrollableRef = useRef<any>()
  const iconPanelRef = useRef<any>()
  // const [first] = useState(localStorage.getItem('firstTime'))

  function onThemeChanged (themeType: any) {
    const invert = themeType === 'dark' ? 1 : 0
    // @ts-ignore
    const active = iconPanelRef.current.querySelector('.active')
    if (active) {
      // @ts-ignore
      const image = iconPanelRef.current.querySelector('.remixui_image')
      image.style.setProperty('filter', `invert(${invert})`)
    }
  }

  function removeActive () {
    // @ts-ignore
    const images = iconPanelRef.current.querySelectorAll('.remixui_image')
    images.forEach(function (im: any) {
      im.style.setProperty('filter', 'invert(0.5)')
    })

    // remove active
    // @ts-ignore
    const currentActive = iconPanelRef.current.querySelector('.active')
    if (currentActive) {
      currentActive.classList.remove('active')
    }
  }

  function addActive (name: string) {
    if (name === 'home') return
    const themeType = verticalIconsPlugin.registry.get('themeModule').api.currentTheme().quality
    const invert = themeType === 'dark' ? 1 : 0
    const brightness = themeType === 'dark' ? '150' : '0' // should be >100 for icons with color
    // @ts-ignore
    const nextActive = iconPanelRef.current.querySelector(`[plugin="${name}"]`)
    if (nextActive) {
      const image = nextActive.querySelector('.remixui_image')
      nextActive.classList.add('active')
      image.style.setProperty('filter', `invert(${invert}) grayscale(1) brightness(${brightness}%)`)
    }
  }

  async function itemContextAction (e: any, name: string, documentation: string) {
    verticalIconsPlugin.appManager.deactivatePlugin(name)
    if (e.target.parentElement.classList.contains('active')) {
      verticalIconsPlugin.select('filePanel')
    }
    verticalIconsPlugin.renderComponent()
  }

  useEffect(() => {
    const themeModule = verticalIconsPlugin.registry.get('themeModule').api
    themeModule.events.on('themeChanged', (theme: any) => {
      onThemeChanged(theme.quality)
    })
  }, [])

  useEffect(() => {
    const themeModule = verticalIconsPlugin.registry.get('themeModule').api
    themeModule.events.on('themeChanged', (theme: any) => {
      onThemeChanged(theme.quality)
    })
  }, [])

  useEffect(() => {
    const found = iconPanelRef.current!.querySelector('#verticalIconsKindudapp')
    if (verticalIconsPlugin.targetProfileForChange && verticalIconsPlugin.targetProfileForChange.udapp) {
      const doWalkThroughEvent = new Event('doWalkThrough')
      document.dispatchEvent(doWalkThroughEvent)
    }
  }, [Object.keys(verticalIconsPlugin.targetProfileForChange).length])

  return (
    <div id="iconsP" className="h-100">
      <div className="remixui_icons" ref={iconPanelRef}>
        <div className="remixui_default-icons-container">
          <Home verticalIconPlugin={verticalIconsPlugin} />
          {verticalIconsPlugin.targetProfileForChange &&
          Object.keys(verticalIconsPlugin.targetProfileForChange).length
            ? Object.keys(verticalIconsPlugin.targetProfileForChange)
              .filter(p => p !== 'settings')
              .filter(p => p !== 'pluginManager')
              .filter(p => p === 'filePanel')
              .map(p => (
                <div id="fileExplorerIcons" key={
                  verticalIconsPlugin.targetProfileForChange[p].displayName
                } data-id="verticalIconsFileExplorerIcons">
                  <Icon
                    kind={verticalIconsPlugin.targetProfileForChange[p].kind}
                    displayName={
                      verticalIconsPlugin.targetProfileForChange[p].displayName
                    }
                    documentation={
                      verticalIconsPlugin.targetProfileForChange[p]
                        .documentation
                    }
                    icon={verticalIconsPlugin.targetProfileForChange[p].icon}
                    name={verticalIconsPlugin.targetProfileForChange[p].name}
                    tooltip={
                      verticalIconsPlugin.targetProfileForChange[p].tooltip
                    }
                    verticalIconPlugin={verticalIconsPlugin}
                    contextMenuAction={itemContextAction}
                    addActive={addActive}
                    removeActive={removeActive}
                  />
                </div>
              ))
            : null}
          {verticalIconsPlugin.targetProfileForChange &&
          Object.keys(verticalIconsPlugin.targetProfileForChange).length
            ? Object.keys(verticalIconsPlugin.targetProfileForChange)
              .filter(p => p !== 'settings')
              .filter(p => p !== 'pluginManager')
              .filter(p => p === 'solidity')
              .map(p => (
                <div id="compileIcons" key={
                  verticalIconsPlugin.targetProfileForChange[p].displayName
                }>
                  <Icon
                    kind={verticalIconsPlugin.targetProfileForChange[p].kind}
                    displayName={
                      verticalIconsPlugin.targetProfileForChange[p].displayName
                    }
                    documentation={
                      verticalIconsPlugin.targetProfileForChange[p]
                        .documentation
                    }
                    icon={verticalIconsPlugin.targetProfileForChange[p].icon}
                    name={verticalIconsPlugin.targetProfileForChange[p].name}
                    tooltip={
                      verticalIconsPlugin.targetProfileForChange[p].tooltip
                    }
                    verticalIconPlugin={verticalIconsPlugin}
                    contextMenuAction={itemContextAction}
                    addActive={addActive}
                    removeActive={removeActive}
                    key={
                      verticalIconsPlugin.targetProfileForChange[p].displayName
                    }
                  />
                </div>
              ))
            : null}
          {verticalIconsPlugin.targetProfileForChange &&
          Object.keys(verticalIconsPlugin.targetProfileForChange).length
            ? Object.keys(verticalIconsPlugin.targetProfileForChange)
              .filter(p => p !== 'settings')
              .filter(p => p !== 'pluginManager')
              .filter(p => p === 'udapp')
              .map(p => (
                <div id="runIcons" data-id="verticalIconsKindUdapp" key={
                  verticalIconsPlugin.targetProfileForChange[p].displayName
                }
                >
                  <Icon
                    kind={verticalIconsPlugin.targetProfileForChange[p].kind}
                    displayName={
                      verticalIconsPlugin.targetProfileForChange[p].displayName
                    }
                    documentation={
                      verticalIconsPlugin.targetProfileForChange[p]
                        .documentation
                    }
                    icon={verticalIconsPlugin.targetProfileForChange[p].icon}
                    name={verticalIconsPlugin.targetProfileForChange[p].name}
                    tooltip={
                      verticalIconsPlugin.targetProfileForChange[p].tooltip
                    }
                    verticalIconPlugin={verticalIconsPlugin}
                    contextMenuAction={itemContextAction}
                    addActive={addActive}
                    removeActive={removeActive}
                    key={
                      verticalIconsPlugin.targetProfileForChange[p].displayName
                    }
                  />
                </div>
              ))
            : null}
          {verticalIconsPlugin.targetProfileForChange &&
          Object.keys(verticalIconsPlugin.targetProfileForChange).length
            ? Object.keys(verticalIconsPlugin.targetProfileForChange)
              .filter(p => p !== 'settings')
              .filter(p => p !== 'pluginManager')
              .filter(p => p === 'solidityStaticAnalysis')
              .map(p => (
                <div id="analysisIcons" key={
                  verticalIconsPlugin.targetProfileForChange[p].displayName
                }>
                  <Icon
                    kind={verticalIconsPlugin.targetProfileForChange[p].kind}
                    displayName={
                      verticalIconsPlugin.targetProfileForChange[p].displayName
                    }
                    documentation={
                      verticalIconsPlugin.targetProfileForChange[p]
                        .documentation
                    }
                    icon={verticalIconsPlugin.targetProfileForChange[p].icon}
                    name={verticalIconsPlugin.targetProfileForChange[p].name}
                    tooltip={
                      verticalIconsPlugin.targetProfileForChange[p].tooltip
                    }
                    verticalIconPlugin={verticalIconsPlugin}
                    contextMenuAction={itemContextAction}
                    addActive={addActive}
                    removeActive={removeActive}
                    key={
                      verticalIconsPlugin.targetProfileForChange[p].displayName
                    }
                  />
                </div>
              ))
            : null}
          {verticalIconsPlugin.targetProfileForChange &&
          Object.keys(verticalIconsPlugin.targetProfileForChange).length
            ? Object.keys(verticalIconsPlugin.targetProfileForChange)
              .filter(p => p !== 'settings')
              .filter(p => p !== 'pluginManager')
              .filter(p => p === 'debugger')
              .map(p => (
                <div id="debuggingIcons" data-id="verticalIconsDebuggingIcons" key={
                  verticalIconsPlugin.targetProfileForChange[p].displayName
                }>
                  <Icon
                    kind={verticalIconsPlugin.targetProfileForChange[p].kind}
                    displayName={
                      verticalIconsPlugin.targetProfileForChange[p].displayName
                    }
                    documentation={
                      verticalIconsPlugin.targetProfileForChange[p]
                        .documentation
                    }
                    icon={verticalIconsPlugin.targetProfileForChange[p].icon}
                    name={verticalIconsPlugin.targetProfileForChange[p].name}
                    tooltip={
                      verticalIconsPlugin.targetProfileForChange[p].tooltip
                    }
                    verticalIconPlugin={verticalIconsPlugin}
                    contextMenuAction={itemContextAction}
                    addActive={addActive}
                    removeActive={removeActive}
                    key={
                      verticalIconsPlugin.targetProfileForChange[p].displayName
                    }
                  />
                </div>
              ))
            : null}
          {Object.keys(verticalIconsPlugin.targetProfileForChange)
            .filter(p => p === 'pluginManager')
            .map(p => (
              <Icon
                kind={
                  verticalIconsPlugin.targetProfileForChange[p].kind
                }
                displayName={
                  verticalIconsPlugin.targetProfileForChange[p]
                    .displayName
                }
                documentation={
                  verticalIconsPlugin.targetProfileForChange[p]
                    .documentation
                }
                icon={
                  verticalIconsPlugin.targetProfileForChange[p].icon
                }
                name={
                  verticalIconsPlugin.targetProfileForChange[p].name
                }
                tooltip={
                  verticalIconsPlugin.targetProfileForChange[p].tooltip
                }
                verticalIconPlugin={verticalIconsPlugin}
                contextMenuAction={itemContextAction}
                addActive={addActive}
                removeActive={removeActive}
                key={
                  verticalIconsPlugin.targetProfileForChange[p]
                    .displayName
                }
              />
            ))}
          {scrollableRef.current && scrollableRef.current!.scrollHeight > scrollableRef.current!.clientHeight
            ? <i className="fa fa-chevron-up remixui_icon-chevron mt-0 mb-0 ml-1 pl-3"></i>
            : null
          }
        </div>
        <div
          id="remixuiScrollable"
          className={scrollableRef.current && scrollableRef.current.scrollHeight > scrollableRef.current.clientHeight
            ? 'remixui_default-icons-container remixui_scrollable-container remixui_scrollbar remixui_hide-scroll'
            : 'remixui_scrollable-container remixui_scrollbar remixui_hide-scroll'}
          ref={scrollableRef}
        >
          <OtherIcons>
            {Object.keys(verticalIconsPlugin.targetProfileForChange)
              .filter(p => p !== 'settings')
              .filter(p => p !== 'pluginManager')
              .filter(p => p !== 'filePanel')
              .filter(p => p !== 'debugger')
              .filter(p => p !== 'compiler')
              .filter(p => p !== 'solidity')
              .filter(p => p !== 'udapp')
              .filter(p => p !== 'testing')
              .filter(p => p !== 'solidityStaticAnalysis')
              .map(p => (
                <Icon
                  kind={verticalIconsPlugin.targetProfileForChange[p].kind}
                  displayName={
                    verticalIconsPlugin.targetProfileForChange[p].displayName
                  }
                  documentation={
                    verticalIconsPlugin.targetProfileForChange[p].documentation
                  }
                  icon={verticalIconsPlugin.targetProfileForChange[p].icon}
                  name={verticalIconsPlugin.targetProfileForChange[p].name}
                  tooltip={
                    verticalIconsPlugin.targetProfileForChange[p].tooltip
                  }
                  verticalIconPlugin={verticalIconsPlugin}
                  contextMenuAction={itemContextAction}
                  addActive={addActive}
                  removeActive={removeActive}
                  key={
                    verticalIconsPlugin.targetProfileForChange[p].displayName
                  }
                />
              ))}
          </OtherIcons>
        </div>
        {verticalIconsPlugin.targetProfileForChange &&
          Object.keys(verticalIconsPlugin.targetProfileForChange).length ? (
            <Fragment>
              <Settings>
                {scrollableRef.current && scrollableRef.current!.scrollHeight > scrollableRef.current!.clientHeight
                  ? <i className="fa fa-chevron-down remixui_icon-chevron mt-0 mb-0 ml-1 pl-3"></i>
                  : null
                }
                {Object.keys(verticalIconsPlugin.targetProfileForChange)
                  .filter(p => p === 'settings')
                  .map(p => (
                    <Icon
                      kind={
                        verticalIconsPlugin.targetProfileForChange[p].kind
                      }
                      displayName={
                        verticalIconsPlugin.targetProfileForChange[p]
                          .displayName
                      }
                      documentation={
                        verticalIconsPlugin.targetProfileForChange[p]
                          .documentation
                      }
                      icon={
                        verticalIconsPlugin.targetProfileForChange[p].icon
                      }
                      name={
                        verticalIconsPlugin.targetProfileForChange[p].name
                      }
                      tooltip={
                        verticalIconsPlugin.targetProfileForChange[p].tooltip
                      }
                      verticalIconPlugin={verticalIconsPlugin}
                      contextMenuAction={itemContextAction}
                      addActive={addActive}
                      removeActive={removeActive}
                      key={
                        verticalIconsPlugin.targetProfileForChange[p]
                          .displayName
                      }
                    />
                  ))}
              </Settings>
            </Fragment>
          ) : null}
      </div>
    </div>
  )
}
