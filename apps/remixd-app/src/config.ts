import fs from 'fs'
import os from 'os'
import path from 'path'

const cacheDir = path.join(os.homedir(), '.cache_remix_ide')

try {
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir)
    }
    if(!fs.existsSync(cacheDir + '/remixconnect.json')) {
        fs.writeFileSync(cacheDir + '/remixconnect.json', JSON.stringify({}))
    }
} catch (e) {
}
export const writeConfig = (data: any) => {
    const cache = readConfig()
    try {
        fs.writeFileSync(cacheDir + '/remixconnect.json', JSON.stringify({ ...cache, ...data }))
    } catch (e) {
        console.error('Can\'t write config file', e)
    }
}

export const readConfig = () => {
    if (fs.existsSync(cacheDir + '/remixconnect.json')) {
        try {
            // read the cache file
            const cache = fs.readFileSync(cacheDir + '/remixconnect.json')
            const data = JSON.parse(cache.toString())
            return data
        } catch (e) {
            console.error('Can\'t read config file', e)
        }
    }
    return undefined
}


