import React, { useContext, useEffect } from 'react'
import { AppContext, appActionTypes } from '@remix-ui/app'
import { Provider } from '../../blockchain/blockchain'
import { providerLogos } from '../udapp/run-tab'
import { desktopConnection } from '@remix-api'
import { set } from 'lodash'

interface DesktopClientState {
  connected: desktopConnection
  providers: Provider[]
  disableconnect: boolean
  currentContext: string
}

const DesktopClientUI = (props: DesktopClientState & { openDesktopApp: () => void } & { onConnect: (providerName: Provider) => void }) => {
  const appContext = useContext(AppContext)
  const { connected, providers, onConnect, disableconnect, currentContext } = props
  const [title, setTitle] = React.useState('Connecting...')
  const [disabled, setDisabled] = React.useState(false)
  const [hasMetamask, setHasMetamask] = React.useState(false)
  const [hasBrave, setHasBrave] = React.useState(false)

  useEffect(() => {
    console.log('connected', props.connected)
    appContext.appStateDispatch({
      type: appActionTypes.setConnectedToDesktop,
      payload: props.connected,
    })
    appContext.appStateDispatch({
      type: appActionTypes.setShowPopupPanel,
      payload: false,
    })
  }, [props.connected])

  useEffect(() => {
    console.log('providers', props.providers)
    const metamaskProvider = providers.find((provider) => provider.name.toLowerCase().includes('metamask'))
    const braveProvider = providers.find((provider) => provider.name.toLowerCase().includes('brave'))
    setHasMetamask(!!metamaskProvider)
    setHasBrave(!!braveProvider)

  }, [providers])

  useEffect(() => {
    if (hasMetamask) {
      setTitle('Connect to MetaMask')
      setDisabled(false)
    } else if (hasBrave && !hasMetamask) {
      setTitle('Brave Wallet is not supported')
      setDisabled(true)
    } else {
      setTitle('Connecting...')
    }
  },[hasMetamask, hasBrave])

  if (disabled) {
    return (
      <div>
        <div className="d-flex p-4 bg-light flex-column">
          <h3>{title}</h3>
          <p>
            The Brave Wallet is not supported at this time.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex p-4 bg-light flex-column">
        <h3>{title}</h3>
        <p>
          1. Connect to your favorite Ethereum wallet provider
          <br></br>2. Go back to the Remix Desktop application
          <br></br>3. Deploy using 'MetaMask Wallet'
          {hasBrave && <div className='text-warning'>
            Note: Brave Wallet is not supported.
          </div>}
        </p>
      </div>

      <div>
        <div className="row">
          {providers && providers.length > 0 ? (
            providers
              .filter((provider) => provider.isInjected && provider.name.toLocaleLowerCase().includes('metamask'))
              .map((provider, index) => (
                <div key={index} className="col-md-4 mb-4">
                  <div className="provider-item card h-100">
                    <div className="card-body d-flex flex-column align-items-center">
                      <div className="d-flex mb-2">{providerLogos[provider.name] && providerLogos[provider.name].map((logo, index) => <img key={index} src={logo} style={{ width: '2rem', height: '2rem', marginRight: '0.5rem' }} />)}</div>
                      <h5 className="card-title">{provider.displayName}</h5>
                      <p className="card-text">{provider.description}</p>
                      <button data-id={`connection-btn-${provider.name}`} disabled={disableconnect || currentContext === provider.name} className="btn btn-primary mt-auto" onClick={() => onConnect(provider)}>
                        {disableconnect ? 'please wait  ...' : currentContext === provider.name ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <div className="col-12">
              <div className="alert alert-warning" role="alert">
                No injected providers found. Please install MetaMask or another browser wallet.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DesktopClientUI
