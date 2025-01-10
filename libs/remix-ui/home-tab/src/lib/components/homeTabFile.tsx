/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useReducer, useEffect } from 'react'
import { FormattedMessage } from 'react-intl'
import {Toaster} from '@remix-ui/toaster' // eslint-disable-line
const _paq = (window._paq = window._paq || []) // eslint-disable-line
import { CustomTooltip } from '@remix-ui/helper'

interface HomeTabFileProps {
  plugin: any
}

function HomeTabFile({ plugin }: HomeTabFileProps) {
  const [state, setState] = useState<{
    searchInput: string
    showModalDialog: boolean
    modalInfo: {
      title: string
      loadItem: string
      examples: Array<string>
      prefix?: string
    }
    importSource: string
    toasterMsg: string
    recentWorkspaces: Array<string>
  }>({
    searchInput: '',
    showModalDialog: false,
    modalInfo: { title: '', loadItem: '', examples: [], prefix: '' },
    importSource: '',
    toasterMsg: '',
    recentWorkspaces: [],
  })

  useEffect(() => {
    plugin.on('filePanel', 'setWorkspace', async () => {
      let recents = JSON.parse(localStorage.getItem('recentWorkspaces'))

      if (!recents) {
        recents = []
      } else {
        const filtered = recents.filter((workspace) => {
          return workspace !== null
        })
        setState((prevState) => {
          return { ...prevState, recentWorkspaces: filtered.slice(0, filtered.length <= 3 ? filtered.length : 3) }
        })
      }
    })

    const deleteSavedWorkspace = (name) => {
      const recents = JSON.parse(localStorage.getItem('recentWorkspaces'))
      let newRecents = recents
      if (!recents) {
        newRecents = []
      } else {
        newRecents = recents.filter((el) => {
          return el !== name
        })
        localStorage.setItem('recentWorkspaces', JSON.stringify(newRecents))
      }
      setState((prevState) => {
        return { ...prevState, recentWorkspaces: newRecents.slice(0, newRecents.length <= 3 ? newRecents.length : 3) }
      })
    }
    plugin.on('filePanel', 'workspaceDeleted', async (deletedName) => {
      deleteSavedWorkspace(deletedName)
    })
    return () => {
      try {
        plugin.off('filePanel', 'setWorkspace')
        plugin.off('filePanel', 'workspaceDeleted')
      } catch (e) {}
    }
  }, [plugin])

  const toast = (message: string) => {
    setState((prevState) => {
      return { ...prevState, toasterMsg: message }
    })
  }

  const startCoding = async () => {
    _paq.push(['trackEvent', 'hometab', 'filesSection', 'startCoding'])
    plugin.verticalIcons.select('filePanel')

    const wName = 'Playground'
    const workspaces = await plugin.call('filePanel', 'getWorkspaces')
    let createFile = true
    if (!workspaces.find((workspace) => workspace.name === wName)) {
      await plugin.call('filePanel', 'createWorkspace', wName, 'playground')
      createFile = false
    }
    await plugin.call('filePanel', 'switchToWorkspace', { name: wName, isLocalHost: false })
    await plugin.call('filePanel', 'switchToWorkspace', { name: wName, isLocalHost: false }) // calling once is not working.
    const content = `// SPDX-License-Identifier: MIT
        pragma solidity >=0.6.12 <0.9.0;

        contract HelloWorld {
          /**
           * @dev Prints Hello World string
           */
          function print() public pure returns (string memory) {
            return "Hello World!";
          }
        }
      `
    if (createFile) {
      const { newPath } = await plugin.call('fileManager', 'writeFileNoRewrite', '/contracts/HelloWorld.sol', content)
      await plugin.call('fileManager', 'open', newPath)
    } else {
      await plugin.call('fileManager', 'open', '/contracts/HelloWorld.sol')
    }
  }

  const uploadFile = async (target) => {
    _paq.push(['trackEvent', 'hometab', 'filesSection', 'uploadFile'])
    await plugin.call('filePanel', 'uploadFile', target)
  }

  const connectToLocalhost = () => {
    _paq.push(['trackEvent', 'hometab', 'filesSection', 'connectToLocalhost'])
    plugin.appManager.activatePlugin('remixd')
  }
  const importFromGist = () => {
    _paq.push(['trackEvent', 'hometab', 'filesSection', 'importFromGist'])
    plugin.call('gistHandler', 'load', '')
    plugin.verticalIcons.select('filePanel')
  }

  const handleSwitchToRecentWorkspace = async (e, workspaceName) => {
    e.preventDefault()
    plugin.call('sidePanel', 'showContent', 'filePanel')
    plugin.verticalIcons.select('filePanel')
    _paq.push(['trackEvent', 'hometab', 'filesSection', 'loadRecentWorkspace'])
    await plugin.call('filePanel', 'switchToWorkspace', { name: workspaceName, isLocalhost: false })
  }

  return (
    <>
      <Toaster message={state.toasterMsg} />
      <div className="justify-content-start p-2 d-flex flex-column" id="hTFileSection">
        <div className="mb-1">
          {(state.recentWorkspaces[0] || state.recentWorkspaces[1] || state.recentWorkspaces[2]) && (
            <div className="d-flex flex-column mb-5 remixui_recentworkspace">
              <label style={{ fontSize: '0.8rem' }} className="mt-1">
                Recent Workspaces
              </label>
              {state.recentWorkspaces[0] && state.recentWorkspaces[0] !== '' && (
                <a className="cursor-pointer mb-1 ml-2" href="#" onClick={(e) => handleSwitchToRecentWorkspace(e, state.recentWorkspaces[0])}>
                  {state.recentWorkspaces[0]}
                </a>
              )}
              {state.recentWorkspaces[1] && state.recentWorkspaces[1] !== '' && (
                <a className="cursor-pointer mb-1 ml-2" href="#" onClick={(e) => handleSwitchToRecentWorkspace(e, state.recentWorkspaces[1])}>
                  {state.recentWorkspaces[1]}
                </a>
              )}
              {state.recentWorkspaces[2] && state.recentWorkspaces[2] !== '' && (
                <a className="cursor-pointer ml-2" href="#" onClick={(e) => handleSwitchToRecentWorkspace(e, state.recentWorkspaces[2])}>
                  {state.recentWorkspaces[2]}
                </a>
              )}
            </div>
          )}
        </div>
        <div className="d-flex flex-column flex-nowrap mt-4">
          <label style={{ fontSize: '1.2rem' }}>
            <FormattedMessage id="home.files" />
          </label>
          <div className="d-flex flex-row flex-wrap">
            <CustomTooltip placement={'top'} tooltipId="overlay-tooltip" tooltipClasses="text-nowrap" tooltipText={<FormattedMessage id="home.newFileTooltip" />} tooltipTextClasses="border bg-light text-dark p-1 pr-3">
              <button className="btn text-nowrap p-2 mr-2 border my-1 mb-2" data-id="homeTabNewFile" style={{ width: 'fit-content' }} onClick={async () => {
                _paq.push(['trackEvent', 'hometab', 'filesSection', 'newFile'])
                await plugin.call('menuicons', 'select', 'filePanel')
                await plugin.call('filePanel', 'createNewFile')
              }}>
                <i className="far fa-file pl-1 pr-2"></i>
                <FormattedMessage id="home.newFile" />
              </button>
            </CustomTooltip>
            <CustomTooltip placement={'top'} tooltipId="overlay-tooltip" tooltipClasses="text-nowrap" tooltipText={<FormattedMessage id="home.openFileTooltip" />} tooltipTextClasses="border bg-light text-dark p-1 pr-3">
              <span>
                <label className="btn text-nowrap p-2 mr-2 border my-1 mb-2" style={{ width: 'fit-content', cursor: 'pointer' }} htmlFor="openFileInput">
                  <i className="far fa-upload pl-1 pr-2"></i>
                  <FormattedMessage id="home.openFile" />
                </label>
                <input
                  title="open file"
                  type="file"
                  id="openFileInput"
                  onChange={async (event) => {
                    event.stopPropagation()
                    await plugin.call('menuicons', 'select', 'filePanel')
                    uploadFile(event.target)
                  }}
                  multiple
                />
              </span>
            </CustomTooltip>
            <CustomTooltip placement={'top'} tooltipId="overlay-tooltip" tooltipClasses="text-nowrap" tooltipText={<FormattedMessage id="home.gistTooltip" />} tooltipTextClasses="border bg-light text-dark p-1 pr-3"
            >
              <button className="btn text-nowrap p-2 mr-2 border my-1 mb-2" data-id="landingPageImportFromGistButton" onClick={() => importFromGist()}>
                <i className="fab fa-github pl-1 pr-2"></i>
                Gist
              </button>
            </CustomTooltip>
            <CustomTooltip placement={'top'} tooltipId="overlay-tooltip" tooltipClasses="text-nowrap" tooltipText={<FormattedMessage id="home.gitCloneTooltip" />} tooltipTextClasses="border bg-light text-dark p-1 pr-3"
            >
              <button className="btn text-nowrap p-2 mr-2 border my-1 mb-2" data-id="landingPageImportFromGitHubButton" onClick={async () => {
                _paq.push(['trackEvent', 'hometab', 'filesSection', 'Git Clone'])
                await plugin.call('filePanel', 'clone')
              }}>
                <i className="fa-brands fa-github-alt pl-1 pr-2"></i>
                Clone
              </button>
            </CustomTooltip>
            <CustomTooltip placement={'top'} tooltipId="overlay-tooltip" tooltipClasses="text-nowrap" tooltipText={<FormattedMessage id="home.connectToLocalhost" />} tooltipTextClasses="border bg-light text-dark p-1 pr-3">
              <button className="btn text-nowrap p-2 border my-1 mb-2" onClick={() => connectToLocalhost()}>
                <i className="fa-regular fa-desktop pr-2"></i>
                <FormattedMessage id="home.accessFileSystem" />
              </button>
            </CustomTooltip>
          </div>
        </div>
      </div>
    </>
  )
}

export default HomeTabFile
