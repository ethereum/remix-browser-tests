// eslint-disable-next-line no-unused-vars
import axios, { AxiosResponse } from 'axios'
import semver from 'semver'
import { BzzNode as Bzz } from '@erebos/bzz-node'

export interface Imported {
  content: string;
  cleanUrl: string;
  type: string;
}

interface PreviouslyHandledImports {
  [filePath: string]: Imported
}

interface Handler {
  type: string;
  match(url: string): any;
  handle(match: any): any;
}

interface HandlerResponse {
  content: any;
  cleanUrl: string
}

export type getPackages = () => Promise<{ [name: string]: string }>

export class RemixURLResolver {
  private previouslyHandled: PreviouslyHandledImports
  gistAccessToken: string
  protocol: string
  getDependencies: getPackages

  constructor (getDependencies?: getPackages, gistToken?: string, protocol = 'http:') {
    this.previouslyHandled = {}
    this.getDependencies = getDependencies
    this.setGistToken(gistToken, protocol)
  }

  async setGistToken (gistToken?: string, protocol = 'http:') {
    this.gistAccessToken = gistToken || ''
    this.protocol = protocol
  }

  clearCache () {
    this.previouslyHandled = {}
  }

  /**
  * Handle an import statement based on github
  * @param root The root of the github import statement
  * @param filePath path of the file in github
  */
  async handleGithubCall(root: string, filePath: string): Promise<HandlerResponse> {
    const regex = filePath.match(/blob\/([^/]+)\/(.*)/)
    let reference = 'master'
    if (regex) {
      // if we have /blob/master/+path we extract the branch name "master" and add it as a parameter to the github api
      // the ref can be branch name, tag, commit id
      reference = regex[1]
      filePath = filePath.replace(`blob/${reference}/`, '')
    }
    // eslint-disable-next-line no-useless-catch
    try {
      const req = `https://raw.githubusercontent.com/${root}/${reference}/${filePath}`
      const response: AxiosResponse = await axios.get(req, { transformResponse: []})
      return { content: response.data, cleanUrl: root + '/' + filePath }
    } catch (e) {
      throw e
    }
  }

  /**
  * Handle an import statement based on http
  * @param url The url of the import statement
  * @param cleanUrl
  */
  async handleHttp(url: string, cleanUrl: string): Promise<HandlerResponse> {
    // eslint-disable-next-line no-useless-catch
    try {
      const response: AxiosResponse = await axios.get(url, { transformResponse: []})
      return { content: response.data, cleanUrl }
    } catch (e) {
      throw e
    }
  }

  /**
  * Handle an import statement based on https
  * @param url The url of the import statement
  * @param cleanUrl
  */
  async handleHttps(url: string, cleanUrl: string): Promise<HandlerResponse> {
    // eslint-disable-next-line no-useless-catch
    try {
      const response: AxiosResponse = await axios.get(url, { transformResponse: []})
      return { content: response.data, cleanUrl }
    } catch (e) {
      throw e
    }
  }

  async handleSwarm(url: string, cleanUrl: string): Promise<HandlerResponse> {
    // eslint-disable-next-line no-useless-catch
    try {
      const bzz = new Bzz({ url: this.protocol + '//swarm-gateways.net' })
      const swarmUrl = bzz.getDownloadURL(cleanUrl, { mode: 'raw' }) // variable name changed
      const response: AxiosResponse = await axios.get(swarmUrl, { transformResponse: []})
      return { content: response.data, cleanUrl }
    } catch (e) {
      throw e
    }
  }

  /**
  * Handle an import statement based on IPFS
  * @param url The url of the IPFS import statement
  */
  async handleIPFS(url: string): Promise<HandlerResponse> {
    // replace ipfs:// with /ipfs/
    url = url.replace(/^ipfs:\/\/?/, 'ipfs/')
    // eslint-disable-next-line no-useless-catch
    try {
      const req = 'https://jqgt.remixproject.org/' + url
      // If you don't find greeter.sol on ipfs gateway use local
      // const req = 'http://localhost:8080/' + url
      const response: AxiosResponse = await axios.get(req, { transformResponse: []})
      return { content: response.data, cleanUrl: url.replace('ipfs/', '') }
    } catch (e) {
      throw e
    }
  }

  /**
  * Handle an import statement based on NPM
  * @param url The url of the NPM import statement
  */

