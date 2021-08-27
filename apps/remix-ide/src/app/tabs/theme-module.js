import { Plugin } from '@remixproject/engine'
import { EventEmitter } from 'events'
import QueryParams from '../../lib/query-params'
import * as packageJson from '../../../../../package.json'
import yo from 'yo-yo'
const _paq = window._paq = window._paq || []

const common = {
  breakpoints: {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200
  },
  fontFamily: '"Nunito Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  space: 8
}

const themes = [{
  url: 'https://res.cloudinary.com/lianahus/raw/upload/v1597918237/remix-themes/PR365/remix-light_powaqg.css',
  quality: 'light',
  name: 'Light',
  colors: {
    surface: '#fff',
    background: '#eef1f6',
    foreground: '#2e3145',
    primary: '#007aa6',
    primaryContrast: '#fff',
    secondary: '#a8b3bc',
    secondaryContrast: '#fff',
    success: '#32ba89',
    successContrast: '#fff',
    warn: '#c97539',
    warnContrast: '#212529',
    error: '#b84040',
    errorContrast: '#fff',
    disabled: '#e9ecef',
    disabledContrast: '#6c757d'
  },
  ...common
}, {
  url: 'https://res.cloudinary.com/lianahus/raw/upload/v1597918237/remix-themes/PR365/remix-dark_tvx1s2.css',
  quality: 'dark',
  name: 'Dark',
  colors: {
    surface: '#2a2c3f',
    background: '#222336',
    foreground: '#a2a3bd',
    primary: '#007aa6',
    primaryContrast: '#fff',
    secondary: '#a8b3bc',
    secondaryContrast: '#fff',
    success: '#32ba89',
    successContrast: '#fff',
    warn: '#c97539',
    warnContrast: '#212529',
    error: '#b84040',
    errorContrast: '#fff',
    disabled: '#282a3d',
    disabledContrast: '#55566c'
  },
  ...common
}]

const profile = {
  name: 'theme',
  events: ['themeChanged'],
  methods: ['switchTheme', 'getThemes', 'currentTheme'],
  version: packageJson.version,
  kind: 'theme'
}

export class ThemeModule extends Plugin {
  constructor (registry) {
    super(profile)
    this.events = new EventEmitter()
    this._deps = {
      config: registry.get('config').api
    }
    this.themes = themes.reduce((acc, theme) => {
      return { ...acc, [theme.name]: theme }
    }, {})
    let queryTheme = (new QueryParams()).get().theme
    queryTheme = this.themes[queryTheme] ? queryTheme : null
    let currentTheme = this._deps.config.get('settings/theme')
    currentTheme = this.themes[currentTheme] ? currentTheme : null
    this.active = queryTheme || currentTheme || 'Dark'
    this.forced = !!queryTheme
  }

  /** Return the active theme */
  currentTheme () {
    return this.themes[this.active]
  }

  /** Returns all themes as an array */
  getThemes () {
    return Object.keys(this.themes).map(key => this.themes[key])
  }

  /**
   * Init the theme
   */
  initTheme (callback) {
    if (this.active) {
      const nextTheme = this.themes[this.active] // Theme
      document.documentElement.style.setProperty('--theme', nextTheme.quality)
      const theme = yo`<link rel="stylesheet" href="${nextTheme.url}" id="theme-link"/>`
      theme.addEventListener('load', () => {
        if (callback) callback()
      })
      document.head.insertBefore(theme, document.head.firstChild)
    }
  }

  /**
   * Change the current theme
   * @param {string} [themeName] - The name of the theme
   */
  switchTheme (themeName) {
    if (themeName && !Object.keys(this.themes).includes(themeName)) {
      throw new Error(`Theme ${themeName} doesn't exist`)
    }
    const next = themeName || this.active // Name
    _paq.push(['trackEvent', 'themeModule', 'switchTo', next])
    const nextTheme = this.themes[next] // Theme
    if (!this.forced) this._deps.config.set('settings/theme', next)
    document.getElementById('theme-link').setAttribute('href', nextTheme.url)
    document.documentElement.style.setProperty('--theme', nextTheme.quality)
    if (themeName) this.active = themeName
    // TODO: Only keep `this.emit` (issue#2210)
    this.emit('themeChanged', nextTheme)
    this.events.emit('themeChanged', nextTheme)
  }

  /**
   * fixes the invertion for images since this should be adjusted when we switch between dark/light qualified themes
   * @param {element} [image] - the dom element which invert should be fixed to increase visibility
   */
  fixInvert (image) {
    const invert = this.currentTheme().quality === 'dark' ? 1 : 0
    if (image) {
      image.style.filter = `invert(${invert})`
    }
  }
}
