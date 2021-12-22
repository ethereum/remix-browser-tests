import * as packageJson from '../../../../../../package.json'
import { ViewPlugin } from '@remixproject/engine-web'
import { migrateToWorkspace } from '../../../migrateFileSystem'
import JSZip from 'jszip'

const yo = require('yo-yo')
const csjs = require('csjs-inject')
const globalRegistry = require('../../../global/registry')
const modalDialogCustom = require('../modal-dialog-custom')
const modalDialog = require('../modaldialog')
const tooltip = require('../tooltip')
const GistHandler = require('../../../lib/gist-handler')
const QueryParams = require('../../../lib/query-params.js')
const _paq = window._paq = window._paq || []

const css = csjs`
  .text {
    cursor: pointer;
    font-weight: normal;
    max-width: 300px;
    user-select: none;
  }
  .text:hover {
    cursor: pointer;
    text-decoration: underline;
  }
  .homeContainer {
    user-select: none;
    overflow-y: hidden;
  }
  .mainContent {
    overflow-y: auto;
    flex-grow: 3;
  }
  .hpLogoContainer {
    margin: 30px;
    padding-right: 90px;
  }
  .mediaBadge {
   font-size: 2em;
   height: 2em;
   width: 2em;
  }
  .mediaBadge:focus {
    outline: none;
  }
  .image {
    height: 1em;
    width: 1em;
    text-align: center;
  }
  .logoImg {
    height: 10em;
  }
  .hpSections {
  }
  .rightPanel {
    right: 0;
    position: absolute;
    z-index: 3;
  }
  .remixHomeMedia {
    overflow-y: auto;
    overflow-x: hidden;
    max-height: 720px;
  }
  .panels {
    box-shadow: 0px 0px 13px -7px;
  }
  .labelIt {
    margin-bottom: 0;
  }
  .bigLabelSize {
    font-size: 13px;
  }
  .seeAll {
    margin-top: 7px;
    white-space: nowrap;
  }
  .importFrom p {
    margin-right: 10px;
  }
  .logoContainer img{
    height: 150px;
    opacity: 0.7;
  }
  .envLogo {
    height: 16px;
  }
  .cursorStyle {
    cursor: pointer;
  }
  .envButton {
    width: 120px;
    height: 70px;
  }
  .media {
    overflow: hidden;
    width: 400px;
    transition: .5s ease-out;
    z-index: 1000;
  }
  .migrationBtn {
    width: 100px;
  }
}
`

const profile = {
  name: 'home',
  displayName: 'Home',
  methods: [],
  events: [],
  description: ' - ',
  icon: 'assets/img/remixLogo.webp',
  location: 'mainPanel',
  version: packageJson.version
}

export class LandingPage extends ViewPlugin {
  constructor (appManager, verticalIcons, fileManager, filePanel, contentImport) {
    super(profile)
    this.profile = profile
    this.fileManager = fileManager
    this.filePanel = filePanel
    this.contentImport = contentImport
    this.appManager = appManager
    this.verticalIcons = verticalIcons
    this.gistHandler = new GistHandler()
    const themeQuality = globalRegistry.get('themeModule').api.currentTheme().quality
    window.addEventListener('resize', () => this.adjustMediaPanel())
    window.addEventListener('click', (e) => this.hideMediaPanel(e))
    this.twitterFrame = yo`
      <div class="px-2 ${css.media}">
        <a class="twitter-timeline"
          data-width="350"
          data-theme="${themeQuality}"
          data-chrome="nofooter noheader transparent"
          data-tweet-limit="8"
          href="https://twitter.com/EthereumRemix"
        >
        </a>
        <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
      </div>
    `
    this.badgeTwitter = yo`<button
      class="btn-info p-2 m-1 border rounded-circle ${css.mediaBadge} fab fa-twitter"
      id="remixIDEHomeTwitterbtn"
      onclick=${(e) => this.showMediaPanel(e)}
    ></button>`
    this.badgeMedium = yo`<button
      class="btn-danger p-2 m-1 border rounded-circle ${css.mediaBadge} fab fa-medium"
      id="remixIDEHomeMediumbtn"
      onclick=${(e) => this.showMediaPanel(e)}
    ></button>`
    this.twitterPanel = yo`
      <div id="remixIDE_TwitterBlock" class="p-2 mx-0 mb-0 d-none ${css.remixHomeMedia}">
        ${this.twitterFrame}
      </div>
    `
    this.mediumPanel = yo`
      <div id="remixIDE_MediumBlock" class="p-2 mx-0 mb-0 d-none ${css.remixHomeMedia}">
        <div id="medium-widget" class="p-3 ${css.media}">
          <div
            id="retainable-rss-embed"
            data-rss="https://medium.com/feed/remix-ide"
            data-maxcols="1"
            data-layout="grid"
            data-poststyle="external"
            data-readmore="More..."
            data-buttonclass="btn mb-3"
            data-offset="-100"
          >
-        </div>
        </div>
      </div>
    `
    this.adjustMediaPanel()
    globalRegistry.get('themeModule').api.events.on('themeChanged', (theme) => {
      this.onThemeChanged(theme.quality)
    })
  }

