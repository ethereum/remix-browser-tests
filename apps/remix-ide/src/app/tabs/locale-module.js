import { Plugin } from '@remixproject/engine'
import { EventEmitter } from 'events'
import { QueryParams } from '@remix-project/remix-lib'
import * as packageJson from '../../../../../package.json'
import {Registry} from '@remix-project/remix-lib'
import enJson from './locales/en'
import zhJson from './locales/zh'
import esJson from './locales/es'
import frJson from './locales/fr'
import itJson from './locales/it'
import koJson from './locales/ko'
import ruJson from './locales/ru'
const _paq = window._paq = window._paq || []

const locales = [
  { code: 'zh', name: 'Chinese Simplified', localeName: '简体中文', messages: zhJson },
  { code: 'en', name: 'English', localeName: 'English', messages: enJson },
  { code: 'fr', name: 'French', localeName: 'Français', messages: frJson },
  { code: 'it', name: 'Italian', localeName: 'Italiano', messages: itJson },
  { code: 'ko', name: 'Korean', localeName: '한국인', messages: koJson },
  { code: 'ru', name: 'Russian', localeName: 'Русский', messages: ruJson },
  { code: 'es', name: 'Spanish', localeName: 'Español', messages: esJson }
]

const profile = {
  name: 'locale',
  events: ['localeChanged'],
  methods: ['switchLocale', 'getLocales', 'currentLocale'],
  version: packageJson.version,
  kind: 'locale'
}

export class LocaleModule extends Plugin {
  constructor () {
    super(profile)
    this.events = new EventEmitter()
    this._deps = {
      config: Registry.getInstance().get('config') && Registry.getInstance().get('config').api
    }
    this.locales = {}
    locales.forEach((locale) => {
      this.locales[locale.code.toLocaleLowerCase()] = locale
    })
    this._paq = _paq
    this.queryParams = new QueryParams()
    let queryLocale = this.queryParams.get().lang
    queryLocale = queryLocale && queryLocale.toLocaleLowerCase()
    queryLocale = this.locales[queryLocale] ? queryLocale : null
    let currentLocale = (this._deps.config && this._deps.config.get('settings/locale')) || null
    currentLocale = currentLocale && currentLocale.toLocaleLowerCase()
    currentLocale = this.locales[currentLocale] ? currentLocale : null
    this.currentLocaleState = { queryLocale, currentLocale }
    this.active = queryLocale || currentLocale || 'en'
    this.forced = !!queryLocale
    this.queryParams.update({ lang: this.active })
  }

  /** Return the active locale */
  currentLocale () {
    return this.locales[this.active]
  }

  /** Returns all locales as an array */
  getLocales () {
    return Object.keys(this.locales).map(key => this.locales[key])
  }

  /**
   * Change the current locale
   * @param {string} [localeCode] - The code of the locale
   */
  switchLocale (localeCode) {
    localeCode = localeCode && localeCode.toLocaleLowerCase()
    if (localeCode && !Object.keys(this.locales).includes(localeCode)) {
      throw new Error(`Locale ${localeCode} doesn't exist`)
    }
    const next = localeCode || this.active // Name
    if (next === this.active) return // --> exit out of this method
    _paq.push(['trackEvent', 'localeModule', 'switchTo', next])
    const nextLocale = this.locales[next] // Locale
    if (!this.forced) this._deps.config.set('settings/locale', next)

    if (localeCode) this.active = localeCode
    this.queryParams.update({ lang: localeCode })
    this.emit('localeChanged', nextLocale)
    this.events.emit('localeChanged', nextLocale)
  }
}
