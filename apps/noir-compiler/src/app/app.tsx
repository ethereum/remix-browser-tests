import { useEffect, useState } from "react"
import { NoirPluginClient } from "./services/noirPluginClient"
import { RenderIf } from '@remix-ui/helper'
import { IntlProvider } from 'react-intl'
import { Container } from "./components/container"
import { NoirAppContext } from "./contexts"

const plugin = new NoirPluginClient()

function App() {
  // const [appState, dispatch] = useReducer(appReducer, appInitialState)
  const [locale, setLocale] = useState<{code: string; messages: any}>({
    code: 'en',
    messages: null
  })
  const [isContentChanged, setIsContentChanged] = useState<boolean>(false)
  const [isPluginActivated, setIsPluginActivated] = useState<boolean>(false)

  useEffect(() => {
    plugin.internalEvents.on('noir_activated', () => {
      // @ts-ignore
      plugin.on('locale', 'localeChanged', (locale: any) => {
        setLocale(locale)
      })
      setIsPluginActivated(true)
    })
  }, [])

  useEffect(() => {
    if (isPluginActivated) {
      setCurrentLocale()
    }
  }, [isPluginActivated])

  const setCurrentLocale = async () => {
    // @ts-ignore
    const currentLocale = await plugin.call('locale', 'currentLocale')

    setLocale(currentLocale)
  }

  const value = {
    plugin
  }

  return (
    <div className="noir_compiler_app">
      <RenderIf condition={locale.messages}>
        <IntlProvider locale={locale.code} messages={locale.messages}>
          <NoirAppContext.Provider value={value}>
            <Container />
          </NoirAppContext.Provider>
        </IntlProvider>
      </RenderIf>
    </div>
  )
}

export default App