  async handleNpmImport(url: string): Promise<HandlerResponse> {
    if (!url) throw new Error('url is empty')
    let fetchUrl = url
    const isVersionned = semverRegex().exec(url.replace(/@/g, '@ ').replace(/\//g, ' /'))
    if (this.getDependencies && !isVersionned) {
      try {
        const { deps, yarnLock, packageLock } = await this.getDependencies()
        let matchLength = 0
        let pkg
        if (deps) {
          Object.keys(deps).map((dep) => {
            const reg = new RegExp(dep + '/', 'g')
            const match = url.match(reg)
            if (match && match.length > 0 && matchLength < match[0].length) {
              matchLength = match[0].length
              pkg = dep
            }
          })
          if (pkg) {
            let version
            if (yarnLock) {
              // yarn.lock
              const regex = new RegExp(`"${pkg}@(.*)"`, 'g')
              const yarnVersion = regex.exec(yarnLock)
              if (yarnVersion && yarnVersion.length > 1) {
                version = yarnVersion[1]
              }
            }
            if (!version && packageLock && packageLock['dependencies'] && packageLock['dependencies'][pkg] && packageLock['dependencies'][pkg]['version']) {
              // package-lock.json
              version = packageLock['dependencies'][pkg]['version']
            }
            if (!version) {
              // package.json
              version = deps[pkg]
            }
            if (version) {
              // If the entry is pointing to a github repo, redirect to correct handler instead of continuing
              if (version.startsWith("github:")) {
                const [, repo, tag] = version.match(/github:([^#]+)#(.+)/);
                const filePath = url.replace(/^[^/]+\//, '');
                return this.handleGithubCall(repo, `blob/${tag}/${filePath}`);
              }
              const versionSemver = semver.minVersion(version)
              fetchUrl = url.replace(pkg, `${pkg}@${versionSemver.version}`)
            }
          }
        }
      } catch (e) {
        console.log(e)
      }
    }

    const npm_urls = ["https://cdn.jsdelivr.net/npm/", "https://unpkg.com/"]
    process && process.env && process.env['NX_NPM_URL'] && npm_urls.unshift(process.env['NX_NPM_URL'])
    let content = null
    // get response from all urls
    for (let i = 0; i < npm_urls.length; i++) {
      try {
        const req = npm_urls[i] + fetchUrl
        const response: AxiosResponse = await axios.get(req, { transformResponse: []})
        content = response.data
        break
      } catch (e) {
        // try next url
      }

    }
    if (!content) throw new Error('Unable to load ' + url)
    return { content, cleanUrl: url }
  }

  getHandlers (): Handler[] {
    return [
      {
        type: 'github',
        match: (url) => { return /^(https?:\/\/)?(www.)?github.com\/([^/]*\/[^/]*)\/(.*)/.exec(url) },
        handle: (match) => this.handleGithubCall(match[3], match[4])
      },
      {
        type: 'http',
        match: (url) => { return /^(http?:\/\/?(.*))$/.exec(url) },
        handle: (match) => this.handleHttp(match[1], match[2])
      },
      {
        type: 'https',
        match: (url) => { return /^(https?:\/\/?(.*))$/.exec(url) },
        handle: (match) => this.handleHttps(match[1], match[2])
      },
      {
        type: 'swarm',
        match: (url) => { return /^(bzz-raw?:\/\/?(.*))$/.exec(url) },
        handle: (match) => this.handleSwarm(match[1], match[2])
      },
      {
        type: 'ipfs',
        match: (url) => { return /^(ipfs:\/\/?.+)/.exec(url) },
        handle: (match) => this.handleIPFS(match[1])
      },
      {
        type: 'npm',
        match: (url) => { return /^[^/][^\n"?:*<>|]*$/g.exec(url) }, // match a typical relative path
        handle: (match) => this.handleNpmImport(match[0])
      }
    ]
  }

  public async resolve (filePath: string, customHandlers?: Handler[], force?: boolean): Promise<Imported> {
    let imported: Imported = this.previouslyHandled[filePath]
    if (!force && imported) {
      return imported
    }
    const builtinHandlers: Handler[] = this.getHandlers()
    const handlers: Handler[] = customHandlers ? [...builtinHandlers, ...customHandlers] : [...builtinHandlers]
    const matchedHandler = handlers.filter(handler => handler.match(filePath))
    const handler: Handler = matchedHandler[0]
    const match = handler.match(filePath)
    const { content, cleanUrl } = await handler.handle(match)
    imported = {
      content,
      cleanUrl: cleanUrl || filePath,
      type: handler.type
    }
    this.previouslyHandled[filePath] = imported
    return imported
  }
}

// see npm semver-regex
function semverRegex() {
  return /(?<=^v?|\sv?)(?:(?:0|[1-9]\d{0,9}?)\.){2}(?:0|[1-9]\d{0,9})(?:-(?:--+)?(?:0|[1-9]\d*|\d*[a-z]+\d*)){0,100}(?=$| |\+|\.)(?:(?<=-\S+)(?:\.(?:--?|[\da-z-]*[a-z-]\d*|0|[1-9]\d*)){1,100}?)?(?!\.)(?:\+(?:[\da-z]\.?-?){1,100}?(?!\w))?(?!\+)/gi;
}
