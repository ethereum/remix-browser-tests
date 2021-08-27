var async = require('async')
const ethJSUtil = require('ethereumjs-util')

module.exports = {
  shortenAddress: function (address, etherBalance) {
    var len = address.length
    return address.slice(0, 5) + '...' + address.slice(len - 5, len) + (etherBalance ? ' (' + etherBalance.toString() + ' ether)' : '')
  },
  addressToString: function (address) {
    if (!address) return null
    if (typeof address !== 'string') {
      address = address.toString('hex')
    }
    if (address.indexOf('0x') === -1) {
      address = '0x' + address
    }
    return ethJSUtil.toChecksumAddress(address)
  },
  shortenHexData: function (data) {
    if (!data) return ''
    var sliceLen = 5
    var len = data.length
    if (len < sliceLen * 2) return data
    return data.slice(0, sliceLen) + '...' + data.slice(len - sliceLen, len)
  },
  createNonClashingNameWithPrefix (name, fileProvider, prefix, cb) {
    if (!name) name = 'Undefined'
    var counter = ''
    var ext = 'sol'
    var reg = /(.*)\.([^.]+)/g
    var split = reg.exec(name)
    if (split) {
      name = split[1]
      ext = split[2]
    }
    var exist = true
    async.whilst(
      () => { return exist },
      (callback) => {
        fileProvider.exists(name + counter + prefix + '.' + ext).then(currentExist => {
          exist = currentExist
          if (exist) counter = (counter | 0) + 1
          callback()
        }).catch(error => {
          if (error) console.log(error)
        })
      },
      (error) => { cb(error, name + counter + prefix + '.' + ext) }
    )
  },
  createNonClashingName (name, fileProvider, cb) {
    this.createNonClashingNameWithPrefix(name, fileProvider, '', cb)
  },
  async createNonClashingNameAsync (name, fileManager, prefix = '') {
    if (!name) name = 'Undefined'
    let counter = ''
    let ext = 'sol'
    const reg = /(.*)\.([^.]+)/g
    const split = reg.exec(name)
    if (split) {
      name = split[1]
      ext = split[2]
    }
    let exist = true

    do {
      const isDuplicate = await fileManager.exists(name + counter + prefix + '.' + ext)

      if (isDuplicate) counter = (counter | 0) + 1
      else exist = false
    } while (exist)

    return name + counter + prefix + '.' + ext
  },
  async createNonClashingDirNameAsync (name, fileManager) {
    if (!name) name = 'Undefined'
    let counter = ''
    let exist = true

    do {
      const isDuplicate = await fileManager.exists(name + counter)

      if (isDuplicate) counter = (counter | 0) + 1
      else exist = false
    } while (exist)

    return name + counter
  },
  checkSpecialChars (name) {
    return name.match(/[:*?"<>\\'|]/) != null
  },
  checkSlash (name) {
    return name.match(/\//) != null
  },
  isHexadecimal (value) {
    return /^[0-9a-fA-F]+$/.test(value) && (value.length % 2 === 0)
  },
  is0XPrefixed (value) {
    return value.substr(0, 2) === '0x'
  },
  isNumeric (value) {
    return /^\+?(0|[1-9]\d*)$/.test(value)
  },
  isValidHash (hash) { // 0x prefixed, hexadecimal, 64digit
    const hexValue = hash.slice(2, hash.length)
    return this.is0XPrefixed(hash) && /^[0-9a-fA-F]{64}$/.test(hexValue)
  },
  removeTrailingSlashes (text) {
    // Remove single or consecutive trailing slashes
    return text.replace(/\/+$/g, '')
  },
  removeMultipleSlashes (text) {
    // Replace consecutive slashes with '/'
    return text.replace(/\/+/g, '/')
  },
  find: find,
  getPathIcon (path) {
    return path.endsWith('.txt')
      ? 'far fa-file-alt' : path.endsWith('.md')
        ? 'far fa-file-alt' : path.endsWith('.sol')
          ? 'fak fa-solidity-mono' : path.endsWith('.js')
            ? 'fab fa-js' : path.endsWith('.json')
              ? 'fas fa-brackets-curly' : path.endsWith('.vy')
                ? 'fak fa-vyper-mono' : path.endsWith('.lex')
                  ? 'fak fa-lexon' : path.endsWith('.contract')
                    ? 'fab fa-ethereum' : 'far fa-file'
  },
  joinPath (...paths) {
    paths = paths.filter((value) => value !== '').map((path) => path.replace(/^\/|\/$/g, '')) // remove first and last slash)
    if (paths.length === 1) return paths[0]
    return paths.join('/')
  },
  extractNameFromKey (key) {
    const keyPath = key.split('/')

    return keyPath[keyPath.length - 1]
  }
}

function findDeep (object, fn, found = { break: false, value: undefined }) {
  if (typeof object !== 'object' || object === null) return
  for (var i in object) {
    if (found.break) break
    var el = object[i]
    if (el && el.innerText !== undefined && el.innerText !== null) el = el.innerText
    if (fn(el, i, object)) {
      found.value = el
      found.break = true
      break
    } else {
      findDeep(el, fn, found)
    }
  }
  return found.value
}

function find (args, query) {
  query = query.trim()
  var isMatch = !!findDeep(args, function check (value, key) {
    if (value === undefined || value === null) return false
    if (typeof value === 'function') return false
    if (typeof value === 'object') return false
    var contains = String(value).indexOf(query.trim()) !== -1
    return contains
  })
  return isMatch
}
