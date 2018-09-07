'use strict'
var executionContext = require('../../execution-context')

/*
  Defines available API. `key` / `type`
*/
module.exports = (pluginManager, fileProviders, fileManager, compiler, udapp) => {
  return {
    app: {
      getExecutionContextProvider: (mod, cb) => {
        cb(null, executionContext.getProvider())
      },
      updateTitle: (mod, title, cb) => {
        pluginManager.plugins[mod].modal.setTitle(title)
        if (cb) cb()
      },
      detectNetWork: (mod, cb) => {
        executionContext.detectNetwork((error, network) => {
          cb(error, network)
        })
      }
    },
    config: {
      setConfig: (mod, path, content, cb) => {
        fileProviders['config'].set(mod + '/' + path, content)
        cb()
      },
      getConfig: (mod, path, cb) => {
        cb(null, fileProviders['config'].get(mod + '/' + path))
      },
      removeConfig: (mod, path, cb) => {
        cb(null, fileProviders['config'].remove(mod + '/' + path))
        if (cb) cb()
      }
    },
    compiler: {
      getCompilationResult: (mod, cb) => {
        cb(null, compiler.lastCompilationResult)
      }
    },
    udapp: {
      runTx: (mod, tx, cb) => {
        if (executionContext.getProvider() !== 'vm') return cb('plugin API does not allow sending a transaction through a web3 connection. Only vm mode is allowed')
        udapp.silentRunTx(tx, (error, result) => {
          if (error) return cb(error)
          cb(null, {
            transactionHash: result.transactionHash,
            status: result.result.status,
            gasUsed: '0x' + result.result.gasUsed.toString('hex'),
            error: result.result.vm.exceptionError,
            return: result.result.vm.return ? '0x' + result.result.vm.return.toString('hex') : '0x',
            createdAddress: result.result.createdAddress ? '0x' + result.result.createdAddress.toString('hex') : undefined
          })
        })
      },
      getAccounts: (mod, cb) => {
        if (executionContext.getProvider() !== 'vm') return cb('plugin API does not allow retrieving accounts through a web3 connection. Only vm mode is allowed')
        udapp.getAccounts(cb)
      },
      createVMAccount: (mod, privateKey, balance, cb) => {
        if (executionContext.getProvider() !== 'vm') return cb('plugin API does not allow creating a new account through web3 connection. Only vm mode is allowed')
        udapp.createVMAccount(privateKey, balance, (error, address) => {
          cb(error, address)
        })
      }
    },
    editor: {
      getCurrentFile: (mod, cb) => {
        var path = fileManager.currentPath()
        if (!path) {
          cb('no file selected')
        } else {
          this.getFile(mod, path, cb)
        }
      },
      getFile: (mod, path, cb) => {
        var provider = fileManager.fileProviderOf(path)
        if (provider) {
          provider.get(mod + '/' + path, (error, content) => {
            cb(error, content)
          })
        } else {
          cb(path + 'not available')
        }
      },
      setFile: (mod, path, content, cb) => {
        var provider = fileManager.fileProviderOf(path)
        if (provider) {
          provider.set(mod + '/' + path, content, (error) => {
            cb(error)
          })
        } else {
          cb(path + 'not available')
        }
      }
    }
  }
}
