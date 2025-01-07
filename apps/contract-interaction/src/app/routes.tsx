import { HashRouter as Router, Route, Routes } from 'react-router-dom'

import { GetABIView, InteractView, SettingsView } from './views'
import { DefaultLayout } from './layouts'

const DisplayRoutes = () => (
  <Router>
    <Routes>

      <Route
        path="/"
        element={
          <DefaultLayout from="/" title="GetABI" description="Lookup or decode the smart contract ABI">
            <GetABIView />
          </DefaultLayout>
        }
      />

      <Route
        path="/interact"
        element={
          <DefaultLayout from="/" title="Interact" description="Interact with smart contracts on-chain">
            <InteractView />
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
