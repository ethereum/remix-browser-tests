import { Engine, PluginManager } from '@remixproject/engine';
import { ipcMain } from 'electron';
import { FSPlugin } from './plugins/fsPlugin';
import { app } from 'electron';
import { XtermPlugin } from './plugins/xtermPlugin';
import git from 'isomorphic-git'
import { IsoGitPlugin } from './plugins/isoGitPlugin';
import { ConfigPlugin } from './plugins/configPlugin';
import { TemplatesPlugin } from './plugins/templates';
import { RipgrepPlugin } from './plugins/ripgrepPlugin';
import { CompilerLoaderPlugin } from './plugins/compilerLoader';
import { SlitherPlugin } from './plugins/slitherPlugin';
import { AppUpdaterPlugin } from './plugins/appUpdater';

const engine = new Engine()
const appManager = new PluginManager()
const fsPlugin = new FSPlugin()
const xtermPlugin = new XtermPlugin()
const isoGitPlugin = new IsoGitPlugin()
const configPlugin = new ConfigPlugin()
const templatesPlugin = new TemplatesPlugin()
const ripgrepPlugin = new RipgrepPlugin()
const compilerLoaderPlugin = new CompilerLoaderPlugin()
const slitherPlugin = new SlitherPlugin()
const appUpdaterPlugin = new AppUpdaterPlugin()

engine.register(appManager)
engine.register(fsPlugin)
engine.register(xtermPlugin)
engine.register(isoGitPlugin)
engine.register(configPlugin)
engine.register(templatesPlugin)
engine.register(ripgrepPlugin)
engine.register(compilerLoaderPlugin)
engine.register(slitherPlugin)
engine.register(appUpdaterPlugin)

appManager.activatePlugin('electronconfig')
appManager.activatePlugin('fs')

ipcMain.handle('manager:activatePlugin', async (event, plugin) => {
  return await appManager.call(plugin, 'createClient', event.sender.id)
})

ipcMain.on('fs:openFolder', async (event, path?) => {
  fsPlugin.openFolder(event, path)
})


ipcMain.on('terminal:new', async (event) => {
  xtermPlugin.new(event)
})

ipcMain.on('template:open', async (event) => {
  templatesPlugin.openTemplate(event)
})

ipcMain.on('git:startclone', async (event) => {
  isoGitPlugin.startClone(event)
})

ipcMain.handle('getWebContentsID', (event, message) => {
  return event.sender.id
})


app.on('before-quit', async (event) => {
  await appManager.call('fs', 'removeCloseListener')
  await appManager.call('fs', 'closeWatch')
  await appManager.call('xterm', 'closeTerminals')
})
