/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { Fragment, ReactNode, useEffect, useState } from 'react' // eslint-disable-line no-use-before-define
import { FormattedMessage } from 'react-intl'
import { PluginManagerComponent, PluginManagerSettings } from '../../types'
import PermisssionsSettings from './permissionsSettings'
import { Profile } from '@remixproject/plugin-utils'
import LocalPluginForm from './LocalPluginForm'

interface RootViewProps {
  pluginComponent: PluginManagerComponent
  children: ReactNode
}

export interface pluginDeactivated {
  flag: boolean
  profile: Profile
}

export interface pluginActivated {
  flag: boolean
  profile: Profile
}

function RootView({ pluginComponent, children }: RootViewProps) {
  const [visible, setVisible] = useState<boolean>(true)
  const [filterPlugins, setFilterPlugin] = useState<string>('')

  const openModal = () => {
    setVisible(false)
  }
  const closeModal = () => setVisible(true)

  useEffect(() => {
    pluginComponent.getAndFilterPlugins(filterPlugins)
  }, [filterPlugins])
  return (
    <Fragment>
      <div id="pluginManager" data-id="pluginManagerComponentPluginManager">
        <header className="form-group mb-0 d-flex flex-column align-items-center bg-light plugins-header pt-3 pb-0 px-3" data-id="pluginManagerComponentPluginManagerHeader">
          <input
            type="text"
            onChange={(event) => {
              setFilterPlugin(event.target.value.toLowerCase())
            }}
            value={filterPlugins}
            className="mb-2 form-control"
            placeholder="Search"
            data-id="pluginManagerComponentSearchInput"
          />
          <button onClick={openModal} className="py-1 btn bg-transparent text-dark border-0 mt-2 text-underline" data-id="pluginManagerComponentPluginSearchButton">
            <FormattedMessage id="pluginManager.connectLocal" />
          </button>
        </header>
        {children}
        <PermisssionsSettings />
      </div>
      <LocalPluginForm closeModal={closeModal} visible={visible} pluginManager={pluginComponent} />
    </Fragment>
  )
}

export default RootView
