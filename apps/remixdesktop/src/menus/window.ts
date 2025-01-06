import { BrowserWindow, MenuItemConstructorOptions } from 'electron';

export default (
  commandKeys: Record<string, string>,
  execCommand: (command: string, focusedWindow?: BrowserWindow) => void,
  openedWindows: BrowserWindow[]
): MenuItemConstructorOptions => {

  const submenu: MenuItemConstructorOptions[] = [
    {
      role: 'minimize',
      accelerator: commandKeys['window:minimize']
    },
    {
      type: 'separator'
    },
    {
      // It's the same thing as clicking the green traffic-light on macOS
      role: 'zoom',
      accelerator: commandKeys['window:zoom']
    },
    {
      type: 'separator'
    },
    {
      type: 'separator'
    },
    {
      role: 'front'
    },
    {
      label: 'Toggle Always on Top',
      click: (item, focusedWindow) => {
        execCommand('window:toggleKeepOnTop', focusedWindow);
      }
    },
    {
      role: 'togglefullscreen',
      accelerator: commandKeys['window:toggleFullScreen']
    },
    {
      type: 'separator'
    },
  ]

  if(openedWindows.length > 1) {
    submenu.push({
      label: 'Close',
      accelerator: commandKeys['pane:close'],
      click(item, focusedWindow) {
        execCommand('pane:close', focusedWindow);
      }
    })
  }



  return {
    role: 'window',
    id: 'window',
    submenu
  }
};
