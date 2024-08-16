// eslint-disable-next-line no-use-before-define
import React from 'react'
import { SettingsProps } from '../types'
import { EnvironmentUI } from './environment'
import { NetworkUI } from './network'
import { AccountUI } from './account'
import { GasLimitUI } from './gasLimit'
import { ValueUI } from './value'

export function SettingsUI(props: SettingsProps) {
  //   this._deps.config.events.on('settings/personal-mode_changed', this.onPersonalChange.bind(this))

  return (
    <div className="udapp_settings">
      <EnvironmentUI selectedEnv={props.selectExEnv} providers={props.providers} setExecutionContext={props.setExecutionContext} />
      <NetworkUI networkName={props.networkName} />
      <AccountUI
        personalMode={props.personalMode}
        selectExEnv={props.selectExEnv}
        accounts={props.accounts}
        smartAccounts={props.smartAccounts}
        setAccount={props.setAccount}
        createNewBlockchainAccount={props.createNewBlockchainAccount}
        createNewSmartAccount={props.createNewSmartAccount}
        setPassphrase={props.setPassphrase}
        setMatchPassphrase={props.setMatchPassphrase}
        tooltip={props.tooltip}
        modal={props.modal}
        signMessageWithAddress={props.signMessageWithAddress}
        passphrase={props.passphrase}
        networkName={props.networkName}
      />
      <GasLimitUI gasLimit={props.gasLimit} setGasFee={props.setGasFee} />
      <ValueUI setUnit={props.setUnit} sendValue={props.sendValue} sendUnit={props.sendUnit} setSendValue={props.setSendValue} />
    </div>
  )
}
