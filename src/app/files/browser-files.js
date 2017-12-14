'use strict'

var EventManager = require('remix-lib').EventManager

function Files (storage) {
  var event = new EventManager()
  this.event = event
  var readonly = {}
  this.type = 'browser'
  this.filesTree = null

  this.exists = function (path) {
    var unprefixedpath = this.removePrefix(path)
    // NOTE: ignore the config file
    if (path === '.remix.config') {
      return false
    }

    return this.isReadOnly(unprefixedpath) || storage.exists(unprefixedpath)
  }

  this.init = function (cb) {
    listAsTree(this, this.list(), (error, tree) => {
      this.filesTree = tree
      if (cb) cb(error)
    })
  }

  this.get = function (path, cb) {
    var unprefixedpath = this.removePrefix(path)
    // NOTE: ignore the config file
    if (path === '.remix.config') {
      return null
    }

    var content = readonly[unprefixedpath] || storage.get(unprefixedpath)
    if (cb) {
      cb(null, content)
    }
    return content
  }

  this.set = function (path, content) {
    var unprefixedpath = this.removePrefix(path)
    // NOTE: ignore the config file
    if (path === '.remix.config') {
      return false
    }

    if (!this.isReadOnly(unprefixedpath)) {
      var exists = storage.exists(unprefixedpath)
      if (!storage.set(unprefixedpath, content)) {
        return false
      }
      if (!exists) {
        this.init()
        event.trigger('fileAdded', [this.type + '/' + unprefixedpath, false])
      } else {
        event.trigger('fileChanged', [this.type + '/' + unprefixedpath])
      }
      return true
    }

    return false
  }

  this.addReadOnly = function (path, content) {
    var unprefixedpath = this.removePrefix(path)
    if (!storage.exists(unprefixedpath)) {
      readonly[unprefixedpath] = content
      this.init()
      event.trigger('fileAdded', [this.type + '/' + unprefixedpath, true])
      return true
    }

    return false
  }

  this.isReadOnly = function (path) {
    path = this.removePrefix(path)
    return readonly[path] !== undefined
  }

  this.remove = function (path) {
    var unprefixedpath = this.removePrefix(path)
    if (!this.exists(unprefixedpath)) {
      return false
    }

    if (this.isReadOnly(unprefixedpath)) {
      readonly[unprefixedpath] = undefined
    } else {
      if (!storage.remove(unprefixedpath)) {
        return false
      }
    }
    this.init()
    event.trigger('fileRemoved', [this.type + '/' + unprefixedpath])
    return true
  }

  this.rename = function (oldPath, newPath, isFolder) {
    var unprefixedoldPath = this.removePrefix(oldPath)
    var unprefixednewPath = this.removePrefix(newPath)
    if (!this.isReadOnly(unprefixedoldPath) && storage.exists(unprefixedoldPath)) {
      if (!storage.rename(unprefixedoldPath, unprefixednewPath)) {
        return false
      }
      this.init()
      event.trigger('fileRenamed', [this.type + '/' + unprefixedoldPath, this.type + '/' + unprefixednewPath, isFolder])
      return true
    }
    return false
  }

  this.list = function () {
    var files = {}

    // add r/w files to the list
    storage.keys().forEach((path) => {
      // NOTE: as a temporary measure do not show the config file
      if (path !== '.remix.config') {
        files[this.type + '/' + path] = false
      }
    })

    // add r/o files to the list
    Object.keys(readonly).forEach((path) => {
      files[this.type + '/' + path] = true
    })

    return files
  }

  this.removePrefix = function (path) {
    return path.indexOf(this.type + '/') === 0 ? path.replace(this.type + '/', '') : path
  }

  //
  // Tree model for files
  // {
  //   'a': { }, // empty directory 'a'
  //   'b': {
  //     'c': {}, // empty directory 'b/c'
  //     'd': { '/readonly': true, '/content': 'Hello World' } // files 'b/c/d'
  //     'e': { '/readonly': false, '/path': 'b/c/d' } // symlink to 'b/c/d'
  //     'f': { '/readonly': false, '/content': '<executable>', '/mode': 0755 }
  //   }
  // }
  //
  this.listAsTree = function (path, level) {
    var nodes = path ? path.split('/') : []
    var tree = this.filesTree
    try {
      while (nodes.length) {
        var key = nodes.shift()
        if (key) tree = tree[key]
      }
    } catch (e) {
      tree = {}
    }
    if (level) {
      var leveltree = {}
      build(tree, level, leveltree)
      tree = leveltree
    }
    return tree
  }

  // rename .browser-solidity.json to .remix.config
  if (this.exists('.browser-solidity.json')) {
    this.rename('.browser-solidity.json', '.remix.config')
  }

  this.init()
}

module.exports = Files


function build (tree, level, leveltree) {
  if (!level) return
  Object.keys(tree).forEach(key => {
    var value = tree[key]
    var more = value === Object(value)
    if (more) {
      leveltree[key] = {}
      build(value, level - 1, leveltree[key])
    } else leveltree[key] = value
  })
}

function listAsTree (self, filesList, callback) {
  function hashmapize (obj, path, val) {
    var nodes = path.split('/')
    var i = 0

    for (; i < nodes.length - 1; i++) {
      var node = nodes[i]
      if (obj[node] === undefined) {
        obj[node] = {}
      }
      obj = obj[node]
    }

    obj[nodes[i]] = val
  }

  var tree = {}

  // This does not include '.remix.config', because it is filtered
  // inside list().
  Object.keys(filesList).forEach(function (path) {
    hashmapize(tree, path, {
      '/readonly': self.isReadOnly(path),
      '/content': self.get(path)
    })
  })
  callback(null, tree)
}
