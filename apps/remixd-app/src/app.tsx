import { contextBridge, ipcMain, ipcRenderer } from 'electron';
import { useEffect, useState } from 'react';
import { IAppState } from './state';
import { ServiceList } from './serviceList';

export default function App() {
  const [url, setUrl] = useState('https://remix.ethereum.org');
  const [folder, setFolder] = useState('');

  const [messageList, setMessageList] = useState<string[]>([]);
  const [appState, setAppState] = useState<IAppState>(null)

  const [isRunning, setIsRunning] = useState(false);


  const startRemixd = () => {
    console.log('start remixd', url);
    window.electronAPI.startRemixd(url);
  };

  const stopRemixd = () => {
    console.log('stop remixd', url);
    window.electronAPI.stopRemixd();
  }

  useEffect(() => {
    console.log('appState', appState);
    if (appState) {
      let isRunning: boolean = false
      Object.values(appState.socketConnectionState).map((connectionState) => {
        if (connectionState.connected || connectionState.listening) {
          isRunning = true;
        }
      })
      setIsRunning(isRunning);
    }
  }, [appState])


  const setConnectFolder = (folder: string) => {
    console.log('setFolder', folder);
    window.electronAPI.startWithFolder(folder);
  }

  const setConnectUrl = (url: string) => {
    console.log('setUrl', url);
    window.electronAPI.setUrl(url);
    setUrl(url);
  }

  useEffect(() => {
    // get post message from electron

    window.addEventListener('message', (event) => {
      console.log('message', event.data);
      if (event.data.type) {
        if (event.data.type === 'state') {
          setAppState(event.data.state);
        }
        if (event.data.type === 'message') {
          setMessageList(messageList => [...messageList, event.data.message]);
        }
      }
    })

    window.electronAPI.readCache();

  }, []);


  const getRecentFoldersSelect = () => {
    if (!isRunning && appState.recentFolders && appState.recentFolders.length > 0) {
      return (
        <div className='pb-2'>
          <select className='form-select' value={url} onChange={(e) => setConnectFolder(e.target.value)}>
            <option value=''>Recent folders</option>
            {appState.recentFolders.map((folder) => {
              return <option value={folder}>{folder}</option>
            })}
          </select>
          OR
        </div>
      )
    }
  }

  const exitApp = () => {
    window.electronAPI.exitApp();
  }


  return (
    <>
      <div className='container-fluid'>
        <h1>remixconnect</h1>
        {!isRunning ?
          <>
            <p>Enter the URL of the Remix IDE you want to connect to.</p>
            <select data-id='select_ide' className='form-select' value={url} onChange={(e) => setConnectUrl(e.target.value)}>
              <option value='https://remix.ethereum.org'>https://remix.ethereum.org</option>
              <option value='https://remix-alpha.ethereum.org'>https://remix-alpha.ethereum.org</option>
              <option value='https://remix-beta.ethereum.org'>https://remix-beta.ethereum.org</option>
              <option value='http://localhost:8080'>https://localhost:8080</option>
            </select></> : null}
        <hr></hr>
        {appState && appState.recentFolders && getRecentFoldersSelect()}

        {appState && appState.currentFolder && isRunning ? <div>Current folder: {appState.currentFolder}</div> : null}
        {!isRunning ?
          <input data-id='startBtn' className='btn btn-primary w-100' type='button' value='Browse folder' onClick={() => startRemixd()} /> :
          <input data-id='stopBtn' className='btn btn-danger w-100' type='button' value='STOP' onClick={() => stopRemixd()} />}
        <hr></hr>
        <ServiceList state={appState} />
        <hr></hr>
        
        <ul>
          {messageList.map((message, index) => {
            return <li key={index}>{message}</li>
          })
          }
        </ul>
        <input data-id='exitBtn' className='btn btn-danger' type='button' value='EXIT' onClick={() => exitApp()} />
      </div>
      
    </>
  );
}

