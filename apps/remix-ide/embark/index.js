const httpServer = require('http-server')
const remixd = require('remixd')
const path = require('path')
const merge = require('merge')
const colors = require('colors')

const DEFAULT_OPTIONS = {
  protocol: 'http',
  host: 'localhost',
  port: '8088'
}

module.exports = (embark) => {
  // plugin options
  const readOnly = embark.pluginConfig.readOnly || false
  const { protocol, host, port } = merge.recursive(DEFAULT_OPTIONS, embark.pluginConfig.remixIde)

  // globals
  const remixIdeUrl = `${protocol}://${host}` + `${port ? `:${port}` : ''}`
  const sharedFolder = path.join(__dirname, '../../')
  const sharedFolderService = remixd.services.sharedFolder
  let server

  // setup HTTP server
  if (['localhost', '127.0.0.1', '0.0.0.0'].includes(host)) {
    server = httpServer.createServer({
      root: path.join(__dirname, '../../node_modules/remix-ide')
    })
    server.listen(port, '127.0.0.1', function () {
      embark.logger.info('Remix IDE (via embark-remix plugin) available at ' + colors.underline(remixIdeUrl))
    })
  } else {
    embark.logger.info('embark-remix is set to connect to a Remix IDE at ' + colors.underline(remixIdeUrl))
  }

  // setup Embark service check
  embark.registerServiceCheck('Remix IDE', (cb) => {
    return cb({ name: `Remix IDE ${host}:${port}`, status: 'on' })
  })

  // setup remixd shared folder service
  const sharedFolderRouter = new remixd.Websocket(65520, sharedFolderService, { remixIdeUrl }, (webSocket) => {
    sharedFolderService.setWebSocket(webSocket)
    sharedFolderService.setupNotifications(sharedFolder)
    sharedFolderService.sharedFolder(sharedFolder, readOnly)
  })
  const killRemixD = sharedFolderRouter.start()
  const kill = () => {
    if (server) server.close()
    embark.logger.info(colors.red('embark-remix stopped'))
    process.exit()
  }

  if (process.platform === 'win32') {
    require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    }).on('SIGINT', function () {
      process.emit('SIGINT')
    })
  }

  process.on('SIGINT', kill) // catch ctrl-c
  process.on('SIGTERM', kill) // catch kill
  process.on('exit', killRemixD)
}
