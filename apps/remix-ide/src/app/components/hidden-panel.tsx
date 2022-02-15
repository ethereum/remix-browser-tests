// eslint-disable-next-line no-use-before-define
import React from 'react'
import ReactDOM from 'react-dom' // eslint-disable-line
import { AbstractPanel } from './panel'
import * as packageJson from '../../../../../package.json'
import { RemixPluginPanel } from '@remix-ui/panel'
import { ViewPluginUI } from '../components/ViewPluginUI'

const profile = {
  name: 'hiddenPanel',
  displayName: 'Hidden Panel',
  description: '',
  version: packageJson.version,
  methods: ['addView', 'removeView']
}

export class HiddenPanel extends AbstractPanel {
  el: HTMLElement
  dispatch: React.Dispatch<any> = () => {}
  constructor () {
    super(profile)
    this.el = document.createElement('div')
    this.el.setAttribute('class', 'pluginsContainer')
  }

  addView (profile: any, view: any): void {
    super.removeView(profile)
    super.addView(profile, view)
    this.renderComponent()
  }

  updateComponent (state: any) {
    return <RemixPluginPanel header={<></>} plugins={state.plugins}/>
  }

  setDispatch (dispatch: React.Dispatch<any>) {
    this.dispatch = dispatch
  }

  render() {      
    return (
      <div className='pluginsContainer'><ViewPluginUI plugin={this} /></div>
    );
  }

  renderComponent () {
    this.dispatch({
      plugins: this.plugins,
    })
  }
}
