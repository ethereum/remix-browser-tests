import React, {useState, useEffect, useContext} from 'react' // eslint-disable-line

import './remix-ui-home-tab.css'
import { ThemeContext, themes } from './themeContext'
import HomeTabTitle from './components/homeTabTitle'
import HomeTabFile from './components/homeTabFile'
import HomeTabLearn from './components/homeTabLearn'
import HomeTabScamAlert from './components/homeTabScamAlert'
import HomeTabGetStarted from './components/homeTabGetStarted'
import HomeTabFeatured from './components/homeTabFeatured'
import HomeTabFeaturedPlugins from './components/homeTabFeaturedPlugins'
import { AppContext, appPlatformTypes, platformContext } from '@remix-ui/app'
import { HomeTabFileElectron } from './components/homeTabFileElectron'
import { LanguageOptions } from './components/homeTablangOptions'
import { desktopConnectionType } from '@remix-api'

declare global {
  interface Window {
    _paq: any
  }
}

export interface RemixUiHomeTabProps {
  plugin: any
}

export const RemixUiHomeTab = (props: RemixUiHomeTabProps) => {
  const platform = useContext(platformContext)
  const appContext = useContext(AppContext)
  const { plugin } = props

  const [state, setState] = useState<{
    themeQuality: {filter: string; name: string}
  }>({
    themeQuality: themes.light
  })
  const [carouselWidth, setCarouselWidth] = useState(65)

  useEffect(() => {
    plugin.call('theme', 'currentTheme').then((theme) => {
      // update theme quality. To be used for for images
      setState((prevState) => {
        return {
          ...prevState,
          themeQuality: theme.quality === 'dark' ? themes.dark : themes.light
        }
      })
    })
    plugin.on('theme', 'themeChanged', (theme) => {
      // update theme quality. To be used for for images
      setState((prevState) => {
        return {
          ...prevState,
          themeQuality: theme.quality === 'dark' ? themes.dark : themes.light
        }
      })
    })
  }, [])

  useEffect(() => {
    const checkResolution = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      if (height < 781 && width < 1150) {
        setCarouselWidth(75)
      }
    }
    checkResolution()

    return () => {
      checkResolution()
    }
  }, [])

  if (appContext.appState.connectedToDesktop != desktopConnectionType .disabled) {
    return (<></>)
  }

  //  border-right
  return (
    <div className="d-flex flex-column w-100" data-id="remixUIHTAll">
      <ThemeContext.Provider value={state.themeQuality}>
        <div className="d-flex flex-row w-100 custom_home_bg">
          <div className="px-2 pl-3 justify-content-start border-right d-flex flex-column" id="remixUIHTLeft" style={{ width: 'inherit' }}>
            <HomeTabTitle />
            <HomeTabGetStarted plugin={plugin}></HomeTabGetStarted>
            {!(platform === appPlatformTypes.desktop) ?
              <HomeTabFile plugin={plugin} />:
              <HomeTabFileElectron plugin={plugin}></HomeTabFileElectron>}
            {/* <HomeTabLearn plugin={plugin} /> */}
          </div>
          <div className="pl-2 pr-3 justify-content-start d-flex flex-column" style={{ width: `${carouselWidth}%` }} id="remixUIHTRight">
            <LanguageOptions plugin={plugin}/>
            <HomeTabFeatured plugin={plugin}></HomeTabFeatured>
            <HomeTabFeaturedPlugins plugin={plugin}></HomeTabFeaturedPlugins>
          </div>
        </div>
      </ThemeContext.Provider>
    </div>
  )
}

export default RemixUiHomeTab
