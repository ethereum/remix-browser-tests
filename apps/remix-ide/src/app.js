'use strict'
import { basicLogo } from './app/ui/svgLogo'

import { RunTab, makeUdapp } from './app/udapp'

import PanelsResize from './lib/panels-resize'
import { RemixEngine } from './remixEngine'
import { RemixAppManager } from './remixAppManager'
import { FramingService } from './framingService'
import { WalkthroughService } from './walkthroughService'
import { MainView } from './app/panels/main-view'
import { ThemeModule } from './app/tabs/theme-module'
import { NetworkModule } from './app/tabs/network-module'
import { Web3ProviderModule } from './app/tabs/web3-provider'
import { SidePanel } from './app/components/side-panel'
import { HiddenPanel } from './app/components/hidden-panel'
import { VerticalIcons } from './app/components/vertical-icons'
import { LandingPage } from './app/ui/landing-page/landing-page'
import { MainPanel } from './app/components/main-panel'

import { OffsetToLineColumnConverter, CompilerMetadata, CompilerArtefacts, FetchAndCompile, CompilerImports } from '@remix-project/core-plugin'

import migrateFileSystem from './migrateFileSystem'

const isElectron = require('is-electron')
const csjs = require('csjs-inject')
const yo = require('yo-yo')
const remixLib = require('@remix-project/remix-lib')
const registry = require('./global/registry')

const QueryParams = require('./lib/query-params')
const Storage = remixLib.Storage
const RemixDProvider = require('./app/files/remixDProvider')
const HardhatProvider = require('./app/tabs/hardhat-provider')
const Config = require('./config')
const modalDialogCustom = require('./app/ui/modal-dialog-custom')
const modalDialog = require('./app/ui/modaldialog')
const FileManager = require('./app/files/fileManager')
const FileProvider = require('./app/files/fileProvider')
const DGitProvider = require('./app/files/dgitProvider')
const WorkspaceFileProvider = require('./app/files/workspaceFileProvider')
const toolTip = require('./app/ui/tooltip')

const Blockchain = require('./blockchain/blockchain.js')

const PluginManagerComponent = require('./app/components/plugin-manager-component')

const CompileTab = require('./app/tabs/compile-tab')
const SettingsTab = require('./app/tabs/settings-tab')
const AnalysisTab = require('./app/tabs/analysis-tab')
const { DebuggerTab } = require('./app/tabs/debugger-tab')
const TestTab = require('./app/tabs/test-tab')
const FilePanel = require('./app/panels/file-panel')
const Editor = require('./app/editor/editor')
const Terminal = require('./app/panels/terminal')
const ContextualListener = require('./app/editor/contextualListener')
const _paq = window._paq = window._paq || []

const css = csjs`
  html { box-sizing: border-box; }
  *, *:before, *:after { box-sizing: inherit; }
  body                 {
    /* font: 14px/1.5 Lato, "Helvetica Neue", Helvetica, Arial, sans-serif; */
    font-size          : .8rem;
  }
  pre {
    overflow-x: auto;
  }
  .remixIDE            {
    width              : 100vw;
    height             : 100vh;
    overflow           : hidden;
    flex-direction     : row;
    display            : flex;
  }
  .mainpanel           {
    display            : flex;
    flex-direction     : column;
    overflow           : hidden;
    flex               : 1;
  }
  .iconpanel           {
    display            : flex;
    flex-direction     : column;
    overflow           : hidden;
    width              : 50px;
    user-select        : none;
  }
  .sidepanel           {
    display            : flex;
    flex-direction     : row-reverse;
    width              : 320px;
  }
  .highlightcode       {
    position           : absolute;
    z-index            : 20;
    background-color   : var(--info);
  }
  .highlightcode_fullLine {
    position           : absolute;
    z-index            : 20;
    background-color   : var(--info);
    opacity            : 0.5;
  }
  .centered {
    position           : fixed;
    top                : 20%;
    left               : 45%;
    width              : 200px;
    height             : 200px;
  }
  .centered svg path {
    fill: var(--secondary);
  }
  .centered svg polygon {
    fill              : var(--secondary);
  }
  .onboarding {
    color             : var(--text-info);
    background-color  : var(--info);
  }
  .matomoBtn {
    width              : 100px;
  }
`