  adjustMediaPanel () {
    this.twitterPanel.style.maxHeight = Math.max(window.innerHeight - 150, 200) + 'px'
    this.mediumPanel.style.maxHeight = Math.max(window.innerHeight - 150, 200) + 'px'
  }

  hideMediaPanel (e) {
    const mediaPanelsTitle = document.getElementById('remixIDEMediaPanelsTitle')
    const mediaPanels = document.getElementById('remixIDEMediaPanels')
    if (!mediaPanelsTitle || !mediaPanels) return
    if (!mediaPanelsTitle.contains(e.target) && !mediaPanels.contains(e.target)) {
      this.mediumPanel.classList.remove('d-block')
      this.mediumPanel.classList.add('d-none')
      this.twitterPanel.classList.remove('d-block')
      this.twitterPanel.classList.add('d-none')
    }
  }

  onThemeChanged (themeQuality) {
    const twitterFrame = yo`
      <div class="px-2 ${css.media}">
        <a class="twitter-timeline"
          data-width="350"
          data-theme="${themeQuality}"
          data-chrome="nofooter noheader transparent"
          data-tweet-limit="8"
          href="https://twitter.com/EthereumRemix"
        >
        </a>
        <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
      </div>
    `
    yo.update(this.twitterFrame, twitterFrame)

    const invertNum = (themeQuality === 'dark') ? 1 : 0
    if (this.solEnv.getElementsByTagName('img')[0]) this.solEnv.getElementsByTagName('img')[0].style.filter = `invert(${invertNum})`
    if (this.optimismEnv.getElementsByTagName('img')[0]) this.optimismEnv.getElementsByTagName('img')[0].style.filter = `invert(${invertNum})`
    if (this.solhintEnv.getElementsByTagName('img')[0]) this.solhintEnv.getElementsByTagName('img')[0].style.filter = `invert(${invertNum})`
    if (this.learnEthEnv.getElementsByTagName('img')[0]) this.learnEthEnv.getElementsByTagName('img')[0].style.filter = `invert(${invertNum})`
    if (this.sourcifyEnv.getElementsByTagName('img')[0]) this.sourcifyEnv.getElementsByTagName('img')[0].style.filter = `invert(${invertNum})`
    if (this.moreEnv.getElementsByTagName('img')[0]) this.moreEnv.getElementsByTagName('img')[0].style.filter = `invert(${invertNum})`
    if (this.websiteIcon) this.websiteIcon.style.filter = `invert(${invertNum})`
  }

  showMediaPanel (e) {
    if (e.target.id === 'remixIDEHomeTwitterbtn') {
      this.mediumPanel.classList.remove('d-block')
      this.mediumPanel.classList.add('d-none')
      this.twitterPanel.classList.toggle('d-block')
      _paq.push(['trackEvent', 'pluginManager', 'media', 'twitter'])
    } else {
      this.twitterPanel.classList.remove('d-block')
      this.twitterPanel.classList.add('d-none')
      this.mediumPanel.classList.toggle('d-block')
      _paq.push(['trackEvent', 'pluginManager', 'media', 'medium'])
    }
  }

