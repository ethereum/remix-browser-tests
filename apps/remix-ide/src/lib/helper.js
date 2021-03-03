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
    if (data.length < 5) return data
    var len = data.length
    return data.slice(0, 5) + '...' + data.slice(len - 5, len)
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
        fileProvider.exists(name + counter + prefix + '.' + ext, (error, currentExist) => {
          if (error) {
            callback(error)
          } else {
            exist = currentExist
            if (exist) counter = (counter | 0) + 1
            callback()
          }
        })
      },
      (error) => { cb(error, name + counter + prefix + '.' + ext) }
    )
  },
  createNonClashingName (name, fileProvider, cb) {
    this.createNonClashingNameWithPrefix(name, fileProvider, '', cb)
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
