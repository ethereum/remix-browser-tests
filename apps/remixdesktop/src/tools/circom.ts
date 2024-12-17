import { app } from 'electron'
import os from 'os'
import { exec } from 'child_process'
import path from 'path'
import fs, { existsSync } from 'fs'
import axios from 'axios'

async function downloadFile(url: string, dest: string) {
  const writer = fs.createWriteStream(dest)
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      if (process.platform !== 'win32') {
        // Sets permission to make the file executable
        fs.chmod(dest, 0o775, (err) => {
          if (err) {
            reject(`Error making file executable: ${err}`)
          } else {
            resolve(dest)
          }
        })
      }
      resolve(true)
    })
    writer.on('error', reject)
  })
}

export function getInstallationPath(version) {
  const fileNames = {
    win32: 'circom-windows-amd64.exe',
    darwin: 'circom-macos-amd64',
    linux: 'circom-linux-amd64'
  };
  
  return path.join(os.tmpdir(), 'circom-download', version, fileNames[process.platform]);
}

export function getInstallationUrl(version) {
  switch (process.platform) {
  case 'win32':
    return version === 'latest' ? 'https://github.com/iden3/circom/releases/latest/download/circom-windows-amd64.exe' : `https://github.com/iden3/circom/releases/download/${version}/circom-windows-amd64.exe`

  case 'darwin':
    return version === 'latest' ? 'https://github.com/iden3/circom/releases/latest/download/circom-macos-amd64' : `https://github.com/iden3/circom/releases/download/${version}/circom-macos-amd64`

  case 'linux':
    return version === 'latest' ? 'https://github.com/iden3/circom/releases/latest/download/circom-linux-amd64' : `https://github.com/iden3/circom/releases/download/${version}/circom-linux-amd64`
  }
}

export function getLogInputSignalsPath() {

  const tempFilePath = path.join(os.tmpdir(), 'log_input_signals.txt');
  return tempFilePath;
}

export const circomCli = {
  async installCircom (version) {
    const installationPath = getInstallationPath(version)
    const installationUrl = getInstallationUrl(version)

    if (!existsSync(path.dirname(installationPath))) fs.mkdirSync(path.dirname(installationPath), { recursive: true })
    try {
      await downloadFile(installationUrl, installationPath)
    } catch (e) {
      fs.rmSync(installationPath)
      throw new Error(e.message)
    }
  },

  async isCircomInstalled (version) {
    try {
      const installationPath = getInstallationPath(version)
      return existsSync(installationPath)
    } catch (e) {
      return false
    }
  },

  async run (filePath: string, version: string, options?: Record<string, string>) {
    const installationPath = getInstallationPath(version)
    const cmd = `${installationPath} ${filePath} ${Object.keys(options || {}).map((key) => options[key] ? `--${key} ${options[key]}` : `--${key}`).join(' ')}`
    console.log(cmd)
    if(process.platform === 'darwin') {
      const rosettaInstalled = await checkRosettaInstalled();
      if(rosettaInstalled === 'Rosetta is not installed') {
        throw new Error('Rosetta is not installed. Please install Rosetta to run this command.');
      }
    }
    return new Promise((resolve, reject) => {
      exec(cmd, { cwd: os.tmpdir() }, (error, stdout, stderr) => {
        if (error) {
          reject(`${error.message} with error code ${error.code}`)
        } else {
          resolve({ stdout, stderr })
        }
      })
    })
  }
}

export const extractParentFromKey = (key: string):string => {
  if (!key) return
  const keyPath = key.split('/')

  keyPath.pop()

  return keyPath.join('/')
}

export const extractNameFromKey = (key: string): string => {
  if (!key) return
  const keyPath = key.split('/')

  return keyPath[keyPath.length - 1]
}

async function checkRosettaInstalled(): Promise<string> {
  return new Promise((resolve, reject) => {
      exec("/usr/bin/pgrep oahd > /dev/null && echo 'Rosetta is installed' || echo 'Rosetta is not installed'", (error, stdout, stderr) => {
          if (error) {
              reject(`Error: ${stderr}`);
          } else {
              resolve(stdout.trim());
          }
      });
  });
}
