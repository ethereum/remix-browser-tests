import { HashRouter as Router, Route, Routes } from 'react-router-dom'

import { LookupABIView, SettingsView } from './views'
import { DefaultLayout } from './layouts'
import { ContractInteractionPluginClient } from './ContractInteractionPluginClient'

export interface DisplayRoutesProps {
  plugin: ContractInteractionPluginClient
}

const DisplayRoutes = (props: DisplayRoutesProps) => (
  <Router>
    <Routes>

      <Route
        path="/"
        element={
          <DefaultLayout from="/" title="LookupABI" description="cSearch for verified contracts and download the ABI to Remix">
            <LookupABIView plugin={props.plugin} />
          </DefaultLayout>
        }
      />

      <Route
        path="/settings"
        element={
          <DefaultLayout from="/" title="Settings" description="Customize settings for each ABI provider service and chain">
            <SettingsView />
          </DefaultLayout>
        }
      />
    </Routes>
  </Router>
)

export default DisplayRoutes
