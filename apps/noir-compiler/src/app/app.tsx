import { useEffect, useReducer, useState } from "react"
import { NoirPluginClient } from "./services/noirPluginClient"
import { RenderIf } from '@remix-ui/helper'
import { IntlProvider } from 'react-intl'
import { Container } from "./components/container"
import { NoirAppContext } from "./contexts"
import { appInitialState, appReducer } from "./reducers/state"

const plugin = new NoirPluginClient()

function App() {
  const [appState, dispatch] = useReducer(appReducer, appInitialState)
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
      plugin.on('fileManager', 'currentFileChanged', (filePath) => {
        if (filePath.endsWith('.nr')) {
          dispatch({ type: 'SET_FILE_PATH', payload: filePath })
          plugin.parse(filePath)
        }
      })
      // @ts-ignore
      plugin.on('editor', 'contentChanged', async (path: string, content: string) => {
        setIsContentChanged(true)
        // check if autoCompile is enabled
        // if (path.endsWith('.nr')) {
        //   plugin.parse(path, content)
        // }
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
    plugin,
    dispatch,
    appState
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
