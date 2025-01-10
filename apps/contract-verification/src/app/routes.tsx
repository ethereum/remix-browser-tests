import React from 'react'
import { HashRouter as Router, Route, Routes } from 'react-router-dom'

import { VerifyView, ReceiptsView, LookupView, SettingsView } from './views'
import { DefaultLayout } from './layouts'
import { FormattedMessage } from 'react-intl'

const DisplayRoutes = () => (
  <Router>
    <Routes>
      <Route
        path="/"
        element={
          <DefaultLayout from="/" title="Verify" description={<FormattedMessage id="contract-verification.verifyDefaultLayout.description" defaultMessage="Verify compiled contracts on different verification services" />}>
            <VerifyView />
          </DefaultLayout>
        }
      />

      <Route
        path="/receipts"
        element={
          <DefaultLayout from="/" title="Receipts" description={<FormattedMessage id="contract-verification.receiptsDefaultLayout.description" defaultMessage="Check the verification statuses of contracts submitted for verification" />}>
            <ReceiptsView />
          </DefaultLayout>
        }
      />

      <Route
        path="/lookup"
        element={
          <DefaultLayout from="/" title="Lookup" description={<FormattedMessage id="contract-verification.lookupDefaultLayout.description" defaultMessage="Lookup the verification status of a contract by its address" />}>
            <LookupView />
          </DefaultLayout>
        }
      />

      <Route
        path="/settings"
        element={
          <DefaultLayout from="/" title="Settings" description={<FormattedMessage id="contract-verification.settingsDefaultLayout.description" defaultMessage="Configure the settings for the contract verification plugin" />}>
            <SettingsView />
          </DefaultLayout>
        }
      />
    </Routes>
  </Router>
)

export default DisplayRoutes
