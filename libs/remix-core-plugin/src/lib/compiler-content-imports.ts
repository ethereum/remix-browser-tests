'use strict'
import { Plugin } from '@remixproject/engine'
import { RemixURLResolver } from '@remix-project/remix-url-resolver'
const remixTests = require('@remix-project/remix-tests')

const profile = {
  name: 'contentImport',
  displayName: 'content import',
  version: '0.0.1',
  methods: ['resolve', 'resolveAndSave', 'isExternalUrl']
}

export class CompilerImports extends Plugin {
  previouslyHandled: {}
  urlResolver: any
  constructor () {
    super(profile)
    this.urlResolver = new RemixURLResolver()
    this.previouslyHandled = {} // cache import so we don't make the request at each compilation.
  }

  async setToken () {
    try {
      const protocol = typeof window !== 'undefined' && window.location.protocol
      const token = await this.call('settings', 'get', 'settings/gist-access-token')

      this.urlResolver.setGistToken(token, protocol)
    } catch (error) {
      console.log(error)
    }
  }

  isRelativeImport (url) {
    return /^([^/]+)/.exec(url)
  }

  isExternalUrl (url) {
    const handlers = this.urlResolver.getHandlers()
    return handlers.some(handler => handler.match(url))
  }

  /**
    * resolve the content of @arg url. This only resolves external URLs.
    *
    * @param {String} url  - external URL of the content. can be basically anything like raw HTTP, ipfs URL, github address etc...
    * @returns {Promise} - { content, cleanUrl, type, url }
    */
  resolve (url) {
    return new Promise((resolve, reject) => {
      this.import(url, null, (error, content, cleanUrl, type, url) => {
        if (error) return reject(error)
        resolve({ content, cleanUrl, type, url })
      }, null)
    })
  }

  async import (url, force, loadingCb, cb) {
    if (typeof force !== 'boolean') {
      const temp = loadingCb
      loadingCb = force
      cb = temp
      force = false
    }
    if (!loadingCb) loadingCb = () => {}
    if (!cb) cb = () => {}

    var self = this
    if (force) delete this.previouslyHandled[url]
    var imported = this.previouslyHandled[url]
    if (imported) {
      return cb(null, imported.content, imported.cleanUrl, imported.type, url)
    }

    let resolved
    try {
      await this.setToken()
      resolved = await this.urlResolver.resolve(url)
      const { content, cleanUrl, type } = resolved
      self.previouslyHandled[url] = {
        content,
        cleanUrl,
        type
      }
      cb(null, content, cleanUrl, type, url)
    } catch (e) {
      return cb(new Error('not found ' + url))
    }
  }

  importExternal (url, targetPath) {
    return new Promise((resolve, reject) => {
      this.import(url,
        // TODO: handle this event
        (loadingMsg) => { this.emit('message', loadingMsg) },
        async (error, content, cleanUrl, type, url) => {
          if (error) return reject(error)
          try {
            const provider = await this.call('fileManager', 'getProviderOf', null)
            const path = targetPath || type + '/' + cleanUrl
            if (provider) provider.addExternal('.deps/' + path, content, url)
          } catch (err) {
            console.error(err)
          }
          resolve(content)
        }, null)
    })
  }

  /**
    * import the content of @arg url.
    * first look in the browser localstorage (browser explorer) or locahost explorer. if the url start with `browser/*` or  `localhost/*`
    * then check if the @arg url is located in the localhost, in the node_modules or installed_contracts folder
    * then check if the @arg url match any external url
    *
    * @param {String} url - URL of the content. can be basically anything like file located in the browser explorer, in the localhost explorer, raw HTTP, github address etc...
    * @param {String} targetPath - (optional) internal path where the content should be saved to
    * @returns {Promise} - string content
    */
  async resolveAndSave (url, targetPath) {
    if (url.indexOf('remix_tests.sol') !== -1) return remixTests.assertLibCode
    try {
      const provider = await this.call('fileManager', 'getProviderOf', url)
      if (provider) {
        if (provider.type === 'localhost' && !provider.isConnected()) {
          throw new Error(`file provider ${provider.type} not available while trying to resolve ${url}`)
        }
        const exist = await provider.exists(url)
        /*
          if the path is absolute and the file does not exist, we can stop here
          Doesn't make sense to try to resolve "localhost/node_modules/localhost/node_modules/<path>" and we'll end in an infinite loop.
        */
        if (!exist && url.startsWith('browser/')) throw new Error(`not found ${url}`)
        if (!exist && url.startsWith('localhost/')) throw new Error(`not found ${url}`)

        if (exist) {
          const content = await (() => {
            return new Promise((resolve, reject) => {
              provider.get(url, (error, content) => {
                if (error) return reject(error)
                resolve(content)
              })
            })
          })()
          return content
        } else {
          const localhostProvider = await this.call('fileManager', 'getProviderByName', 'localhost')
          if (localhostProvider.isConnected()) {
            const splitted = /([^/]+)\/(.*)$/g.exec(url)

            const possiblePaths = ['localhost/installed_contracts/' + url]
            if (splitted) possiblePaths.push('localhost/installed_contracts/' + splitted[1] + '/contracts/' + splitted[2])
            possiblePaths.push('localhost/node_modules/' + url)
            if (splitted) possiblePaths.push('localhost/node_modules/' + splitted[1] + '/contracts/' + splitted[2])

            for (const path of possiblePaths) {
              try {
                const content = await this.resolveAndSave(path, null)
                if (content) {
                  localhostProvider.addNormalizedName(path.replace('localhost/', ''), url)
                  return content
                }
              } catch (e) {}
            }
            return await this.importExternal(url, targetPath)
          }
          return await this.importExternal(url, targetPath)
        }
      }
    } catch (e) {
      throw new Error(`not found ${url}`)
    }
  }
}