class App {
  constructor (api = {}, events = {}, opts = {}) {
    var self = this
    self.appManager = new RemixAppManager({})
    self._components = {}
    self._view = {}
    self._view.splashScreen = yo`
      <div class=${css.centered}>
        ${basicLogo()}
        <div class="info-secondary" style="text-align:center">
          REMIX IDE
        </div>
      </div>
    `
    document.body.appendChild(self._view.splashScreen)

    // setup storage
    const configStorage = new Storage('config-v0.8:')

    // load app config
    const config = new Config(configStorage)
    registry.put({ api: config, name: 'config' })

    // load file system
    self._components.filesProviders = {}
    self._components.filesProviders.browser = new FileProvider('browser')
    registry.put({ api: self._components.filesProviders.browser, name: 'fileproviders/browser' })
    self._components.filesProviders.localhost = new RemixDProvider(self.appManager)
    registry.put({ api: self._components.filesProviders.localhost, name: 'fileproviders/localhost' })
    self._components.filesProviders.workspace = new WorkspaceFileProvider()
    registry.put({ api: self._components.filesProviders.workspace, name: 'fileproviders/workspace' })

    registry.put({ api: self._components.filesProviders, name: 'fileproviders' })

    migrateFileSystem(self._components.filesProviders.browser)
  }

  init () {
    var self = this
    run.apply(self)
  }

  render () {
    var self = this
    if (self._view.el) return self._view.el
    // not resizable
    self._view.iconpanel = yo`
      <div id="icon-panel" data-id="remixIdeIconPanel" class="${css.iconpanel} bg-light">
      ${''}
      </div>
    `

    // center panel, resizable
    self._view.sidepanel = yo`
      <div id="side-panel" data-id="remixIdeSidePanel" style="min-width: 320px;" class="${css.sidepanel} border-right border-left">
        ${''}
      </div>
    `

    // handle the editor + terminal
    self._view.mainpanel = yo`
      <div id="main-panel" data-id="remixIdeMainPanel" class=${css.mainpanel}>
        ${''}
      </div>
    `

    self._components.resizeFeature = new PanelsResize(self._view.sidepanel)

    self._view.el = yo`
      <div style="visibility:hidden" class=${css.remixIDE} data-id="remixIDE">
        ${self._view.iconpanel}
        ${self._view.sidepanel}
        ${self._components.resizeFeature.render()}
        ${self._view.mainpanel}
      </div>
    `
    return self._view.el
  }
}

module.exports = App

