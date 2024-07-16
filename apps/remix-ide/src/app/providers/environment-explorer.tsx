import React from 'react' // eslint-disable-line
import { ViewPlugin } from '@remixproject/engine-web'
import { PluginViewWrapper } from '@remix-ui/helper'
import { RemixUIGridView } from '@remix-ui/remix-ui-grid-view'
import { RemixUIGridSection } from '@remix-ui/remix-ui-grid-section'
import { RemixUIGridCell } from '@remix-ui/remix-ui-grid-cell'
import type { Provider } from '../../blockchain/blockchain'

import * as packageJson from '../../../../../package.json'

const _paq = (window._paq = window._paq || [])

const profile = {
  name: 'environmentExplorer',
  displayName: 'Environment Explorer',
  icon: 'assets/img/EnvironmentExplorerLogo.webp',
  description: 'Explore providers and customize web3 provider list',
  location: 'mainPanel',
  documentation: 'https://remix-ide.readthedocs.io/en/latest/run.html',
  version: packageJson.version,
  maintainedBy: 'Remix',
  permission: true,
  events: [],
  methods: []
}

type ProvidersSection = `Injected` | 'Remix VMs' | 'Externals'

export class EnvironmentExplorer extends ViewPlugin {
  providers: { [key in ProvidersSection]: Provider[] }
  providersFlat: { [key: string]: Provider }
  pinnedProviders: string[]
  dispatch: React.Dispatch<any> = () => {}

  constructor() {
    super(profile)
    this.providersFlat = {}
    this.providers = {
      'Injected': [],
      'Remix VMs': [],
      'Externals': []
    }
  }

  async onActivation(): Promise<void> {
    this.providersFlat = await this.call('blockchain', 'getAllProviders')
    this.pinnedProviders = await this.call('blockchain', 'getPinnedProviders')
    this.renderComponent()
  }

  addProvider (provider: Provider) {
    if (provider.isInjected) {
      this.providers['Injected'].push(provider)
    } else if (provider.isVM) {
      this.providers['Remix VMs'].push(provider)
    } else {
      this.providers['Externals'].push(provider)
    }
  }

  setDispatch(dispatch: React.Dispatch<any>): void {
    this.dispatch = dispatch
    this.renderComponent()
  }
  render() {
    return (
      <div className="bg-dark" id="environmentExplorer">
        <PluginViewWrapper plugin={this} />
      </div>
    )
  }

  renderComponent() {
    this.dispatch({
      ...this
    })
  }

  updateComponent(state: any) {
    this.providers = {
      'Injected': [],
      'Remix VMs': [],
      'Externals': []
    }
    console.log(this.providersFlat)
    for (const [key, provider] of Object.entries(this.providersFlat)) {
      this.addProvider(provider)
    }
    return (
      <RemixUIGridView
        plugin={this}
        styleList={""}
        logo={profile.icon}
        enableFilter={true}
        showUntagged={true}
        showPin={true}
        title={profile.description}
        description="Choose how you would like to interact with a chain."
      >
        <RemixUIGridSection
          plugin={this}
          title='Injected'
          hScrollable={true}
        >
          {this.providers['Injected'].map(provider => {
            return <RemixUIGridCell
              plugin={this}
              title={provider.name}

              pinned={this.pinnedProviders.includes(provider.name)}
              pinStateCallback={async (pinned: boolean) => {
                const providerName = await this.call('blockchain', 'getProvider')
                if (providerName !== provider.name) {
                  this.emit(pinned ? 'providerPinned' : 'providerUnpinned', provider.name, provider)
                  return true
                } else {
                  this.call('notification', 'toast', 'Cannot unpin the current selected provider')
                  return false
                }
              }}
            >
              <div>{provider.name}</div>
            </RemixUIGridCell>
          })}
        </RemixUIGridSection>
        <RemixUIGridSection
          plugin={this}
          title='Remix VMs'
          hScrollable= {true}
        >{this.providers['Remix VMs'].map(provider => {
            return <RemixUIGridCell
              plugin={this}
              title={provider.name}
              pinned={this.pinnedProviders.includes(provider.name)}
              pinStateCallback={async (pinned: boolean) => {
                const providerName = await this.call('blockchain', 'getProvider')
                if (providerName !== provider.name) {
                  this.emit(pinned ? 'providerPinned' : 'providerUnpinned', provider.name, provider)
                  return true
                } else {
                  this.call('notification', 'toast', 'Cannot unpin the current selected provider')
                  return false
                }
              }}
            >
              <div>{provider.name}</div>
            </RemixUIGridCell>
          })}</RemixUIGridSection>
        <RemixUIGridSection
          plugin={this}
          title='Externals'
          hScrollable= {true}
        >{this.providers['Externals'].map(provider => {
            return <RemixUIGridCell
              plugin={this}
              title={provider.name}
              pinned={this.pinnedProviders.includes(provider.name)}
              pinStateCallback={async (pinned: boolean) => {
                const providerName = await this.call('blockchain', 'getProvider')
                if (providerName !== provider.name) {
                  this.emit(pinned ? 'providerPinned' : 'providerUnpinned', provider.name, provider)
                  return true
                } else {
                  this.call('notification', 'toast', 'Cannot unpin the current selected provider')
                  return false
                }
              }}
            >
              <div>{provider.name}</div>
            </RemixUIGridCell>
          })}</RemixUIGridSection>
      </RemixUIGridView>
    )
  }
}