  render () {
    const load = (service, item, examples, info) => {
      const contentImport = this.contentImport
      const fileProviders = globalRegistry.get('fileproviders').api
      const msg = yo`
        <div class="p-2">
          <span>Enter the ${item} you would like to load.</span>
          <div>${info}</div>
          <div>e.g ${examples.map((url) => { return yo`<div class="p-1"><a>${url}</a></div>` })}</div>
        </div>`

      const title = `Import from ${service}`
      modalDialogCustom.prompt(title, msg, null, (target) => {
        if (target !== '') {
          contentImport.import(
            target,
            (loadingMsg) => { tooltip(loadingMsg) },
            (error, content, cleanUrl, type, url) => {
              if (error) {
                modalDialogCustom.alert(title, error.message || error)
              } else {
                try {
                  fileProviders.workspace.addExternal(type + '/' + cleanUrl, content, url)
                  this.verticalIcons.select('filePanel')
                } catch (e) {
                  modalDialogCustom.alert(title, e.message)
                }
              }
            }
          )
        }
      })
    }

    const startSolidity = async () => {
      await this.appManager.activatePlugin(['solidity', 'udapp', 'solidityStaticAnalysis', 'solidityUnitTesting'])
      this.verticalIcons.select('solidity')
      _paq.push(['trackEvent', 'pluginManager', 'userActivate', 'solidity'])
    }
    const startOptimism = async () => {
      await this.appManager.activatePlugin('optimism-compiler')
      this.verticalIcons.select('optimism-compiler')
      _paq.push(['trackEvent', 'pluginManager', 'userActivate', 'optimism-compiler'])
    }
    const startSolhint = async () => {
      await this.appManager.activatePlugin(['solidity', 'solhint'])
      this.verticalIcons.select('solhint')
      _paq.push(['trackEvent', 'pluginManager', 'userActivate', 'solhint'])
    }
    const startLearnEth = async () => {
      await this.appManager.activatePlugin(['solidity', 'LearnEth', 'solidityUnitTesting'])
      this.verticalIcons.select('LearnEth')
      _paq.push(['trackEvent', 'pluginManager', 'userActivate', 'learnEth'])
    }
    const startSourceVerify = async () => {
      await this.appManager.activatePlugin(['solidity', 'source-verification'])
      this.verticalIcons.select('source-verification')
      _paq.push(['trackEvent', 'pluginManager', 'userActivate', 'source-verification'])
    }
    const startPluginManager = async () => {
      await this.appManager.activatePlugin('pluginManager')
      this.verticalIcons.select('pluginManager')
    }
    const startRestoreBackupZip = async () => {
      await this.appManager.activatePlugin(['restorebackupzip'])
      this.verticalIcons.select('restorebackupzip')
      _paq.push(['trackEvent', 'pluginManager', 'userActivate', 'restorebackupzip'])
    }

    const createNewFile = () => {
      this.call('filePanel', 'createNewFile')
    }

    const saveAs = (blob, name) => {
      const node = document.createElement('a')
      node.download = name
      node.rel = 'noopener'
      node.href = URL.createObjectURL(blob)
      setTimeout(function () { URL.revokeObjectURL(node.href) }, 4E4) // 40s
      setTimeout(function () {
        try {
          node.dispatchEvent(new MouseEvent('click'))
        } catch (e) {
          var evt = document.createEvent('MouseEvents')
          evt.initMouseEvent('click', true, true, window, 0, 0, 0, 80,
            20, false, false, false, false, 0, null)
          node.dispatchEvent(evt)
        }
      }, 0) // 40s
    }

    const downloadFiles = async () => {
      try {
        tooltip('preparing files for download, please wait..')
        const fileProviders = globalRegistry.get('fileproviders').api
        const zip = new JSZip()
        await fileProviders.browser.copyFolderToJson('/', ({ path, content }) => {
          zip.file(`remixbackup${path}`, content)
        })
        zip.generateAsync({ type: 'blob' }).then(function (blob) {
          saveAs(blob, 'remixbackup.zip')
        }).catch((e) => {
          tooltip(e.message)
        })
      } catch (e) {
        tooltip(e.message)
      }
    }

    const uploadFile = (target) => {
      this.call('filePanel', 'uploadFile', target)
    }

    const connectToLocalhost = () => {
      this.appManager.activatePlugin('remixd')
    }
    const importFromGist = () => {
      this.gistHandler.loadFromGist({ gist: '' }, globalRegistry.get('filemanager').api)
      this.verticalIcons.select('filePanel')
    }

    globalRegistry.get('themeModule').api.events.on('themeChanged', (theme) => {
      globalRegistry.get('themeModule').api.fixInvert(document.getElementById('remixLogo'))
      globalRegistry.get('themeModule').api.fixInvert(document.getElementById('solidityLogo'))
      globalRegistry.get('themeModule').api.fixInvert(document.getElementById('debuggerLogo'))
      globalRegistry.get('themeModule').api.fixInvert(document.getElementById('learnEthLogo'))
      globalRegistry.get('themeModule').api.fixInvert(document.getElementById('workshopLogo'))
      globalRegistry.get('themeModule').api.fixInvert(document.getElementById('moreLogo'))
      globalRegistry.get('themeModule').api.fixInvert(document.getElementById('solhintLogo'))
    })

    const createLargeButton = (imgPath, envID, envText, callback) => {
      return yo`
        <button
          class="btn border-secondary d-flex mr-3 text-nowrap justify-content-center flex-column align-items-center ${css.envButton}"
          data-id="landingPageStartSolidity"
          onclick=${() => callback()}
        >
          <img class="m-2 align-self-center ${css.envLogo}" id=${envID} src="${imgPath}">
          <label class="text-uppercase text-dark ${css.cursorStyle}">${envText}</label>
        </button>
      `
    }

    // main
    this.solEnv = createLargeButton('assets/img/solidityLogo.webp', 'solidityLogo', 'Solidity', startSolidity)
    // Featured
    this.optimismEnv = createLargeButton('assets/img/optimismLogo.webp', 'optimismLogo', 'Optimism', startOptimism)
    this.solhintEnv = createLargeButton('assets/img/solhintLogo.png', 'solhintLogo', 'Solhint linter', startSolhint)
    this.learnEthEnv = createLargeButton('assets/img/learnEthLogo.webp', 'learnEthLogo', 'LearnEth', startLearnEth)
    this.sourcifyEnv = createLargeButton('assets/img/sourcifyLogo.webp', 'sourcifyLogo', 'Sourcify', startSourceVerify)
    this.moreEnv = createLargeButton('assets/img/moreLogo.webp', 'moreLogo', 'More', startPluginManager)
    this.websiteIcon = yo`<img id='remixHhomeWebsite' class="mr-1 ${css.image}" src="${profile.icon}"></img>`

    const themeQuality = globalRegistry.get('themeModule').api.currentTheme().quality
    const invertNum = (themeQuality === 'dark') ? 1 : 0
    this.solEnv.getElementsByTagName('img')[0].style.filter = `invert(${invertNum})`
    this.optimismEnv.getElementsByTagName('img')[0].style.filter = `invert(${invertNum})`
    this.solhintEnv.getElementsByTagName('img')[0].style.filter = `invert(${invertNum})`
    this.learnEthEnv.getElementsByTagName('img')[0].style.filter = `invert(${invertNum})`
    this.sourcifyEnv.getElementsByTagName('img')[0].style.filter = `invert(${invertNum})`
    this.moreEnv.getElementsByTagName('img')[0].style.filter = `invert(${invertNum})`
    this.websiteIcon.style.filter = `invert(${invertNum})`

    const switchToPreviousVersion = () => {
      const query = new QueryParams()
      query.update({ appVersion: '0.7.7' })
      _paq.push(['trackEvent', 'LoadingType', 'oldExperience_0.7.7'])
      document.location.reload()
    }

    const migrate = async () => {
      try {
        setTimeout(() => {
          tooltip('migrating workspace...')
        }, 500)
        const workspaceName = await migrateToWorkspace(this.fileManager, this.filePanel)
        tooltip('done. ' + workspaceName + ' created.')
      } catch (e) {
        setTimeout(() => {
          tooltip(e.message)
        }, 1000)
      }
    }
    const onAcceptDownloadn = async () => {
      await downloadFiles()
      const el = document.getElementById('modal-dialog')
      el.parentElement.removeChild(el)
      migrate()
    }

    const onDownload = () => {
      const el = document.getElementById('modal-dialog')
      el.parentElement.removeChild(el)
      migrate()
    }

    const onCancel = () => {
      const el = document.getElementById('modal-dialog')
      el.parentElement.removeChild(el)
    }

    const migrateWorkspace = async () => {
      modalDialog(
        'File system Migration',
        yo`
          <span>Do you want to download your files to local device first?</span>
          <div class="d-flex justify-content-around pt-3 mt-3 border-top">
            <button class="btn btn-sm btn-primary" onclick=${async () => onAcceptDownloadn()}>Download and Migrate</button>
            <button class="btn btn-sm btn-secondary ${css.migrationBtn}" onclick=${() => onDownload()}>Migrate</button>
            <button class="btn btn-sm btn-secondary ${css.migrationBtn}" onclick=${() => onCancel()}>Cancel</button>
          </div>
        `,
        {
          label: '',
          fn: null
        },
        {
          label: '',
          fn: null
        }
      )
    }

    const img = yo`<img class="m-4 ${css.logoImg}" src="assets/img/guitarRemiCroped.webp" onclick="${() => playRemi()}"></img>`
    const playRemi = async () => { await document.getElementById('remiAudio').play() }
    // to retrieve medium posts
    document.body.appendChild(yo`<script src="https://www.twilik.com/assets/retainable/rss-embed/retainable-rss-embed.js"></script>`)
    const container = yo`
      <div class="${css.homeContainer} d-flex" data-id="landingPageHomeContainer">
        <div class="${css.mainContent} bg-light">
          <div class="d-flex justify-content-between">
            <div class="d-flex flex-column">
              <div class="border-bottom d-flex justify-content-between clearfix py-3 mb-4">
                <div class="mx-4 w-100 d-flex">
                  ${img}
                  <audio id="remiAudio" muted=false src="assets/audio/remiGuitar-single-power-chord-A-minor.wav"></audio>
                  <div class="w-80 pl-5 ml-5">
                    <h5 class="mb-1">Quicklinks</h5>
                    <a class="${css.text} mr-1" target="__blank" href="https://medium.com/remix-ide/migrating-files-to-workspaces-8e34737c751c?source=friends_link&sk=b75cfd9093aa23c78be13cce49e4a5e8">Guide </a>for migrating the old File System
                    <p class="font-weight-bold mb-0 py-1">Migration tools:</p>
                    <li class="pl-1">
                      <spam class="pl-0">
                        <u class="${css.text} pr-1" onclick=${() => migrateWorkspace()}>Basic migration</u>
                      </spam>
                    </li>
                    <li class="pl-1">
                      <u class="${css.text} pr-1" onclick=${() => downloadFiles()}>Download all Files</u>
                      as a backup zip
                    </li>
                    <li class="pl-1">
                      <u class="${css.text} pr-1" onclick=${() => startRestoreBackupZip()}>Restore files</u>from backup zip
                     </li>
                    <p class="font-weight-bold mb-0 mt-2">Help:</p>
                    <dir class="d-flex flex-column mt-1 pl-0">
                      <a class="${css.text} mx-1" target="__blank" href="https://gitter.im/ethereum/remix">Gitter channel</a>
                      <a class="${css.text} mx-1" target="__blank" href="https://github.com/ethereum/remix-project/issues">Report on Github</a>
                    </dir>
                  </div>
                </div>
              </div>
              <div class="row ${css.hpSections} mx-4" data-id="landingPageHpSections">
                <div class="ml-3">
                  <div class="plugins mb-5">
                    <h4>Featured Plugins</h4>
                    <div class="d-flex flex-row pt-2">
                      ${this.solEnv}
                      ${this.optimismEnv}
                      ${this.learnEthEnv}
                      ${this.solhintEnv}
                      ${this.sourcifyEnv}                      
                      ${this.moreEnv}
                    </div>
                  </div>
                  <div class="d-flex">
                    <div class="file">
                      <h4>File</h4>
                      <p class="mb-1">
                        <i class="mr-1 far fa-file"></i>
                        <span class="ml-1 mb-1 ${css.text}" onclick=${() => createNewFile()}>New File</span>
                      </p>
                      <p class="mb-1">
                        <i class="mr-1 far fa-file-alt"></i>
                        <label class="ml-1 ${css.labelIt} ${css.bigLabelSize} ${css.text}">
                          Open Files
                          <input title="open file" type="file" onchange="${(event) => {
                            event.stopPropagation()
                            uploadFile(event.target)
                          }
                        }" multiple />
                        </label>
                      </p>
                      <p class="mb-1">
                        <i class="far fa-hdd"></i>
                        <span class="ml-1 ${css.text}" onclick=${() => connectToLocalhost()}>Connect to Localhost</span>
                      </p>
                      <p class="mt-3 mb-0"><label>LOAD FROM:</label></p>
                      <div class="btn-group">
                        <button class="btn mr-1 btn-secondary" data-id="landingPageImportFromGistButton" onclick="${() => importFromGist()}">Gist</button>
                        <button class="btn mx-1 btn-secondary" onclick="${() => load('Github', 'github URL', ['https://github.com/0xcert/ethereum-erc721/src/contracts/tokens/nf-token-metadata.sol', 'https://github.com/OpenZeppelin/openzeppelin-solidity/blob/67bca857eedf99bf44a4b6a0fc5b5ed553135316/contracts/access/Roles.sol'])}">GitHub</button>
                        <button class="btn mx-1 btn-secondary" onclick="${() => load('Ipfs', 'ipfs URL', ['ipfs://<ipfs-hash>'])}">Ipfs(Crust)</button>
                        <button class="btn mx-1 btn-secondary" onclick="${() => load('Https', 'http/https raw content', ['https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/contracts/token/ERC20/ERC20.sol'])}">https</button>
                      </div><!-- end of btn-group -->
                    </div><!-- end of div.file -->
                    <div class="ml-4 pl-4">
                      <h4>Resources</h4>
                      <p class="mb-1">
                        <i class="mr-1 fas fa-book"></i>
                        <a class="${css.text}" target="__blank" href="https://remix-ide.readthedocs.io/en/latest/#">Documentation</a>
                      </p>
                      <p class="mb-1">
                        <i class="mr-1 fab fa-gitter"></i>
                        <a class="${css.text}" target="__blank" href="https://gitter.im/ethereum/remix">Gitter channel</a>
                      </p>
                      <p class="mb-1">
                        ${this.websiteIcon}
                        <a class="${css.text}" target="__blank" href="https://remix-project.org">Featuring website</a>
                      </p>
                      <p class="mb-1">
                        <i class="fab fa-ethereum ${css.image}"></i>
                        <span class="${css.text}" onclick=${() => switchToPreviousVersion()}>Old experience</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div><!-- end of hpSections -->
            </div>
            <div class="d-flex flex-column ${css.rightPanel}">
              <div class="d-flex pr-3 py-2 align-self-end"  id="remixIDEMediaPanelsTitle">
                ${this.badgeTwitter}
                ${this.badgeMedium}
              </div>
              <div class="mr-3 d-flex bg-light ${css.panels}" id="remixIDEMediaPanels">
                ${this.mediumPanel}
                ${this.twitterPanel}
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    return container
  }
}
