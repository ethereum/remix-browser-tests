// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { IAppState } from './state';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', {
    startRemixd: (url: string, path: string) => ipcRenderer.invoke('startRemixd', url, path),
    stopRemixd: () => ipcRenderer.invoke('stopRemixd'),
    startWithFolder: (path: string) => ipcRenderer.invoke('startWithFolder', path),
    readCache: () => ipcRenderer.invoke('readCache'),
    setUrl: (url: string) => ipcRenderer.invoke('setUrl', url),
    exitApp: () => ipcRenderer.invoke('exitApp')
  }
);

ipcRenderer.on('message', function (evt, message) {
  window.postMessage({
    type: 'message',
    message
  }, '*');
});

ipcRenderer.on('state', function (evt, state: IAppState) {
  window.postMessage({
    type: 'state',
    state
  }, '*');
});