async function run () {
  var self = this

  // check the origin and warn message
  if (window.location.hostname === 'yann300.github.io') {
    modalDialogCustom.alert('This UNSTABLE ALPHA branch of Remix has been moved to http://ethereum.github.io/remix-live-alpha.')
  } else if (window.location.hostname === 'remix-alpha.ethereum.org' ||
  (window.location.hostname === 'ethereum.github.io' && window.location.pathname.indexOf('/remix-live-alpha') === 0)) {
    modalDialogCustom.alert('Welcome to the Remix alpha instance. Please use it to try out latest features. But use preferably https://remix.ethereum.org for any production work.')
  } else if (window.location.protocol.indexOf('http') === 0 &&
  window.location.hostname !== 'remix.ethereum.org' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1') {
    modalDialogCustom.alert(`The Remix IDE has moved to http://remix.ethereum.org.\n
This instance of Remix you are visiting WILL NOT BE UPDATED.\n
Please make a backup of your contracts and start using http://remix.ethereum.org`)
  }
  if (window.location.protocol.indexOf('https') === 0) {
    toolTip('You are using an `https` connection. Please switch to `http` if you are using Remix against an `http Web3 provider` or allow Mixed Content in your browser.')
  }

  const hosts = ['127.0.0.1:8080', '192.168.0.101:8080', 'localhost:8080']
  // workaround for Electron support
  if (!isElectron() && !hosts.includes(window.location.host)) {
    // Oops! Accidentally trigger refresh or bookmark.
    window.onbeforeunload = function () {
      return 'Are you sure you want to leave?'
    }
  }

  // APP_MANAGER
  const appManager = self.appManager
  const pluginLoader = appManager.pluginLoader
  const workspace = pluginLoader.get()
  const engine = new RemixEngine()
  engine.register(appManager)

  // SERVICES
  // ----------------- theme service ---------------------------------
  const themeModule = new ThemeModule(registry)
  registry.put({ api: themeModule, name: 'themeModule' })
  themeModule.initTheme(() => {
    setTimeout(() => {
      document.body.removeChild(self._view.splashScreen)
      self._view.el.style.visibility = 'visible'
    }, 1500)
  })
  // ----------------- editor service ----------------------------
  const editor = new Editor({}, themeModule) // wrapper around ace editor
  registry.put({ api: editor, name: 'editor' })
  editor.event.register('requiringToSaveCurrentfile', () => fileManager.saveCurrentFile())

  // ----------------- fileManager service ----------------------------
  const fileManager = new FileManager(editor, appManager)
  registry.put({ api: fileManager, name: 'filemanager' })
  // ----------------- dGit provider ---------------------------------
  const dGitProvider = new DGitProvider()

  // ----------------- import content service ------------------------
  const contentImport = new CompilerImports()

  const blockchain = new Blockchain(registry.get('config').api)

  // ----------------- compilation metadata generation service ---------
  const compilerMetadataGenerator = new CompilerMetadata()
  // ----------------- compilation result service (can keep track of compilation results) ----------------------------
  const compilersArtefacts = new CompilerArtefacts() // store all the compilation results (key represent a compiler name)
  registry.put({ api: compilersArtefacts, name: 'compilersartefacts' })

  // service which fetch contract artifacts from sourve-verify, put artifacts in remix and compile it
  const fetchAndCompile = new FetchAndCompile()
  // ----------------- network service (resolve network id / name) -----
  const networkModule = new NetworkModule(blockchain)
  // ----------------- represent the current selected web3 provider ----
  const web3Provider = new Web3ProviderModule(blockchain)
  const hardhatProvider = new HardhatProvider(blockchain)
  // ----------------- convert offset to line/column service -----------
  const offsetToLineColumnConverter = new OffsetToLineColumnConverter()
  registry.put({ api: offsetToLineColumnConverter, name: 'offsettolinecolumnconverter' })

  // -------------------Terminal----------------------------------------

  const terminal = new Terminal(
    { appManager, blockchain },
    {
      getPosition: (event) => {
        var limitUp = 36
        var limitDown = 20
        var height = window.innerHeight
        var newpos = (event.pageY < limitUp) ? limitUp : event.pageY
        newpos = (newpos < height - limitDown) ? newpos : height - limitDown
        return height - newpos
      }
    }
  )
  makeUdapp(blockchain, compilersArtefacts, (domEl) => terminal.logHtml(domEl))

  const contextualListener = new ContextualListener({ editor })

  engine.register([
    blockchain,
    contentImport,
    themeModule,
    editor,
    fileManager,
    compilerMetadataGenerator,
    compilersArtefacts,
    networkModule,
    offsetToLineColumnConverter,
    contextualListener,
    terminal,
    web3Provider,
    fetchAndCompile,
    dGitProvider,
    hardhatProvider
  ])

  // LAYOUT & SYSTEM VIEWS
  const appPanel = new MainPanel()
  const mainview = new MainView(contextualListener, editor, appPanel, fileManager, appManager, terminal)
  registry.put({ api: mainview, name: 'mainview' })

  engine.register([
    appPanel,
    mainview.tabProxy
  ])

  // those views depend on app_manager
  const menuicons = new VerticalIcons(appManager)
  const sidePanel = new SidePanel(appManager, menuicons)
  const hiddenPanel = new HiddenPanel()
  const pluginManagerComponent = new PluginManagerComponent(appManager, engine)
  const filePanel = new FilePanel(appManager)
  const landingPage = new LandingPage(appManager, menuicons, fileManager, filePanel, contentImport)
  const settings = new SettingsTab(
    registry.get('config').api,
    editor,
    appManager
  )

  // adding Views to the DOM
  self._view.mainpanel.appendChild(mainview.render())
  self._view.iconpanel.appendChild(menuicons.render())
  self._view.sidepanel.appendChild(sidePanel.render())
  document.body.appendChild(hiddenPanel.render()) // Hidden Panel is display none, it can be directly on body

  engine.register([
    menuicons,
    landingPage,
    hiddenPanel,
    sidePanel,
    filePanel,
    pluginManagerComponent,
    settings
  ])

  const queryParams = new QueryParams()
  const params = queryParams.get()

  const onAcceptMatomo = () => {
    _paq.push(['forgetUserOptOut'])
    // @TODO remove next line when https://github.com/matomo-org/matomo/commit/9e10a150585522ca30ecdd275007a882a70c6df5 is used
    document.cookie = 'mtm_consent_removed=; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    settings.updateMatomoAnalyticsChoice(true)
    const el = document.getElementById('modal-dialog')
    el.parentElement.removeChild(el)
    startWalkthroughService()
  }
  const onDeclineMatomo = () => {
    settings.updateMatomoAnalyticsChoice(false)
    _paq.push(['optUserOut'])
    const el = document.getElementById('modal-dialog')
    el.parentElement.removeChild(el)
    startWalkthroughService()
  }

  const startWalkthroughService = () => {
    const walkthroughService = new WalkthroughService(localStorage)
    if (!params.code && !params.url && !params.minimizeterminal && !params.gist && !params.minimizesidepanel) {
      walkthroughService.start()
    }
  }

  // Ask to opt in to Matomo for remix, remix-alpha and remix-beta
  const matomoDomains = {
    'remix-alpha.ethereum.org': 27,
    'remix-beta.ethereum.org': 25,
    'remix.ethereum.org': 23
  }
  if (matomoDomains[window.location.hostname] && !registry.get('config').api.exists('settings/matomo-analytics')) {
    modalDialog(
      'Help us to improve Remix IDE',
      yo`
      <div>
        <p>An Opt-in version of <a href="https://matomo.org" target="_blank">Matomo</a>, an open source data analytics platform is being used to improve Remix IDE.</p>
        <p>We realize that our users have sensitive information in their code and that their privacy - your privacy - must be protected.</p>
        <p>All data collected through Matomo is stored on our own server - no data is ever given to third parties.  Our analytics reports are public: <a href="https://matomo.ethereum.org/index.php?module=MultiSites&action=index&idSite=23&period=day&date=yesterday" target="_blank">take a look</a>.</p>
        <p>We do not collect nor store any personally identifiable information (PII).</p>
        <p>For more info, see: <a href="https://medium.com/p/66ef69e14931/" target="_blank">Matomo Analyitcs on Remix iDE</a>.</p>
        <p>You can change your choice in the Settings panel anytime.</p>
        <div class="d-flex justify-content-around pt-3 border-top">
          <button class="btn btn-primary ${css.matomoBtn}" onclick=${() => onAcceptMatomo()}>Sure</button>
          <button class="btn btn-secondary ${css.matomoBtn}" onclick=${() => onDeclineMatomo()}>Decline</button>
        </div>
      </div>`,
      {
        label: '',
        fn: null
      },
      {
        label: '',
        fn: null
      }
    )
  } else {
    startWalkthroughService()
  }

  // CONTENT VIEWS & DEFAULT PLUGINS
  const compileTab = new CompileTab(
    editor,
    registry.get('config').api,
    registry.get('fileproviders/browser').api,
    registry.get('filemanager').api,
    contentImport
  )
  const run = new RunTab(
    blockchain,
    registry.get('config').api,
    registry.get('filemanager').api,
    registry.get('editor').api,
    filePanel,
    registry.get('compilersartefacts').api,
    networkModule,
    mainview,
    registry.get('fileproviders/browser').api
  )
  const analysis = new AnalysisTab(registry)
  const debug = new DebuggerTab()
  const test = new TestTab(
    registry.get('filemanager').api,
    registry.get('offsettolinecolumnconverter').api,
    filePanel,
    compileTab,
    appManager,
    contentImport
  )

  engine.register([
    compileTab,
    compileTab.compileTabLogic,
    run,
    debug,
    analysis,
    test,
    filePanel.remixdHandle,
    filePanel.gitHandle,
    filePanel.hardhatHandle,
    filePanel.slitherHandle
  ])

  if (isElectron()) {
    appManager.activatePlugin('remixd')
  }

  try {
    engine.register(await appManager.registeredPlugins())
  } catch (e) {
    console.log('couldn\'t register iframe plugins', e.message)
  }

  await appManager.activatePlugin(['theme', 'editor', 'fileManager', 'compilerMetadata', 'compilerArtefacts', 'network', 'web3Provider', 'offsetToLineColumnConverter'])
  await appManager.activatePlugin(['mainPanel', 'menuicons', 'tabs'])
  await appManager.activatePlugin(['sidePanel']) // activating  host plugin separately
  await appManager.activatePlugin(['home'])
  await appManager.activatePlugin(['settings'])
  await appManager.activatePlugin(['hiddenPanel', 'filePanel', 'pluginManager', 'contextualListener', 'terminal', 'blockchain', 'fetchAndCompile', 'contentImport'])
  await appManager.registerContextMenuItems()
  // Set workspace after initial activation
  if (Array.isArray(workspace)) {
    appManager.activatePlugin(workspace).then(async () => {
      try {
        if (params.deactivate) {
          await appManager.deactivatePlugin(params.deactivate.split(','))
        }
      } catch (e) {
        console.log(e)
      }

      if (params.code) {
        // if code is given in url we focus on solidity plugin
        menuicons.select('solidity')
      } else {
        // If plugins are loaded from the URL params, we focus on the last one.
        if (pluginLoader.current === 'queryParams' && workspace.length > 0) menuicons.select(workspace[workspace.length - 1])
      }

      if (params.call) {
        const callDetails = params.call.split('//')
        if (callDetails.length > 1) {
          toolTip(`initiating ${callDetails[0]} ...`)
          // @todo(remove the timeout when activatePlugin is on 0.3.0)
          appManager.call(...callDetails).catch(console.error)
        }
      }
    }).catch(console.error)
  } else {
    // activate solidity plugin
    appManager.activatePlugin(['solidity', 'udapp'])
  }

  // Load and start the service who manager layout and frame
  const framingService = new FramingService(sidePanel, menuicons, mainview, this._components.resizeFeature)

  if (params.embed) framingService.embed()
  if (params.code) framingService.code()
  framingService.start(params)
}
