import { Profile } from '@remixproject/plugin-utils'
import React, { Fragment, useEffect } from 'react'
import { PluginManagerComponent, PluginManagerProfile } from '../../types'
import InactivePluginCard from './InactivePluginCard'
import ModuleHeading from './moduleHeading'

interface InactivePluginCardContainerProps {
  pluginComponent: PluginManagerComponent
  setInactiveProfiles: React.Dispatch<React.SetStateAction<Profile<any>[]>>
  inactiveProfiles: Profile<any>[]
}

interface LocalPluginInterface {
  profile: Partial<PluginManagerProfile> // { name: string, displayName: string, url: string, type: 'iframe' | 'ws', hash: string, methods: string, location: 'sidePanel' | 'mainPanel' | 'none'}
  activateService: {}
  requestQueue: []
  options: { queueTimeout: number }
  id: number
  pendingRequest: {}
  listener: []
  iframe: {}
}
function InactivePluginCardContainer ({ pluginComponent, setInactiveProfiles, inactiveProfiles }: InactivePluginCardContainerProps) {
  const activatePlugin = (pluginName: string) => {
    pluginComponent.activateP(pluginName)
  }

  // useEffect(() => {
  //   const savedLocalPlugins: LocalPluginInterface = JSON.parse(localStorage.getItem('plugins/local'))
  //   const savedActiveProfiles: Profile[] = JSON.parse(localStorage.getItem('newActivePlugins'))
  //   if (pluginComponent.inactivePlugins && pluginComponent.inactivePlugins.length) {
  //     let temp: Profile[] = []
  //     if (Object.keys(savedLocalPlugins).length) {
  //       temp = [...pluginComponent.inactivePlugins, savedLocalPlugins.profile as Profile]
  //     } else {
  //       temp = [...pluginComponent.inactivePlugins]
  //     }
  //     const filtered = temp.filter(t => {
  //       return !savedActiveProfiles.find(active => {
  //         return active.name === t.name
  //       })
  //     })
  //     setInactiveProfiles(filtered)
  //   }
  // }, [pluginComponent, pluginComponent.inactivePlugins, setInactiveProfiles])
  return (
    <Fragment>
      {(pluginComponent.inactivePlugins && pluginComponent.inactivePlugins.length) ? <ModuleHeading headingLabel="Inactive Modules" count={pluginComponent.inactivePlugins.length} /> : null}
      {pluginComponent.inactivePlugins && pluginComponent.inactivePlugins.map((profile, idx) => {
        // console.log('profile: ', profile)
        return (
          <InactivePluginCard
            buttonText="Activate"
            profile={profile}
            key={idx}
            activatePlugin={activatePlugin}
          />
        )
      })
      }
    </Fragment>
  )
}

export default InactivePluginCardContainer
