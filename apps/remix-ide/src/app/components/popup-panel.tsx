import React from 'react' // eslint-disable-line
import { AbstractPanel } from './panel'
import { PluginRecord, RemixPluginPanel } from '@remix-ui/panel'
import packageJson from '../../../../../package.json'
import { PluginViewWrapper } from '@remix-ui/helper'
import { EventEmitter } from 'events'

import { AppAction, appActionTypes, AppState } from '@remix-ui/app'

const profile = {
  name: 'popupPanel',
  displayName: 'Popup Panel',
  description: 'Remix IDE popup panel',
  version: packageJson.version,
  events: [],
  methods: ['addView', 'removeView', 'showContent', 'showPopupPanel']
}
type popupPanelState = {
  plugins: Record<string, PluginRecord>
}

export class PopupPanel extends AbstractPanel {
  element: HTMLDivElement
  dispatch: React.Dispatch<any> = () => { }
  appStateDispatch: React.Dispatch<AppAction> = () => { }

  constructor(config = null) {
    super(profile)
    this.event = new EventEmitter()
  }

  setDispatch(dispatch: React.Dispatch<any>) {
    this.dispatch = dispatch
  }

  setAppStateDispatch(appStateDispatch: React.Dispatch<AppAction>) {
    this.appStateDispatch = appStateDispatch
  }

  onActivation() {
    this.renderComponent()
  }

  focus(name) {
    this.emit('focusChanged', name)
    super.focus(name)
    this.renderComponent()
  }

  addView(profile, view) {
    super.addView(profile, view)
    this.renderComponent()
    this.showContent(profile.name) // should be handled by some click
  }

  removeView(profile) {
    super.removeView(profile)
    this.renderComponent()
  }

  async showContent(name) {
    super.showContent(name)
    this.renderComponent()
  }

  async showPopupPanel(show) {

    this.appStateDispatch({
      type: appActionTypes.setShowPopupPanel,
      payload: show
    })
    this.renderComponent()
  }

  renderComponent() {
    this.dispatch({
      plugins: this.plugins
    })
  }

  render() {
    return (
      <PluginViewWrapper useAppContext={true} plugin={this} />
    )
  }

  updateComponent(state: popupPanelState, appState: Partial<AppState>) {
    return (
      <div
        className={`px-0 bg-light border-info ${appState?.showPopupPanel ? 'd-flex' : 'd-none'}`}
        style={{
          maxHeight: '100rem',
          minWidth: '22rem',
          width: '30%',
          height: '80%',
          position: 'fixed',
          bottom: '2rem',
          right: '1.5rem',
          zIndex: 200,
          boxShadow: "0 1px 7px var(--secondary)"
        }}
        data-id="popupPanelPluginsContainer"
      >
        <div className='d-flex w-100 flex-column'>
          <RemixPluginPanel
            header={
              <span id='popupPanelToggle' className='d-flex flex-row'>
                <button
                  data-id='popupPanelToggle'
                  className='btn fas fa-angle-double-down'
                  onClick={async () => {
                    await this.showPopupPanel(false)
                  }}
                >
                </button>
              </span>
            }
            plugins={state.plugins} />
        </div>
      </div>
    )
  }
}
